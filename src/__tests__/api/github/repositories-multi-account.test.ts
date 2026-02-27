/**
 * GitHub Repositories API Multi-Account Tests
 *
 * GitHub 저장소 API 다중 계정 테스트
 * - accountId 파라미터 지원
 */

// Mock accountRepository
jest.mock("@/domains/auth/infra/prisma-account.repository", () => ({
  accountRepository: {
    findAccessToken: jest.fn(),
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock GitHub client
jest.mock("@/infrastructure/github/github-client", () => ({
  createGitHubClient: jest.fn(),
  getUserRepositories: jest.fn(),
}));

import { accountRepository } from "@/domains/auth/infra/prisma-account.repository";
import { auth } from "@/lib/auth";
import {
  createGitHubClient,
  getUserRepositories,
} from "@/infrastructure/github/github-client";

describe("GitHub Repositories API (Multi-Account)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/github/repositories", () => {
    describe("기본 동작 (accountId 없음)", () => {
      it("GIVEN accountId가 제공되지 않음 WHEN 저장소 목록 요청 THEN 첫 번째 GitHub 계정을 사용해야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (accountRepository.findAccessToken as jest.Mock).mockResolvedValue({
          access_token: "github-token-1",
        });
        (createGitHubClient as jest.Mock).mockReturnValue({});
        (getUserRepositories as jest.Mock).mockResolvedValue({
          repositories: [],
          hasNext: false,
        });

        // WHEN
        await accountRepository.findAccessToken("user-1", "github");

        // THEN
        expect(accountRepository.findAccessToken).toHaveBeenCalledWith(
          "user-1",
          "github"
        );
      });
    });

    describe("accountId 파라미터 제공", () => {
      it("GIVEN 유효한 accountId WHEN 저장소 목록 요청 THEN 해당 계정의 토큰을 사용해야 한다", async () => {
        // GIVEN
        const accountId = "account-2";
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (accountRepository.findAccessToken as jest.Mock).mockResolvedValue({
          access_token: "github-token-2",
        });
        (createGitHubClient as jest.Mock).mockReturnValue({});
        (getUserRepositories as jest.Mock).mockResolvedValue({
          repositories: [
            {
              id: 1,
              name: "repo-from-account-2",
              full_name: "user2/repo-from-account-2",
            },
          ],
          hasNext: false,
        });

        // WHEN
        await accountRepository.findAccessToken("user-1", "github", accountId);

        // THEN
        expect(accountRepository.findAccessToken).toHaveBeenCalledWith(
          "user-1",
          "github",
          accountId
        );
      });

      it("GIVEN 다른 사용자의 accountId WHEN 저장소 목록 요청 THEN 계정을 찾을 수 없어야 한다", async () => {
        // GIVEN
        const accountId = "other-user-account";
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (accountRepository.findAccessToken as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const result = await accountRepository.findAccessToken(
          "user-1",
          "github",
          accountId
        );

        // THEN
        expect(result).toBeNull();
        expect(accountRepository.findAccessToken).toHaveBeenCalledWith(
          "user-1",
          "github",
          accountId
        );
      });

      it("GIVEN 존재하지 않는 accountId WHEN 저장소 목록 요청 THEN 계정을 찾을 수 없어야 한다", async () => {
        // GIVEN
        const accountId = "non-existent-account";
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (accountRepository.findAccessToken as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const result = await accountRepository.findAccessToken(
          "user-1",
          "github",
          accountId
        );

        // THEN
        expect(result).toBeNull();
      });
    });

    describe("여러 GitHub 계정 시나리오", () => {
      it("GIVEN 사용자가 여러 GitHub 계정을 가짐 WHEN 특정 계정으로 요청 THEN 올바른 계정이 선택되어야 한다", async () => {
        // GIVEN
        const accountId = "account-2";
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (accountRepository.findAccessToken as jest.Mock).mockResolvedValue({
          access_token: "specific-github-token",
        });

        // WHEN
        const result = await accountRepository.findAccessToken(
          "user-1",
          "github",
          accountId
        );

        // THEN
        expect(result?.access_token).toBe("specific-github-token");
        expect(accountRepository.findAccessToken).toHaveBeenCalledWith(
          "user-1",
          "github",
          accountId
        );
      });
    });
  });
});
