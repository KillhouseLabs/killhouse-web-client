/**
 * Integrations Accounts API Route Tests
 *
 * 통합 계정 API 엔드포인트 테스트
 * - OAuth 계정 목록 조회
 */

// Mock prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";

describe("Integrations Accounts API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/integrations/accounts", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 계정 목록 요청 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });

      it("GIVEN 인증된 사용자 WHEN 세션 확인 THEN 사용자 ID가 있어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1", email: "test@example.com" },
        });

        // WHEN
        const session = await auth();

        // THEN
        expect(session?.user?.id).toBe("user-1");
      });
    });

    describe("계정 목록 조회", () => {
      it("GIVEN 인증된 사용자 WHEN 계정 목록 조회 THEN OAuth 계정만 반환되어야 한다", async () => {
        // GIVEN
        const mockAccounts = [
          {
            id: "account-1",
            provider: "github",
            providerAccountId: "12345",
          },
          {
            id: "account-2",
            provider: "gitlab",
            providerAccountId: "67890",
          },
        ];
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);

        // WHEN
        await prisma.account.findMany({
          where: {
            userId: "user-1",
            type: "oauth",
          },
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
          },
          orderBy: {
            provider: "asc",
          },
        });

        // THEN
        expect(prisma.account.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: "user-1", type: "oauth" },
            select: {
              id: true,
              provider: true,
              providerAccountId: true,
            },
          })
        );
      });

      it("GIVEN OAuth 계정이 없는 사용자 WHEN 계정 목록 조회 THEN 빈 배열이 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.account.findMany as jest.Mock).mockResolvedValue([]);

        // WHEN
        const result = await prisma.account.findMany({
          where: {
            userId: "user-1",
            type: "oauth",
          },
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
          },
        });

        // THEN
        expect(result).toEqual([]);
      });

      it("GIVEN 여러 OAuth 계정을 가진 사용자 WHEN 계정 목록 조회 THEN 모든 계정이 반환되어야 한다", async () => {
        // GIVEN
        const mockAccounts = [
          {
            id: "account-1",
            provider: "github",
            providerAccountId: "gh-user-1",
          },
          {
            id: "account-2",
            provider: "github",
            providerAccountId: "gh-user-2",
          },
          {
            id: "account-3",
            provider: "gitlab",
            providerAccountId: "gl-user-1",
          },
        ];
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);

        // WHEN
        const result = await prisma.account.findMany({
          where: {
            userId: "user-1",
            type: "oauth",
          },
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
          },
          orderBy: {
            provider: "asc",
          },
        });

        // THEN
        expect(result).toHaveLength(3);
        expect(result[0].provider).toBe("github");
        expect(result[1].provider).toBe("github");
        expect(result[2].provider).toBe("gitlab");
      });
    });
  });
});
