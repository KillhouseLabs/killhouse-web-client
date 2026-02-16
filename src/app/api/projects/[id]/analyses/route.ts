import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { canRunAnalysis } from "@/domains/subscription/usecase/subscription-limits";

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
    let targetRepository = null;
    if (repositoryId) {
      targetRepository = project.repositories.find(
        (r: { id: string }) => r.id === repositoryId
      );
      if (!targetRepository) {
        return NextResponse.json(
          { success: false, error: "저장소를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    }

    // Create new analysis
    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        repositoryId: repositoryId || null,
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
    if (
      targetRepository?.dockerfileContent ||
      targetRepository?.composeContent
    ) {
      try {
        const sandboxUrl =
          process.env.SANDBOX_API_URL || "http://localhost:8000";
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
