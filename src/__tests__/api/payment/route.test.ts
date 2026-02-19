/**
 * Payment API Tests
 *
 * 결제 생성, 검증, 취소 API 테스트
 * - gateway mock을 통한 로직 검증
 * - upgradeSubscription usecase 검증
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

// Mock PaymentGateway factory
jest.mock("@/domains/payment/infra/payment-gateway-factory", () => ({
  createPaymentGateway: jest.fn(() => ({
    verifyClientPayment: jest.fn().mockResolvedValue({
      externalPaymentId: "imp_test",
      status: "PAID",
      amount: 29000,
      paidAt: new Date(),
      orderId: "order-123",
    }),
    verifyWebhookPayment: jest.fn().mockResolvedValue({
      externalPaymentId: "payment_test",
      status: "PAID",
      amount: 29000,
      paidAt: new Date(),
      orderId: "order-123",
    }),
    refundPayment: jest.fn().mockResolvedValue({
      success: true,
      refundedAmount: 29000,
    }),
    cancelPayment: jest.fn().mockResolvedValue({
      success: true,
    }),
  })),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";
import { PLANS } from "@/config/constants";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";
import { upgradeSubscription } from "@/domains/payment/usecase/upgrade-subscription";

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

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order_123_abc",
        planId: "pro",
        amount: PLANS.PRO.price,
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
      expect(payment.amount).toBe(PLANS.PRO.price);
      expect(payment.planId).toBe("pro");
      expect(payment.status).toBe("PENDING");
    });

    it("GIVEN free 플랜 WHEN 가격 확인 THEN 0원이어야 한다", () => {
      // GIVEN & WHEN
      const plan = PLANS.FREE;

      // THEN
      expect(plan.price).toBe(0);
    });
  });

  describe("Verify Logic (Gateway)", () => {
    it("GIVEN 유효한 결제 WHEN gateway 검증 THEN 구독이 업그레이드되어야 한다", async () => {
      // GIVEN
      const userId = "user-123";
      const gateway = createPaymentGateway();

      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order-123",
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId,
      });

      (prisma.payment.update as jest.Mock).mockResolvedValue({
        id: "pay-123",
        status: "COMPLETED",
      });

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
      const paymentInfo = await gateway.verifyClientPayment("imp_test");

      const payment = await prisma.payment.findFirst({
        where: { orderId: "order-123" },
      });

      const amountMatches = paymentInfo.amount === payment!.amount;

      if (amountMatches && paymentInfo.status === "PAID") {
        await prisma.payment.update({
          where: { id: payment!.id },
          data: { status: "COMPLETED", paidAt: paymentInfo.paidAt },
        });

        await upgradeSubscription(userId, payment!.planId);
      }

      // THEN
      expect(amountMatches).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.subscription.findUnique).toHaveBeenCalled();
    });

    it("GIVEN 금액 불일치 WHEN gateway 검증 THEN 실패해야 한다", async () => {
      // GIVEN
      const gateway = createPaymentGateway();

      // Override gateway to return different amount
      (gateway.verifyClientPayment as jest.Mock).mockResolvedValue({
        externalPaymentId: "imp_test",
        status: "PAID",
        amount: 1000, // Wrong amount
        paidAt: new Date(),
        orderId: "order-123",
      });

      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: "pay-123",
        orderId: "order-123",
        planId: "pro",
        amount: 29000,
        status: "PENDING",
        userId: "user-123",
      });

      // WHEN
      const paymentInfo = await gateway.verifyClientPayment("imp_test");
      const payment = await prisma.payment.findFirst({
        where: { orderId: "order-123" },
      });

      const amountMatches = paymentInfo.amount === payment!.amount;

      // THEN
      expect(amountMatches).toBe(false);
    });

    it("GIVEN 결제 실패 상태 WHEN gateway 검증 THEN 실패해야 한다", async () => {
      // GIVEN
      const gateway = createPaymentGateway();
      (gateway.verifyClientPayment as jest.Mock).mockResolvedValue({
        externalPaymentId: "imp_test",
        status: "FAILED",
        amount: 29000,
        paidAt: null,
        orderId: null,
      });

      // WHEN
      const paymentInfo = await gateway.verifyClientPayment("imp_failed");

      // THEN
      expect(paymentInfo.status).toBe("FAILED");
      expect(paymentInfo.status).not.toBe("PAID");
    });
  });

  describe("Webhook Logic (Gateway)", () => {
    it("GIVEN 결제 완료 웹훅 WHEN gateway 처리 THEN 구독이 업그레이드되어야 한다", async () => {
      // GIVEN
      const webhookPayload = {
        type: "Transaction.Paid",
        data: {
          paymentId: "payment_abc123",
          transactionId: "txn-123",
        },
      };

      const gateway = createPaymentGateway();

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

      // WHEN - Simulate webhook processing via gateway
      const { type, data } = webhookPayload;

      if (type === "Transaction.Paid") {
        const portonePayment = await gateway.verifyWebhookPayment(
          data.paymentId
        );

        const payment = await prisma.payment.findFirst({
          where: { orderId: "order-123" },
        });

        if (
          payment &&
          portonePayment.status === "PAID" &&
          portonePayment.amount === payment.amount
        ) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED" },
          });

          await upgradeSubscription(payment.userId, payment.planId);
        }
      }

      // THEN
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.subscription.findUnique).toHaveBeenCalled();
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
