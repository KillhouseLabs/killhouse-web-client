import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  createGitHubClient,
  getRepositoryBranches,
} from "@/infrastructure/github/github-client";

interface RouteParams {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { owner, repo } = await params;

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: "owner와 repo 파라미터가 필요합니다" },
        { status: 400 }
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

    const client = createGitHubClient(account.access_token);
    const branches = await getRepositoryBranches(client, owner, repo);

    return NextResponse.json({
      success: true,
      data: {
        branches,
      },
    });
  } catch (error) {
    console.error("GitHub branches error:", error);

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

    if (error instanceof Error && error.message.includes("Not Found")) {
      return NextResponse.json(
        { success: false, error: "저장소를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "브랜치 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
