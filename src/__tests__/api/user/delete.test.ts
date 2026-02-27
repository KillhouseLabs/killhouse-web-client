/**
 * DELETE /api/user/delete - Account Deletion API Tests
 *
 * 구독 활성 상태 검증 가드 + 계정 삭제 테스트
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock(
  "@/domains/subscription/infra/prisma-subscription.repository",
  () => ({
    subscriptionRepository: {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })
);

jest.mock("@/domains/auth/infra/prisma-user.repository", () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    delete: jest.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { userRepository } from "@/domains/auth/infra/prisma-user.repository";
import { DELETE } from "@/app/api/user/delete/route";

describe("DELETE /api/user/delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("withActiveSubscriptionGuard", () => {
    it("GIVEN 활성 구독 (ACTIVE) WHEN 삭제 요청 THEN 409 반환", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-123" },
      });
      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        status: "ACTIVE",
        planId: "pro",
      });

      // WHEN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await DELETE({} as any, {});
      const data = await response.json();

      // THEN
      expect(response.status).toBe(409);
      expect(data.code).toBe("ACTIVE_SUBSCRIPTION");
    });

    it("GIVEN 체험 구독 (TRIALING) WHEN 삭제 요청 THEN 409 반환", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-123" },
      });
      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        status: "TRIALING",
        planId: "pro",
      });

      // WHEN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await DELETE({} as any, {});
      const data = await response.json();

      // THEN
      expect(response.status).toBe(409);
      expect(data.code).toBe("ACTIVE_SUBSCRIPTION");
    });

    it("GIVEN 취소된 구독 (CANCELLED) WHEN 삭제 요청 THEN 삭제 진행", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-123" },
      });
      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        status: "CANCELLED",
        planId: "free",
      });
      (userRepository.delete as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await DELETE({} as any, {});
      const data = await response.json();

      // THEN
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("GIVEN 구독 없음 (free) WHEN 삭제 요청 THEN 삭제 진행", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-123" },
      });
      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue(
        null
      );
      (userRepository.delete as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await DELETE({} as any, {});
      const data = await response.json();

      // THEN
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("인증 검증", () => {
    it("GIVEN 미인증 사용자 WHEN 삭제 요청 THEN 401 반환", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue(null);

      // WHEN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await DELETE({} as any, {});

      // THEN
      expect(response.status).toBe(401);
    });
  });
});
