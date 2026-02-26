import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateRepositorySchema } from "@/domains/project/dto/repository.dto";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { repoRepository } from "@/domains/project/infra/prisma-repo.repository";

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

    const repository = await repoRepository.findByIdAndProject(
      repoId,
      projectId
    );

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

    // Check repository exists
    const existingRepo = await repoRepository.findByIdAndProject(
      repoId,
      projectId
    );

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
      await repoRepository.unsetPrimary(projectId, repoId);
    }

    const repository = await repoRepository.update(repoId, {
      ...updateData,
      ...(isPrimary !== undefined && { isPrimary }),
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

    // Check repository exists
    const existingRepo = await repoRepository.findByIdAndProject(
      repoId,
      projectId
    );

    if (!existingRepo) {
      return NextResponse.json(
        { success: false, error: "저장소를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const wasPrimary = existingRepo.isPrimary;

    // Delete the repository
    await repoRepository.delete(repoId);

    // If the deleted repo was primary, set the next oldest repo as primary
    if (wasPrimary) {
      const nextRepo = await repoRepository.findOldestByProject(projectId);

      if (nextRepo) {
        await repoRepository.update(nextRepo.id, { isPrimary: true });
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
