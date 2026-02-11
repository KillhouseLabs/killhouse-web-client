import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { getUserProjects } from "@/infrastructure/gitlab/gitlab-client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "gitlab",
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        {
          success: false,
          error: "GitLab 연동이 필요합니다",
          code: "GITLAB_NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = Math.min(
      parseInt(searchParams.get("per_page") || "30", 10),
      100
    );
    const search = searchParams.get("search") || undefined;

    const { projects, hasNext } = await getUserProjects(account.access_token, {
      page,
      per_page: perPage,
      search,
    });

    const repositories = projects.map((project) => ({
      id: project.id,
      name: project.name,
      full_name: project.path_with_namespace,
      private: project.visibility === "private",
      html_url: project.web_url,
      default_branch: project.default_branch || "main",
      updated_at: project.last_activity_at,
      description: project.description,
    }));

    return NextResponse.json({
      success: true,
      data: {
        repositories,
        pagination: {
          page,
          per_page: perPage,
          has_next: hasNext,
        },
      },
    });
  } catch (error) {
    console.error("GitLab repositories error:", error);

    if (error instanceof Error && error.message.includes("Bad credentials")) {
      return NextResponse.json(
        {
          success: false,
          error: "GitLab 토큰이 만료되었습니다. 다시 연동해주세요.",
          code: "GITLAB_TOKEN_EXPIRED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "저장소 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
