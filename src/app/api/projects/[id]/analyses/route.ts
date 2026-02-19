import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  canRunAnalysis,
  canStartConcurrentScan,
} from "@/domains/subscription/usecase/subscription-limits";
import { serverEnv } from "@/config/env";
import { orchestrateSandboxAndDast } from "@/lib/sandbox-orchestrator";

// Request validation schema
const startAnalysisSchema = z.object({
  repositoryId: z.string().optional(),
  branch: z.string().default("main"),
  commitHash: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/analyses - List analyses for a project
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
        status: { not: "DELETED" },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const analyses = await prisma.analysis.findMany({
      where: { projectId },
      orderBy: { startedAt: "desc" },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error("List analyses error:", error);
    return NextResponse.json(
      { success: false, error: "분석 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/analyses - Start a new analysis
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check subscription limits: monthly analysis count
    const limitCheck = await canRunAnalysis(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: limitCheck.message,
          code: "LIMIT_EXCEEDED",
          usage: {
            current: limitCheck.currentCount,
            limit: limitCheck.limit,
          },
        },
        { status: 403 }
      );
    }

    // Check policy limits: concurrent scan count
    const concurrentCheck = await canStartConcurrentScan(session.user.id);
    if (!concurrentCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: concurrentCheck.message,
          code: "CONCURRENT_LIMIT_EXCEEDED",
          usage: {
            current: concurrentCheck.currentCount,
            limit: concurrentCheck.limit,
          },
        },
        { status: 429 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
        status: { not: "DELETED" },
      },
      include: {
        repositories: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = startAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { repositoryId, branch, commitHash } = validationResult.data;

    // If repositoryId is provided, verify it belongs to this project
    // Otherwise, auto-select a repository with build config (Dockerfile/Compose)
    let targetRepository: (typeof project.repositories)[number] | null = null;
    if (repositoryId) {
      targetRepository =
        project.repositories.find((r) => r.id === repositoryId) ?? null;
      if (!targetRepository) {
        return NextResponse.json(
          { success: false, error: "저장소를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    } else {
      // Prefer repository with build config, fallback to primary or first repo
      targetRepository =
        project.repositories.find(
          (r) => r.dockerfileContent || r.composeContent
        ) ??
        project.repositories.find((r) => r.isPrimary) ??
        project.repositories[0] ??
        null;
    }

    // Use repository's default branch if user didn't specify one
    const effectiveBranch =
      branch !== "main" ? branch : targetRepository?.defaultBranch || branch;

    // Create new analysis
    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        repositoryId: repositoryId || targetRepository?.id || null,
        branch: effectiveBranch,
        commitHash: commitHash || null,
        status: "PENDING",
      },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    // --- Step 1: SAST 스캔 즉시 호출 (sandbox 무관) ---
    try {
      const scannerUrl = serverEnv.SCANNER_API_URL();
      const scanPayload: Record<string, string | undefined> = {
        analysis_id: analysis.id,
        callback_url: `${serverEnv.NEXTAUTH_URL()}/api/analyses/webhook`,
      };

      if (targetRepository?.url) {
        scanPayload.repo_url = targetRepository.url;
        scanPayload.branch = effectiveBranch;
      }

      const scanResponse = await fetch(`${scannerUrl}/api/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanPayload),
      });

      if (scanResponse.ok) {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: { status: "SCANNING" },
        });
      }
    } catch (scanError) {
      console.error("Scanner API call failed:", scanError);
    }

    // --- Step 2: Sandbox + DAST 백그라운드 실행 ---
    const hasBuildConfig =
      targetRepository?.dockerfileContent ||
      targetRepository?.composeContent ||
      targetRepository?.url;

    if (hasBuildConfig && targetRepository) {
      orchestrateSandboxAndDast(
        analysis.id,
        session.user.id,
        targetRepository,
        effectiveBranch
      ).catch((err) => console.error("Sandbox orchestration failed:", err));
    }

    // --- 201 즉시 반환 ---
    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Start analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 시작 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
