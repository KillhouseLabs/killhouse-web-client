/**
 * PaymentGateway Contract Tests
 *
 * 동일 테스트 스위트를 TestPaymentGateway, PortOnePaymentGateway(mocked) 양쪽에 실행
 * 반환 타입이 PaymentInfo, RefundResult, CancelResult 형태인지 검증
 */

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

import type { PaymentGateway } from "../model/payment-gateway";
import { TestPaymentGateway } from "../infra/test-payment-gateway";
import { PortOnePaymentGateway } from "../infra/portone-payment-gateway";

function setupPortOneMocks() {
  (global.fetch as jest.Mock)
    // Token for verifyClientPayment
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          code: 0,
          response: { access_token: "mock-token" },
        }),
    })
    // Payment query for verifyClientPayment
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          code: 0,
          response: {
            imp_uid: "imp_contract",
            merchant_uid: "order_contract",
            status: "paid",
            amount: 29000,
            paid_at: 1700000000,
          },
        }),
    })
    // V2 payment query for verifyWebhookPayment
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "PAID",
          amount: { total: 29000 },
          customData: JSON.stringify({ orderId: "order_contract" }),
        }),
    })
    // Token for refundPayment
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          code: 0,
          response: { access_token: "mock-token" },
        }),
    })
    // Refund response
    .mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          code: 0,
          response: { imp_uid: "imp_contract", cancel_amount: 29000 },
        }),
    })
    // V2 cancel response
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
}

function createGateways(): [string, PaymentGateway, () => void][] {
  return [
    ["TestPaymentGateway", new TestPaymentGateway(), () => {}],
    [
      "PortOnePaymentGateway (mocked)",
      new PortOnePaymentGateway({
        v1ApiKey: "test-key",
        v1ApiSecret: "test-secret",
        v2ApiSecret: "test-v2-secret",
      }),
      setupPortOneMocks,
    ],
  ];
}

describe.each(createGateways())(
  "PaymentGateway Contract: %s",
  (_name, gateway, setupMocks) => {
    beforeEach(() => {
      jest.clearAllMocks();
      setupMocks();
    });

    it("verifyClientPayment -> PaymentInfo 형태", async () => {
      const result = await gateway.verifyClientPayment("imp_contract");

      expect(result).toHaveProperty("externalPaymentId");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("amount");
      expect(result).toHaveProperty("paidAt");
      expect(result).toHaveProperty("orderId");
      expect(typeof result.externalPaymentId).toBe("string");
      expect(["PAID", "FAILED", "CANCELLED", "PENDING"]).toContain(
        result.status
      );
      expect(typeof result.amount).toBe("number");
    });

    it("verifyWebhookPayment -> PaymentInfo 형태", async () => {
      const result = await gateway.verifyWebhookPayment("payment_contract");

      expect(result).toHaveProperty("externalPaymentId");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("amount");
      expect(typeof result.amount).toBe("number");
    });

    it("refundPayment -> RefundResult 형태", async () => {
      const result = await gateway.refundPayment("imp_contract", 29000, "환불");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("refundedAmount");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.refundedAmount).toBe("number");
    });

    it("cancelPayment -> CancelResult 형태", async () => {
      const result = await gateway.cancelPayment("payment_contract", "취소");

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });
  }
);
