/**
 * OAuth Token Refresh Tests
 *
 * OAuth 재로그인 시 토큰 갱신 로직 테스트
 * - GitHub/GitLab 재로그인 시 기존 토큰이 새 토큰으로 갱신되는지 검증
 */

import { prisma } from "@/infrastructure/database/prisma";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

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
  if (account.provider === "github" || account.provider === "gitlab") {
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: (existingAccount as { id: string }).id },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope,
        },
      });
    }
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
      const existingAccount = {
        id: "account-123",
        provider: "github",
        providerAccountId: "gh-user-456",
        access_token: "old_token_expired",
        scope: "read:user,repo",
      };

      const newAccount = {
        provider: "github",
        providerAccountId: "gh-user-456",
        access_token: "new_fresh_token_gho_xxx",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user,repo,user:email",
      };

      (prisma.account.findFirst as jest.Mock).mockResolvedValue(
        existingAccount
      );
      (prisma.account.update as jest.Mock).mockResolvedValue({
        ...existingAccount,
        access_token: newAccount.access_token,
        scope: newAccount.scope,
      });

      // WHEN
      const result = await handleOAuthSignIn({ id: "user-123" }, newAccount);

      // THEN
      expect(result).toBe(true);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          provider: "github",
          providerAccountId: "gh-user-456",
        },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "account-123" },
        data: {
          access_token: "new_fresh_token_gho_xxx",
          refresh_token: null,
          expires_at: undefined,
          scope: "read:user,repo,user:email",
        },
      });
    });

    it("GIVEN 기존 GitHub 계정 없음 WHEN 첫 로그인 THEN 토큰 갱신 시도 안 함", async () => {
      // GIVEN
      const newAccount = {
        provider: "github",
        providerAccountId: "gh-new-user-789",
        access_token: "new_token_gho_yyy",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user,repo",
      };

      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      // WHEN
      const result = await handleOAuthSignIn({ id: "user-456" }, newAccount);

      // THEN
      expect(result).toBe(true);
      expect(prisma.account.findFirst).toHaveBeenCalled();
      expect(prisma.account.update).not.toHaveBeenCalled();
    });

    it("GIVEN 만료된 토큰 WHEN 재로그인 THEN 새 토큰으로 교체되어야 한다", async () => {
      // GIVEN
      const existingAccount = {
        id: "account-expired",
        provider: "github",
        providerAccountId: "gh-user-expired",
        access_token: "gho_expired_token_bad_credentials",
        scope: "read:user",
      };

      const refreshedAccount = {
        provider: "github",
        providerAccountId: "gh-user-expired",
        access_token: "gho_new_valid_token_12345",
        refresh_token: null,
        expires_at: undefined,
        scope: "read:user,repo,user:email",
      };

      (prisma.account.findFirst as jest.Mock).mockResolvedValue(
        existingAccount
      );
      (prisma.account.update as jest.Mock).mockResolvedValue({
        ...existingAccount,
        access_token: refreshedAccount.access_token,
      });

      // WHEN
      const result = await handleOAuthSignIn(
        { id: "user-expired" },
        refreshedAccount
      );

      // THEN
      expect(result).toBe(true);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "account-expired" },
        data: expect.objectContaining({
          access_token: "gho_new_valid_token_12345",
        }),
      });
    });
  });

  describe("GitLab OAuth 재로그인", () => {
    it("GIVEN 기존 GitLab 계정 존재 WHEN 재로그인 THEN 토큰이 갱신되어야 한다", async () => {
      // GIVEN
      const existingAccount = {
        id: "gitlab-account-123",
        provider: "gitlab",
        providerAccountId: "gl-user-456",
        access_token: "old_gitlab_token",
        refresh_token: "old_refresh_token",
        expires_at: 1700000000,
        scope: "read_api",
      };

      const newAccount = {
        provider: "gitlab",
        providerAccountId: "gl-user-456",
        access_token: "new_gitlab_token",
        refresh_token: "new_refresh_token",
        expires_at: 1800000000,
        scope: "read_api read_user read_repository",
      };

      (prisma.account.findFirst as jest.Mock).mockResolvedValue(
        existingAccount
      );
      (prisma.account.update as jest.Mock).mockResolvedValue({
        ...existingAccount,
        ...newAccount,
      });

      // WHEN
      const result = await handleOAuthSignIn({ id: "user-789" }, newAccount);

      // THEN
      expect(result).toBe(true);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "gitlab-account-123" },
        data: {
          access_token: "new_gitlab_token",
          refresh_token: "new_refresh_token",
          expires_at: 1800000000,
          scope: "read_api read_user read_repository",
        },
      });
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
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
      expect(prisma.account.update).not.toHaveBeenCalled();
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
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
      expect(prisma.account.update).not.toHaveBeenCalled();
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

      (prisma.account.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      // WHEN & THEN
      await expect(
        handleOAuthSignIn({ id: "user-error" }, account)
      ).rejects.toThrow("Database connection failed");
    });
  });
});
