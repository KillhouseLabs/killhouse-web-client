/**
 * upgradeSubscription UseCase Tests
 *
 * 구독 업그레이드 로직의 BDD 테스트
 * verify, webhook, test-complete 3곳에 중복되던 로직을 단일 usecase로 추출
 */

jest.mock(
  "@/domains/subscription/infra/prisma-subscription.repository",
  () => ({
    subscriptionRepository: {
      findByUserId: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  })
);

import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { upgradeSubscription } from "../usecase/upgrade-subscription";

describe("upgradeSubscription UseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN 구독이 없는 사용자 WHEN 업그레이드 THEN 새 구독 생성", async () => {
    // GIVEN
    (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue(null);
    (subscriptionRepository.create as jest.Mock).mockResolvedValue({
      id: "sub-new",
      userId: "user-123",
      planId: "pro",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
    });

    // WHEN
    const result = await upgradeSubscription("user-123", "pro");

    // THEN
    expect(subscriptionRepository.findByUserId).toHaveBeenCalledWith(
      "user-123"
    );
    expect(subscriptionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        planId: "pro",
        status: "ACTIVE",
      })
    );
    expect(result.planId).toBe("pro");
    expect(result.status).toBe("ACTIVE");
  });

  it("GIVEN 기존 구독 WHEN 업그레이드 THEN 플랜 변경 + ACTIVE", async () => {
    // GIVEN
    (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
      id: "sub-123",
      userId: "user-123",
      planId: "free",
      status: "ACTIVE",
    });
    (subscriptionRepository.update as jest.Mock).mockResolvedValue({
      id: "sub-123",
      userId: "user-123",
      planId: "pro",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
    });

    // WHEN
    const result = await upgradeSubscription("user-123", "pro");

    // THEN
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({
        planId: "pro",
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      })
    );
    expect(result.planId).toBe("pro");
    expect(result.status).toBe("ACTIVE");
  });

  it("GIVEN 해지 구독 WHEN 재구독 THEN cancelAtPeriodEnd=false", async () => {
    // GIVEN
    (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
      id: "sub-123",
      userId: "user-123",
      planId: "pro",
      status: "CANCELLED",
      cancelAtPeriodEnd: true,
    });
    (subscriptionRepository.update as jest.Mock).mockResolvedValue({
      id: "sub-123",
      userId: "user-123",
      planId: "pro",
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    });

    // WHEN
    const result = await upgradeSubscription("user-123", "pro");

    // THEN
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      })
    );
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.status).toBe("ACTIVE");
  });
});
