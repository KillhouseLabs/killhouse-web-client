import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { createAnalysisWithLimitCheck } from "@/domains/subscription/usecase/subscription-limits";
import { serverEnv } from "@/config/env";
import { orchestrateSandboxAndDast } from "@/lib/sandbox-orchestrator";
import { resilientFetch } from "@/lib/resilient-fetch";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const sastCircuitBreaker = new CircuitBreaker(3, 5 * 60 * 1000);

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

    // Watchdog: auto-fail analyses stuck for more than 30 minutes
    const STUCK_THRESHOLD_MS = 30 * 60 * 1000;
    const TERMINAL_STATUSES = [
      "COMPLETED",
      "COMPLETED_WITH_ERRORS",
      "FAILED",
      "CANCELLED",
    ];
    const now = Date.now();

    const stuckAnalyses = analyses.filter(
      (a) =>
        !TERMINAL_STATUSES.includes(a.status) &&
        now - new Date(a.startedAt).getTime() > STUCK_THRESHOLD_MS
    );

    if (stuckAnalyses.length > 0) {
      Promise.all(
        stuckAnalyses.map((a) =>
          prisma.analysis.update({
            where: { id: a.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
            },
          })
        )
      ).catch((err) => console.error("Watchdog auto-fail error:", err));

      for (const stuck of stuckAnalyses) {
        const target = analyses.find((a) => a.id === stuck.id);
        if (target) {
          (target as Record<string, unknown>).status = "FAILED";
        }
      }
    }

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

    // Add per-user rate limit check for analysis creation
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

    // Fetch repository info for response
    const analysisWithRepository = await prisma.analysis.findUnique({
      where: { id: analysis.id },
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
        data: analysisWithRepository,
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
