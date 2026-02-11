import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { updateProjectSchema } from "@/domains/project/dto/project.dto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get single project
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "DELETED" },
      },
      include: {
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        analyses: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
        _count: {
          select: { analyses: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Add backward compatibility fields
    const primaryRepo = project.repositories.find((r) => r.isPrimary);
    const projectWithLegacyFields = {
      ...project,
      repoProvider: primaryRepo?.provider || null,
      repoUrl: primaryRepo?.url || null,
      repoOwner: primaryRepo?.owner || null,
      repoName: primaryRepo?.name || null,
      defaultBranch: primaryRepo?.defaultBranch || "main",
    };

    return NextResponse.json({
      success: true,
      data: projectWithLegacyFields,
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "DELETED" },
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: validationResult.data,
      include: {
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    // Add backward compatibility fields
    const primaryRepo = project.repositories.find((r) => r.isPrimary);
    const projectWithLegacyFields = {
      ...project,
      repoProvider: primaryRepo?.provider || null,
      repoUrl: primaryRepo?.url || null,
      repoOwner: primaryRepo?.owner || null,
      repoName: primaryRepo?.name || null,
      defaultBranch: primaryRepo?.defaultBranch || "main",
    };

    return NextResponse.json({
      success: true,
      data: projectWithLegacyFields,
    });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Soft delete project
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "DELETED" },
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.project.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({
      success: true,
      message: "프로젝트가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
