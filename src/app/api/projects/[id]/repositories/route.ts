import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRepositorySchema } from "@/domains/project/dto/repository.dto";
import { parseRepoUrl } from "@/domains/project/dto/project.dto";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { repoRepository } from "@/domains/project/infra/prisma-repo.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/repositories - List project repositories
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

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

    const repositories = await repoRepository.findManyByProject(projectId);

    return NextResponse.json({
      success: true,
      data: repositories,
    });
  } catch (error) {
    console.error("List repositories error:", error);
    return NextResponse.json(
      { success: false, error: "저장소 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/repositories - Add repository to project
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

    const body = await request.json();
    const validationResult = createRepositorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const {
      provider,
      url,
      name,
      defaultBranch,
      isPrimary,
      role,
      dockerfileContent,
      composeContent,
      dockerfilePath,
      buildContext,
      targetService,
      accountId,
    } = validationResult.data;

    // Parse repo URL to extract owner
    let owner: string | null = null;
    if (url) {
      const parsed = parseRepoUrl(url);
      if (parsed) {
        owner = parsed.owner;
      }
    }

    // Check for duplicate URL in project
    if (url) {
      const existingRepo = await repoRepository.findDuplicateUrl(
        projectId,
        url
      );

      if (existingRepo) {
        return NextResponse.json(
          { success: false, error: "이미 등록된 저장소 URL입니다" },
          { status: 409 }
        );
      }
    }

    // If isPrimary is true, unset other primary repositories
    if (isPrimary) {
      await repoRepository.unsetPrimary(projectId);
    }

    const repository = await repoRepository.create({
      provider,
      url: url || null,
      owner,
      name,
      defaultBranch,
      isPrimary,
      role: role || null,
      dockerfileContent: dockerfileContent || null,
      composeContent: composeContent || null,
      dockerfilePath: dockerfilePath || null,
      buildContext: buildContext || null,
      targetService: targetService || null,
      accountId: accountId || null,
      uploadKey: null,
      projectId,
    });

    return NextResponse.json(
      {
        success: true,
        data: repository,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create repository error:", error);
    return NextResponse.json(
      { success: false, error: "저장소 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
