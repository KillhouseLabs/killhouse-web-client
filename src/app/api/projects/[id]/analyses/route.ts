import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { createAnalysisWithLimitCheck } from "@/domains/subscription/usecase/subscription-limits";
import { findStuckAnalysisIds } from "@/domains/analysis/usecase/watchdog";
import { serverEnv } from "@/config/env";
import { orchestrateSandboxAndDast } from "@/domains/analysis/usecase/sandbox-orchestrator";
import { resilientFetch } from "@/lib/resilient-fetch";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const sastCircuitBreaker = new CircuitBreaker(3, 5 * 60 * 1000);

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
          select: { id: true, name: true, provider: true },
        },
      },
    });

    // Watchdog: auto-fail stuck analyses
    const stuckIds = findStuckAnalysisIds(analyses);

    if (stuckIds.length > 0) {
      Promise.all(
        stuckIds.map((id) =>
          prisma.analysis.update({
            where: { id },
            data: { status: "FAILED", completedAt: new Date() },
          })
        )
      ).catch((err) => console.error("Watchdog auto-fail error:", err));

      for (const id of stuckIds) {
        const target = analyses.find((a) => a.id === id);
        if (target) {
          (target as Record<string, unknown>).status = "FAILED";
        }
      }
    }

    return NextResponse.json({ success: true, data: analyses });
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

    // Rate limit check
    const userRateLimit = checkRateLimit(
      session.user.id,
      "analysis-create-user",
      RATE_LIMITS.analysisCreate
    );
    if (!userRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "분석 요청이 너무 빈번합니다. 잠시 후 다시 시도해주세요.",
          code: "RATE_LIMITED",
          retryAfter: userRateLimit.retryAfter,
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
      include: { repositories: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Validate request
    const body = await request.json();
    const validationResult = startAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { repositoryId, branch, commitHash } = validationResult.data;

    // Select target repository
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
      targetRepository =
        project.repositories.find(
          (r) => r.dockerfileContent || r.composeContent
        ) ??
        project.repositories.find((r) => r.isPrimary) ??
        project.repositories[0] ??
        null;
    }

    const effectiveBranch =
      branch !== "main" ? branch : targetRepository?.defaultBranch || branch;

    // Atomic limit check + create
    const result = await createAnalysisWithLimitCheck({
      userId: session.user.id,
      projectId,
      repositoryId: repositoryId || targetRepository?.id || null,
      branch: effectiveBranch,
      commitHash: commitHash || null,
    });

    if (!result.success) {
      const status = result.code === "CONCURRENT_LIMIT_EXCEEDED" ? 429 : 403;
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.code,
          usage: result.usage,
        },
        { status }
      );
    }

    const analysis = result.analysis!;

    const analysisWithRepository = await prisma.analysis.findUnique({
      where: { id: analysis.id },
      include: {
        repository: {
          select: { id: true, name: true, provider: true },
        },
      },
    });

    // SAST scan trigger
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

      const scanResponse = await resilientFetch(
        `${scannerUrl}/api/scans`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scanPayload),
        },
        {
          timeoutMs: 30_000,
          maxRetries: 2,
          retryDelays: [2_000, 5_000],
          circuitBreaker: sastCircuitBreaker,
        }
      );

      if (scanResponse.ok) {
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: { status: "SCANNING" },
        });
      }
    } catch (scanError) {
      console.error("Scanner API call failed after retries:", scanError);
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: { status: "FAILED", completedAt: new Date() },
      });
    }

    // Sandbox + DAST background execution
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

    return NextResponse.json(
      { success: true, data: analysisWithRepository },
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
