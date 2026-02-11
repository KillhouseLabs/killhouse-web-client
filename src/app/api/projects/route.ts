import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  createProjectSchema,
  parseRepoUrl,
} from "@/domains/project/dto/project.dto";

// GET /api/projects - List user's projects
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        status: { not: "DELETED" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { analyses: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { name, description, repoProvider, repoUrl, defaultBranch } =
      validationResult.data;

    // Parse repo URL to extract owner and repo name
    let repoOwner: string | null = null;
    let repoName: string | null = null;
    let provider: string | null = repoProvider || null;

    if (repoUrl) {
      const parsed = parseRepoUrl(repoUrl);
      if (parsed) {
        provider = parsed.provider;
        repoOwner = parsed.owner;
        repoName = parsed.name;
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        repoProvider: provider,
        repoUrl: repoUrl || null,
        repoOwner,
        repoName,
        defaultBranch,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
