import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { accountRepository } from "@/domains/auth/infra/prisma-account.repository";

const PROVIDER_USER_API: Record<string, string> = {
  github: "https://api.github.com/user",
  gitlab: "https://gitlab.com/api/v4/user",
};

async function fetchProviderUsername(
  provider: string,
  accessToken: string
): Promise<string | null> {
  const url = PROVIDER_USER_API[provider];
  if (!url || !accessToken) return null;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;

    const profile = await response.json();
    return provider === "github" ? profile.login : profile.username;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const accounts = await accountRepository.findOAuthAccounts(session.user.id);

    const accountsWithUsername = await Promise.all(
      accounts.map(async (account) => {
        const username = await fetchProviderUsername(
          account.provider,
          account.access_token || ""
        );
        return {
          id: account.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          username: username || account.providerAccountId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: accountsWithUsername,
    });
  } catch (error) {
    console.error("Accounts list error:", error);

    return NextResponse.json(
      { success: false, error: "계정 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
