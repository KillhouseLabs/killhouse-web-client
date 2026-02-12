import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import {
  createProjectSchema,
  parseRepoUrl,
} from "@/domains/project/dto/project.dto";
import {
  authenticatedHandler,
  projectCreationHandler,
  type AuthenticatedContext,
} from "@/lib/api/middleware";

// GET /api/projects - List user's projects
export const GET = authenticatedHandler(
  async (_request: NextRequest, context: AuthenticatedContext) => {
    const { userId } = context;

    const projects = await prisma.project.findMany({
      where: {
        userId,
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
  }
);

// POST /api/projects - Create new project
export const POST = projectCreationHandler(
  async (request: NextRequest, context: AuthenticatedContext) => {
    const { userId } = context;

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
        userId,
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
  }
);
