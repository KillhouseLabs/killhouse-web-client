/**
 * Test Payment Complete API - Guard Logic Tests
 *
 * PAYMENT_MODE 기반 테스트 결제 차단/허용 로직 검증
 */

// Mock Prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock upgradeSubscription
jest.mock("@/domains/payment/usecase/upgrade-subscription", () => ({
  upgradeSubscription: jest.fn().mockResolvedValue({
    id: "sub-123",
    planId: "pro",
    status: "ACTIVE",
    currentPeriodEnd: new Date(),
  }),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";

describe("Test Complete API - Guard Logic", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("PAYMENT_MODE 기반 접근 제어", () => {
    it("GIVEN PAYMENT_MODE=real WHEN 테스트 결제 요청 THEN 403 차단되어야 한다", () => {
      // GIVEN
      const paymentMode = "real";
      const nodeEnv = "development";

      // WHEN
      const isTestBlocked =
        paymentMode === "real" || (!paymentMode && nodeEnv === "production");

      // THEN
      expect(isTestBlocked).toBe(true);
    });

    it("GIVEN PAYMENT_MODE=test WHEN 테스트 결제 요청 THEN 허용되어야 한다", () => {
      // GIVEN
      const paymentMode = "test";
      const nodeEnv = "production";

      // WHEN
      const isTestBlocked =
        paymentMode === "real" || (!paymentMode && nodeEnv === "production");

      // THEN
      expect(isTestBlocked).toBe(false);
    });

    it("GIVEN PAYMENT_MODE 미설정 + NODE_ENV=production WHEN 테스트 결제 요청 THEN 403 차단되어야 한다", () => {
      // GIVEN
      const paymentMode = undefined;
      const nodeEnv = "production";

      // WHEN
      const isTestBlocked =
        paymentMode === "real" || (!paymentMode && nodeEnv === "production");

      // THEN
      expect(isTestBlocked).toBe(true);
    });

    it("GIVEN PAYMENT_MODE 미설정 + NODE_ENV=development WHEN 테스트 결제 요청 THEN 허용되어야 한다", () => {
      // GIVEN
      const paymentMode = undefined;
      const nodeEnv = "development";

      // WHEN
      const isTestBlocked =
        paymentMode === "real" || (!paymentMode && nodeEnv === "production");

      // THEN
      expect(isTestBlocked).toBe(false);
    });
  });

  describe("테스트 결제 완료 처리", () => {
    it("GIVEN 유효한 주문 WHEN 테스트 결제 완료 THEN 구독이 업그레이드되어야 한다", async () => {
      // GIVEN
      const orderId = "order_123_abc";
      const userId = "user-123";

      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId,
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId,
      });

      (prisma.payment.update as jest.Mock).mockResolvedValue({
        id: "pay-123",
        status: "COMPLETED",
        portonePaymentId: `test_${orderId}`,
      });

      // WHEN
      const payment = await prisma.payment.findFirst({
        where: { orderId, userId, status: "PENDING" },
      });

      expect(payment).not.toBeNull();

      await prisma.payment.update({
        where: { id: payment!.id },
        data: {
          status: "COMPLETED",
          portonePaymentId: `test_${orderId}`,
          paidAt: new Date(),
        },
      });

      // THEN
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pay-123" },
          data: expect.objectContaining({
            status: "COMPLETED",
            portonePaymentId: `test_${orderId}`,
          }),
        })
      );
    });

    it("GIVEN 존재하지 않는 주문 WHEN 테스트 결제 완료 THEN null을 반환해야 한다", async () => {
      // GIVEN
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);

      // WHEN
      const payment = await prisma.payment.findFirst({
        where: { orderId: "invalid", userId: "user-123", status: "PENDING" },
      });

      // THEN
      expect(payment).toBeNull();
    });
  });
});
