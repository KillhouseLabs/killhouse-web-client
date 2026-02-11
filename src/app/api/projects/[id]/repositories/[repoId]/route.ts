import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { updateRepositorySchema } from "@/domains/project/dto/repository.dto";

interface RouteParams {
  params: Promise<{ id: string; repoId: string }>;
}

// GET /api/projects/[id]/repositories/[repoId] - Get single repository
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId, repoId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check project ownership
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

    const repository = await prisma.repository.findFirst({
      where: {
        id: repoId,
        projectId,
      },
      include: {
        _count: {
          select: { analyses: true },
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        { success: false, error: "저장소를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    console.error("Get repository error:", error);
    return NextResponse.json(
      { success: false, error: "저장소 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/repositories/[repoId] - Update repository
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId, repoId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check project ownership
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

    // Check repository exists
    const existingRepo = await prisma.repository.findFirst({
      where: {
        id: repoId,
        projectId,
      },
    });

    if (!existingRepo) {
      return NextResponse.json(
        { success: false, error: "저장소를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updateRepositorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { isPrimary, ...updateData } = validationResult.data;

    // If setting as primary, unset other primary repositories first
    if (isPrimary === true) {
      await prisma.repository.updateMany({
        where: {
          projectId,
          isPrimary: true,
          id: { not: repoId },
        },
        data: { isPrimary: false },
      });
    }

    const repository = await prisma.repository.update({
      where: { id: repoId },
      data: {
        ...updateData,
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });

    return NextResponse.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    console.error("Update repository error:", error);
    return NextResponse.json(
      { success: false, error: "저장소 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/repositories/[repoId] - Delete repository
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId, repoId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check project ownership
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

    // Check repository exists
    const existingRepo = await prisma.repository.findFirst({
      where: {
        id: repoId,
        projectId,
      },
    });

    if (!existingRepo) {
      return NextResponse.json(
        { success: false, error: "저장소를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const wasPrimary = existingRepo.isPrimary;

    // Delete the repository
    await prisma.repository.delete({
      where: { id: repoId },
    });

    // If the deleted repo was primary, set the next oldest repo as primary
    if (wasPrimary) {
      const nextRepo = await prisma.repository.findFirst({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      if (nextRepo) {
        await prisma.repository.update({
          where: { id: nextRepo.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "저장소가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete repository error:", error);
    return NextResponse.json(
      { success: false, error: "저장소 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
