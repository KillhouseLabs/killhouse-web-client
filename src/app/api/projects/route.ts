import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/domains/project/dto/project.dto";
import {
  addLegacyFields,
  processRepositories,
} from "@/domains/project/model/project";
import {
  authenticatedHandler,
  projectCreationHandler,
  type AuthenticatedContext,
} from "@/lib/api/middleware";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";

// GET /api/projects - List user's projects
export const GET = authenticatedHandler(
  async (request: NextRequest, context: AuthenticatedContext) => {
    const { userId } = context;

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    // Fetch projects and total count in parallel
    const { projects, totalCount } = await projectRepository.findActiveByUser(
      userId,
      { skip, take: limit }
    );

    const projectsWithLegacyFields = projects.map(addLegacyFields);

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page * limit < totalCount;

    return NextResponse.json({
      success: true,
      data: projectsWithLegacyFields,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
      },
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

    const project = await projectRepository.createWithRepositories({
      name,
      description,
      userId,
      repositories: processRepositories(repositories),
    });

    return NextResponse.json(
      {
        success: true,
        data: addLegacyFields(project),
      },
      { status: 201 }
    );
  }
);
