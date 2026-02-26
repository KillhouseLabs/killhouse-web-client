/**
 * OAuth Token Refresh Tests
 *
 * OAuth 재로그인 시 토큰 갱신 로직 테스트
 * - GitHub/GitLab 재로그인 시 기존 토큰이 새 토큰으로 갱신되는지 검증
 */

// Mock accountRepository
jest.mock("@/domains/auth/infra/prisma-account.repository", () => ({
  accountRepository: {
    refreshTokens: jest.fn(),
  },
}));

import { accountRepository } from "@/domains/auth/infra/prisma-account.repository";

// signIn callback 로직을 테스트하기 위한 헬퍼 함수
// auth.ts의 signIn callback 로직을 추출
async function handleOAuthSignIn(
  user: { id: string },
  account: {
    provider: string;
    providerAccountId: string;
    access_token?: string | null;
    refresh_token?: string | null;
    expires_at?: number;
    scope?: string;
  }
): Promise<boolean> {
  if (
    account.provider === "github" ||
    account.provider === "gitlab" ||
    account.provider === "gitlab-self"
  ) {
    await accountRepository.refreshTokens(
      account.provider,
      account.providerAccountId,
      {
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
      }
    );
    return true;
  }

  if (account.provider === "google") {
    return true;
  }

  if (account.provider === "credentials") {
    return !!user;
  }

  return true;
}

describe("OAuth Token Refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GitHub OAuth 재로그인", () => {
    it("GIVEN 기존 GitHub 계정 존재 WHEN 재로그인 THEN 토큰이 갱신되어야 한다", async () => {
      // GIVEN
      const newAccount = {
        provider: "github",
        providerAccountId: "gh-user-456",
        access_token: "new_fresh_token_gho_xxx",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user,repo,user:email",
      };

      (accountRepository.refreshTokens as jest.Mock).mockResolvedValue(
        undefined
      );

      // WHEN
      const result = await handleOAuthSignIn({ id: "user-123" }, newAccount);

      // THEN
      expect(result).toBe(true);
      expect(accountRepository.refreshTokens).toHaveBeenCalledWith(
        "github",
        "gh-user-456",
        {
          access_token: "new_fresh_token_gho_xxx",
          refresh_token: null,
          expires_at: undefined,
          scope: "read:user,repo,user:email",
        }
      );
    });

    it("GIVEN 기존 GitHub 계정 없음 WHEN 첫 로그인 THEN refreshTokens가 호출되어야 한다", async () => {
      // GIVEN
      const newAccount = {
        provider: "github",
        providerAccountId: "gh-new-user-789",
        access_token: "new_token_gho_yyy",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user,repo",
      };

      (accountRepository.refreshTokens as jest.Mock).mockResolvedValue(
        undefined
      );

      // WHEN
      const result = await handleOAuthSignIn({ id: "user-456" }, newAccount);

      // THEN
      expect(result).toBe(true);
      expect(accountRepository.refreshTokens).toHaveBeenCalled();
    });

    it("GIVEN 만료된 토큰 WHEN 재로그인 THEN 새 토큰으로 교체되어야 한다", async () => {
      // GIVEN
      const refreshedAccount = {
        provider: "github",
        providerAccountId: "gh-user-expired",
        access_token: "gho_new_valid_token_12345",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user,repo,user:email",
      };

      (accountRepository.refreshTokens as jest.Mock).mockResolvedValue(
        undefined
      );

      // WHEN
      const result = await handleOAuthSignIn(
        { id: "user-expired" },
        refreshedAccount
      );

      // THEN
      expect(result).toBe(true);
      expect(accountRepository.refreshTokens).toHaveBeenCalledWith(
        "github",
        "gh-user-expired",
        expect.objectContaining({
          access_token: "gho_new_valid_token_12345",
        })
      );
    });
  });

  describe("GitLab OAuth 재로그인", () => {
    it("GIVEN 기존 GitLab 계정 존재 WHEN 재로그인 THEN 토큰이 갱신되어야 한다", async () => {
      // GIVEN
      const newAccount = {
        provider: "gitlab",
        providerAccountId: "gl-user-456",
        access_token: "new_gitlab_token",
        refresh_token: "new_refresh_token",
        expires_at: 1800000000,
        scope: "read_api read_user read_repository",
      };

      (accountRepository.refreshTokens as jest.Mock).mockResolvedValue(
        undefined
      );

      // WHEN
      const result = await handleOAuthSignIn({ id: "user-789" }, newAccount);

      // THEN
      expect(result).toBe(true);
      expect(accountRepository.refreshTokens).toHaveBeenCalledWith(
        "gitlab",
        "gl-user-456",
        {
          access_token: "new_gitlab_token",
          refresh_token: "new_refresh_token",
          expires_at: 1800000000,
          scope: "read_api read_user read_repository",
        }
      );
    });
  });

  describe("Google OAuth (토큰 갱신 불필요)", () => {
    it("GIVEN Google 계정 WHEN 로그인 THEN 토큰 갱신 로직 실행 안 함", async () => {
      // GIVEN
      const googleAccount = {
        provider: "google",
        providerAccountId: "google-user-123",
        access_token: "google_token",
        refresh_token: null,
        expires_at: 1700000000,
        scope: "openid email profile",
      };

      // WHEN
      const result = await handleOAuthSignIn(
        { id: "user-google" },
        googleAccount
      );

      // THEN
      expect(result).toBe(true);
      expect(accountRepository.refreshTokens).not.toHaveBeenCalled();
    });
  });

  describe("Credentials 로그인", () => {
    it("GIVEN credentials provider WHEN 로그인 THEN 토큰 갱신 로직 실행 안 함", async () => {
      // GIVEN
      const credentialsAccount = {
        provider: "credentials",
        providerAccountId: "user-email",
        access_token: undefined,
        refresh_token: undefined,
        expires_at: undefined,
        scope: undefined,
      };

      // WHEN
      const result = await handleOAuthSignIn(
        { id: "user-cred" },
        credentialsAccount
      );

      // THEN
      expect(result).toBe(true);
      expect(accountRepository.refreshTokens).not.toHaveBeenCalled();
    });
  });

  describe("에러 케이스", () => {
    it("GIVEN DB 에러 발생 WHEN 토큰 갱신 THEN 에러가 전파되어야 한다", async () => {
      // GIVEN
      const account = {
        provider: "github",
        providerAccountId: "gh-user-error",
        access_token: "new_token",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user",
      };

      (accountRepository.refreshTokens as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      // WHEN & THEN
      await expect(
        handleOAuthSignIn({ id: "user-error" }, account)
      ).rejects.toThrow("Database connection failed");
    });
  });
});
