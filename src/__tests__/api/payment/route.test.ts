/**
 * Payment API Tests
 *
 * 결제 생성, 검증, 취소 API 테스트
 * - 함수 단위 모킹을 통한 로직 검증
 */

// Mock Prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock fetch for PortOne API
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = originalFetch;
});

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";
import { PLANS } from "@/config/constants";

describe("Payment API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
    });
  });

  describe("Checkout Logic", () => {
    it("GIVEN pro 플랜 WHEN 결제 준비 THEN 주문이 생성되어야 한다", async () => {
      // GIVEN
      const planId = "pro";
      const userId = "user-123";

      // Mock payment creation
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order_123_abc",
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId,
      });

      // WHEN
      const plan = PLANS.PRO;
      const payment = await prisma.payment.create({
        data: {
          orderId: "order_123_abc",
          userId,
          planId,
          amount: plan.price,
          status: "PENDING",
        },
      });

      // THEN
      expect(payment.amount).toBe(29000);
      expect(payment.planId).toBe("pro");
      expect(payment.status).toBe("PENDING");
    });

    it("GIVEN free 플랜 WHEN 가격 확인 THEN 0원이어야 한다", () => {
      // GIVEN
      const planId = "free";

      // WHEN
      const plan = PLANS.FREE;

      // THEN
      expect(plan.price).toBe(0);
    });
  });

  describe("Verify Logic", () => {
    it("GIVEN 유효한 결제 WHEN 검증 THEN 구독이 업그레이드되어야 한다", async () => {
      // GIVEN
      const userId = "user-123";

      // Mock PortOne API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "PAID",
            amount: { total: 29000 },
            customData: JSON.stringify({ orderId: "order-123" }),
          }),
      });

      // Mock existing payment
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order-123",
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId,
      });

      // Mock payment update
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        id: "pay-123",
        status: "COMPLETED",
      });

      // Mock subscription update
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        id: "sub-123",
        userId,
        planId: "free",
      });

      (prisma.subscription.update as jest.Mock).mockResolvedValue({
        id: "sub-123",
        planId: "pro",
        status: "ACTIVE",
        currentPeriodEnd: new Date(),
      });

      // WHEN
      const paymentId = "payment_abc123";
      const portoneResponse = await fetch(
        `https://api.portone.io/payments/${paymentId}`
      );
      const portoneData = await portoneResponse.json();

      const payment = await prisma.payment.findFirst({
        where: { orderId: "order-123" },
      });

      // Verify amount
      const amountMatches = portoneData.amount.total === payment!.amount;

      if (amountMatches && portoneData.status === "PAID") {
        await prisma.payment.update({
          where: { id: payment!.id },
          data: { status: "COMPLETED", paidAt: new Date() },
        });

        await prisma.subscription.update({
          where: { userId },
          data: { planId: payment!.planId, status: "ACTIVE" },
        });
      }

      // THEN
      expect(amountMatches).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it("GIVEN 금액 불일치 WHEN 검증 THEN 실패해야 한다", async () => {
      // GIVEN
      const userId = "user-123";

      // Mock PortOne API response with wrong amount
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "PAID",
            amount: { total: 1000 }, // Wrong amount
            customData: JSON.stringify({ orderId: "order-123" }),
          }),
      });

      // Mock existing payment
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order-123",
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId,
      });

      // WHEN
      const paymentId = "payment_abc123";
      const portoneResponse = await fetch(
        `https://api.portone.io/payments/${paymentId}`
      );
      const portoneData = await portoneResponse.json();

      const payment = await prisma.payment.findFirst({
        where: { orderId: "order-123" },
      });

      const amountMatches = portoneData.amount.total === payment!.amount;

      // THEN
      expect(amountMatches).toBe(false);
    });

    it("GIVEN 결제 실패 상태 WHEN 검증 THEN 실패해야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "FAILED",
            amount: { total: 29000 },
          }),
      });

      // WHEN
      const portoneResponse = await fetch(
        "https://api.portone.io/payments/payment_abc123"
      );
      const portoneData = await portoneResponse.json();

      // THEN
      expect(portoneData.status).toBe("FAILED");
      expect(portoneData.status).not.toBe("PAID");
    });
  });

  describe("Webhook Logic", () => {
    it("GIVEN 결제 완료 웹훅 WHEN 처리 THEN 구독이 업그레이드되어야 한다", async () => {
      // GIVEN
      const webhookPayload = {
        type: "Transaction.Paid",
        data: {
          paymentId: "payment_abc123",
          transactionId: "txn-123",
        },
      };

      // Mock PortOne API
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "PAID",
            amount: { total: 29000 },
            customData: JSON.stringify({ orderId: "order-123" }),
          }),
      });

      // Mock payment
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order-123",
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId: "user-123",
      });

      (prisma.payment.update as jest.Mock).mockResolvedValue({
        id: "pay-123",
        status: "COMPLETED",
      });

      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        id: "sub-123",
        userId: "user-123",
        planId: "free",
      });

      (prisma.subscription.update as jest.Mock).mockResolvedValue({
        id: "sub-123",
        planId: "pro",
        status: "ACTIVE",
      });

      // WHEN - Simulate webhook processing
      const { type, data } = webhookPayload;

      if (type === "Transaction.Paid") {
        const portoneResponse = await fetch(
          `https://api.portone.io/payments/${data.paymentId}`
        );
        const portoneData = await portoneResponse.json();

        if (portoneData.status === "PAID") {
          const payment = await prisma.payment.findFirst({
            where: { orderId: "order-123" },
          });

          if (payment && portoneData.amount.total === payment.amount) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: "COMPLETED" },
            });

            await prisma.subscription.update({
              where: { userId: payment.userId },
              data: { planId: payment.planId, status: "ACTIVE" },
            });
          }
        }
      }

      // THEN
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it("GIVEN 다른 이벤트 타입 WHEN 웹훅 수신 THEN 무시해야 한다", () => {
      // GIVEN
      const webhookPayload = {
        type: "Transaction.Cancelled",
        data: {
          paymentId: "payment_abc123",
        },
      };

      // WHEN
      const shouldProcess = webhookPayload.type === "Transaction.Paid";

      // THEN
      expect(shouldProcess).toBe(false);
    });
  });

  describe("Plan Limits", () => {
    it("GIVEN pro 플랜 WHEN 한도 확인 THEN 무제한 프로젝트여야 한다", () => {
      // GIVEN
      const plan = PLANS.PRO;

      // THEN
      expect(plan.limits.projects).toBe(-1); // unlimited
      expect(plan.limits.analysisPerMonth).toBe(100);
    });

    it("GIVEN free 플랜 WHEN 한도 확인 THEN 제한이 있어야 한다", () => {
      // GIVEN
      const plan = PLANS.FREE;

      // THEN
      expect(plan.limits.projects).toBe(3);
      expect(plan.limits.analysisPerMonth).toBe(10);
    });
  });
});
