import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { canRunAnalysis } from "@/domains/subscription/usecase/subscription-limits";
import { serverEnv } from "@/config/env";

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

    // Check subscription limits for analysis
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
      targetRepository =
        project.repositories.find(
          (r) => r.dockerfileContent || r.composeContent
        ) ?? null;
    }

    // Create new analysis
    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        repositoryId: repositoryId || targetRepository?.id || null,
        branch,
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

    // Trigger sandbox environment creation if repository has build config
    let sandboxTargetUrl: string | null = null;
    if (
      targetRepository?.dockerfileContent ||
      targetRepository?.composeContent
    ) {
      try {
        const sandboxUrl = serverEnv.SANDBOX_API_URL();
        const sandboxResponse = await fetch(`${sandboxUrl}/api/environments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo_url: targetRepository.url || undefined,
            branch,
            dockerfile_content: targetRepository.dockerfileContent || undefined,
            compose_content: targetRepository.composeContent || undefined,
          }),
        });

        if (sandboxResponse.ok) {
          const sandboxData = await sandboxResponse.json();
          sandboxTargetUrl = sandboxData.target_url || null;
          await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
              sandboxContainerId: sandboxData.environment_id || null,
              sandboxStatus: "CREATING",
            },
          });
        } else {
          console.error(
            "Sandbox environment creation failed:",
            await sandboxResponse.text()
          );
        }
      } catch (sandboxError) {
        console.error("Sandbox API call failed:", sandboxError);
      }
    }

    // Trigger security scan via scanner-engine
    try {
      const scannerUrl = serverEnv.SCANNER_API_URL();
      const scanPayload: Record<string, string | undefined> = {
        analysis_id: analysis.id,
        callback_url: `${serverEnv.NEXTAUTH_URL()}/api/analyses/webhook`,
      };

      // Add repo URL for SAST scan
      if (targetRepository?.url) {
        scanPayload.repo_url = targetRepository.url;
        scanPayload.branch = branch;
      }

      // Add target URL for DAST scan (from sandbox response)
      if (sandboxTargetUrl) {
        scanPayload.target_url = sandboxTargetUrl;
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
      } else {
        console.error("Scanner engine call failed:", await scanResponse.text());
      }
    } catch (scanError) {
      console.error("Scanner API call failed:", scanError);
    }

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
