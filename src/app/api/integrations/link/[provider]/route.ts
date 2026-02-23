import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

const PROVIDER_CONFIG: Record<
  string,
  { authUrl: string; clientIdEnv: string; scope: string }
> = {
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    clientIdEnv: "GITHUB_CLIENT_ID",
    scope: "read:user user:email repo",
  },
  gitlab: {
    authUrl: "https://gitlab.com/oauth/authorize",
    clientIdEnv: "GITLAB_CLIENT_ID",
    scope: "read_api read_user read_repository",
  },
  "gitlab-self": {
    authUrl: `${process.env.GITLAB_SELF_URL || "https://gitlab.com"}/oauth/authorize`,
    clientIdEnv: "GITLAB_SELF_CLIENT_ID",
    scope: "read_api read_user read_repository",
  },
};

/**
 * GET /api/integrations/link/[provider]
 *
 * 현재 로그인된 사용자에게 새 OAuth 계정을 링크하기 위한 플로우를 시작합니다.
 * NextAuth의 signIn과 달리 세션을 교체하지 않고, Account 레코드만 추가합니다.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { provider } = await params;

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다" },
      { status: 401 }
    );
  }

  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    return NextResponse.json(
      { success: false, error: "지원하지 않는 프로바이더입니다" },
      { status: 400 }
    );
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: "OAuth 설정이 올바르지 않습니다" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  // CSRF 보호를 위한 state 토큰 생성
  const stateToken = crypto.randomBytes(32).toString("hex");
  const baseUrl =
    process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3001";
  // NextAuth와 동일한 callback URL 사용 (GitHub OAuth App은 1개만 허용)
  const redirectUri = `${baseUrl}/api/auth/callback/${provider}`;

  // state 정보를 쿠키에 저장 (콜백에서 검증용)
  const cookieStore = await cookies();
  cookieStore.set("oauth-link-state", stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10분
    path: "/",
  });
  cookieStore.set(
    "oauth-link-meta",
    JSON.stringify({ userId: session.user.id, returnUrl }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    }
  );

  // OAuth 인증 URL 생성
  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    state: stateToken,
    response_type: "code",
  });

  // GitHub: prompt=consent는 미지원이지만, login 파라미터 없이 보내면
  // 사용자가 GitHub에서 수동으로 계정을 전환할 수 있음
  if (provider === "gitlab" || provider === "gitlab-self") {
    authParams.set("response_type", "code");
  }

  return NextResponse.redirect(`${config.authUrl}?${authParams.toString()}`);
}
