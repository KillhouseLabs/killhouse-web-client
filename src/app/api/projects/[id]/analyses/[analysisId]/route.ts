import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";

interface RouteParams {
  params: Promise<{ id: string; analysisId: string }>;
}

// GET /api/projects/[id]/analyses/[analysisId] - Get single analysis
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId, analysisId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await projectRepository.findByIdAndUser(
      session.user.id,
      projectId
    );

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const analysis = await analysisRepository.findByIdAndProject(
      analysisId,
      projectId
    );

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "분석을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/analyses/[analysisId] - Cancel analysis
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId, analysisId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (status !== "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "허용되지 않는 상태 변경입니다" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await projectRepository.findByIdAndUser(
      session.user.id,
      projectId
    );

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const analysis = await analysisRepository.findByIdAndProject(
      analysisId,
      projectId
    );

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "분석을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
    if (TERMINAL_STATUSES.includes(analysis.status)) {
      return NextResponse.json(
        { success: false, error: "이미 완료된 분석은 취소할 수 없습니다" },
        { status: 400 }
      );
    }

    const updated = await analysisRepository.update(analysisId, {
      status: "CANCELLED",
      completedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Cancel analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 취소 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
