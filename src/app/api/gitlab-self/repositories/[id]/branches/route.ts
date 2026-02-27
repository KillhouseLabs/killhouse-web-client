import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { accountRepository } from "@/domains/auth/infra/prisma-account.repository";
import { getProjectBranches } from "@/infrastructure/gitlab/gitlab-client";

interface RouteParams {
  params: Promise<{
    id: string;
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

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 프로젝트 ID입니다" },
        { status: 400 }
      );
    }

    const account = await accountRepository.findAccessToken(
      session.user.id,
      "gitlab-self"
    );

    if (!account?.access_token) {
      return NextResponse.json(
        {
          success: false,
          error: "셀프호스팅 GitLab 연동이 필요합니다",
          code: "GITLAB_SELF_NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    const gitlabSelfUrl = process.env.GITLAB_SELF_URL;
    const branches = await getProjectBranches(
      account.access_token,
      projectId,
      gitlabSelfUrl
    );

    return NextResponse.json({
      success: true,
      data: {
        branches,
      },
    });
  } catch (error) {
    console.error("GitLab Self-Hosted branches error:", error);

    if (error instanceof Error && error.message.includes("Bad credentials")) {
      return NextResponse.json(
        {
          success: false,
          error: "셀프호스팅 GitLab 토큰이 만료되었습니다. 다시 연동해주세요.",
          code: "GITLAB_SELF_TOKEN_EXPIRED",
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("Not Found")) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "브랜치 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
