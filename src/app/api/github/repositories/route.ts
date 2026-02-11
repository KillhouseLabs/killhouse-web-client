import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  createGitHubClient,
  getUserRepositories,
} from "@/infrastructure/github/github-client";

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
        provider: "github",
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub 연동이 필요합니다",
          code: "GITHUB_NOT_CONNECTED",
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
    const sort =
      (searchParams.get("sort") as
        | "created"
        | "updated"
        | "pushed"
        | "full_name") || "updated";
    const search = searchParams.get("search") || "";

    const client = createGitHubClient(account.access_token);
    const { repositories, hasNext } = await getUserRepositories(client, {
      page,
      per_page: perPage,
      sort,
    });

    const filteredRepositories = search
      ? repositories.filter(
          (repo) =>
            repo.name.toLowerCase().includes(search.toLowerCase()) ||
            repo.full_name.toLowerCase().includes(search.toLowerCase())
        )
      : repositories;

    return NextResponse.json({
      success: true,
      data: {
        repositories: filteredRepositories,
        pagination: {
          page,
          per_page: perPage,
          has_next: hasNext,
        },
      },
    });
  } catch (error) {
    console.error("GitHub repositories error:", error);

    if (error instanceof Error && error.message.includes("Bad credentials")) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub 토큰이 만료되었습니다. 다시 연동해주세요.",
          code: "GITHUB_TOKEN_EXPIRED",
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
