import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { accountRepository } from "@/domains/auth/infra/prisma-account.repository";

const PROVIDER_CONFIG: Record<
  string,
  {
    tokenUrl: string;
    userInfoUrl: string;
    clientIdEnv: string;
    clientSecretEnv: string;
    extractAccountId: (profile: Record<string, unknown>) => string;
  }
> = {
  github: {
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
    extractAccountId: (profile) => String(profile.id),
  },
  gitlab: {
    tokenUrl: "https://gitlab.com/oauth/token",
    userInfoUrl: "https://gitlab.com/api/v4/user",
    clientIdEnv: "GITLAB_CLIENT_ID",
    clientSecretEnv: "GITLAB_CLIENT_SECRET",
    extractAccountId: (profile) => String(profile.id),
  },
  "gitlab-self": {
    tokenUrl: `${process.env.GITLAB_SELF_URL || "https://gitlab.com"}/oauth/token`,
    userInfoUrl: `${process.env.GITLAB_SELF_URL || "https://gitlab.com"}/api/v4/user`,
    clientIdEnv: "GITLAB_SELF_CLIENT_ID",
    clientSecretEnv: "GITLAB_SELF_CLIENT_SECRET",
    extractAccountId: (profile) => String(profile.id),
  },
};

/**
 * OAuth 계정 링크 콜백 핸들러
 *
 * NextAuth callback URL을 공유하므로, [...nextauth]/route.ts에서
 * oauth-link-state 쿠키 유무로 분기하여 이 함수를 호출합니다.
 */
export async function handleOAuthLinkCallback(
  request: Request,
  provider: string
) {
  const config = PROVIDER_CONFIG[provider];

  if (!config) {
    return redirectWithError("/dashboard", "지원하지 않는 프로바이더입니다");
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // OAuth 에러 처리 (사용자가 취소한 경우 등)
  if (errorParam) {
    const cookieStore = await cookies();
    const metaStr = cookieStore.get("oauth-link-meta")?.value;
    const returnUrl = metaStr ? JSON.parse(metaStr).returnUrl : "/dashboard";
    clearLinkCookies(cookieStore);
    return NextResponse.redirect(new URL(returnUrl, getBaseUrl()));
  }

  if (!code || !state) {
    return redirectWithError("/dashboard", "잘못된 OAuth 응답입니다");
  }

  // state 검증 (CSRF 보호)
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth-link-state")?.value;
  const metaStr = cookieStore.get("oauth-link-meta")?.value;

  if (!savedState || savedState !== state || !metaStr) {
    clearLinkCookies(cookieStore);
    return redirectWithError("/dashboard", "OAuth 상태 검증에 실패했습니다");
  }

  const { userId, returnUrl } = JSON.parse(metaStr);

  // 현재 세션 확인 (링크 시작한 사용자와 동일한지)
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) {
    clearLinkCookies(cookieStore);
    return redirectWithError(
      "/login",
      "세션이 만료되었습니다. 다시 로그인해주세요"
    );
  }

  try {
    // 1. code → access_token 교환
    const clientId = process.env[config.clientIdEnv]!;
    const clientSecret = process.env[config.clientSecretEnv]!;
    const baseUrl = getBaseUrl();
    // NextAuth와 동일한 callback URL 사용 (GitHub OAuth App은 1개만 허용)
    const redirectUri = `${baseUrl}/api/auth/callback/${provider}`;

    const tokenResponse = await fetchAccessToken(
      provider,
      config.tokenUrl,
      clientId,
      clientSecret,
      code,
      redirectUri
    );

    if (!tokenResponse.access_token) {
      clearLinkCookies(cookieStore);
      return redirectWithError(returnUrl, "액세스 토큰을 가져올 수 없습니다");
    }

    // 2. access_token → 사용자 프로필 조회
    const profileResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
        Accept: "application/json",
      },
    });
    const profile = await profileResponse.json();
    const providerAccountId = config.extractAccountId(profile);

    // 3. Account upsert (현재 사용자에게 링크)
    const existingAccount = await accountRepository.findByProviderAccount(
      provider,
      providerAccountId
    );

    if (existingAccount) {
      if (existingAccount.userId !== userId) {
        // 다른 사용자에게 이미 연결된 계정
        clearLinkCookies(cookieStore);
        return redirectWithError(
          returnUrl,
          "이 계정은 다른 사용자에게 이미 연결되어 있습니다"
        );
      }

      // 같은 사용자 → 토큰만 갱신
      await accountRepository.updateById(existingAccount.id, {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        expires_at: tokenResponse.expires_in
          ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
          : null,
        scope: tokenResponse.scope || null,
        token_type: tokenResponse.token_type || "bearer",
      });
    } else {
      // 새 계정 링크
      await accountRepository.create({
        userId,
        type: "oauth",
        provider,
        providerAccountId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        expires_at: tokenResponse.expires_in
          ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
          : null,
        scope: tokenResponse.scope || null,
        token_type: tokenResponse.token_type || "bearer",
      });
    }

    // 4. 쿠키 정리 후 원래 페이지로 리다이렉트
    clearLinkCookies(cookieStore);
    return NextResponse.redirect(new URL(returnUrl, baseUrl));
  } catch (error) {
    console.error("OAuth link callback error:", error);
    clearLinkCookies(cookieStore);
    return redirectWithError(returnUrl, "계정 연결 중 오류가 발생했습니다");
  }
}

async function fetchAccessToken(
  provider: string,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<{
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}> {
  if (provider === "github") {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    return response.json();
  }

  // GitLab uses form-encoded
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  return response.json();
}

function getBaseUrl(): string {
  return (
    process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"
  );
}

function redirectWithError(returnUrl: string, message: string) {
  const baseUrl = getBaseUrl();
  const url = new URL(returnUrl, baseUrl);
  url.searchParams.set("link_error", message);
  return NextResponse.redirect(url);
}

function clearLinkCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete("oauth-link-state");
  cookieStore.delete("oauth-link-meta");
}
