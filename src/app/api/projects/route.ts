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
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        _count: {
          select: { analyses: true },
        },
      },
    });

    // Add backward compatibility fields computed from primary repository
    const projectsWithLegacyFields = projects.map((project) => {
      const primaryRepo = project.repositories.find((r) => r.isPrimary);
      return {
        ...project,
        // Legacy fields for backward compatibility
        repoProvider: primaryRepo?.provider || null,
        repoUrl: primaryRepo?.url || null,
        repoOwner: primaryRepo?.owner || null,
        repoName: primaryRepo?.name || null,
        defaultBranch: primaryRepo?.defaultBranch || "main",
      };
    });

    return NextResponse.json({
      success: true,
      data: projectsWithLegacyFields,
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

    const { name, description, repositories } = validationResult.data;

    // Process repositories: parse URLs and ensure first one is primary
    const processedRepositories = repositories.map((repo, index) => {
      let owner: string | null = null;
      if (repo.url) {
        const parsed = parseRepoUrl(repo.url);
        if (parsed) {
          owner = parsed.owner;
        }
      }

      return {
        provider: repo.provider,
        url: repo.url || null,
        owner,
        name: repo.name,
        defaultBranch: repo.defaultBranch,
        // First repository is primary by default, or use provided value
        isPrimary: index === 0 ? (repo.isPrimary ?? true) : repo.isPrimary,
        role: repo.role,
      };
    });

    // Ensure only one repository is marked as primary
    const hasPrimary = processedRepositories.some((r) => r.isPrimary);
    if (processedRepositories.length > 0 && !hasPrimary) {
      processedRepositories[0].isPrimary = true;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: session.user.id,
        repositories: {
          create: processedRepositories,
        },
      },
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

    return NextResponse.json(
      {
        success: true,
        data: projectWithLegacyFields,
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
