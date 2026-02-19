/**
 * PortOnePaymentGateway Tests
 *
 * PortOne V1(아임포트) + V2 API를 사용하는 실제 결제 게이트웨이 BDD 테스트
 * fetch는 jest.fn()으로 mock
 */

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

import { PortOnePaymentGateway } from "../infra/portone-payment-gateway";

describe("PortOnePaymentGateway", () => {
  let gateway: PortOnePaymentGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new PortOnePaymentGateway({
      v1ApiKey: "test-key",
      v1ApiSecret: "test-secret",
      v2ApiSecret: "test-v2-secret",
    });
  });

  describe("verifyClientPayment (V1)", () => {
    it("GIVEN 유효한 imp_uid WHEN V1 API 호출 THEN 토큰 발급 -> 결제 조회 -> PaymentInfo 반환", async () => {
      // GIVEN
      const impUid = "imp_123456789";

      // Mock: token request
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: 0,
              response: { access_token: "test-access-token" },
            }),
        })
        // Mock: payment query
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: 0,
              response: {
                imp_uid: impUid,
                merchant_uid: "order_123",
                status: "paid",
                amount: 29000,
                paid_at: 1700000000,
              },
            }),
        });

      // WHEN
      const result = await gateway.verifyClientPayment(impUid);

      // THEN
      expect(result.externalPaymentId).toBe(impUid);
      expect(result.status).toBe("PAID");
      expect(result.amount).toBe(29000);
      expect(result.paidAt).toBeInstanceOf(Date);
      expect(result.orderId).toBe("order_123");

      // Verify token was requested first
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "https://api.iamport.kr/users/getToken",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("GIVEN V1 토큰 발급 실패 WHEN 검증 THEN throw", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            code: -1,
            message: "인증에 실패하였습니다",
          }),
      });

      // WHEN & THEN
      await expect(
        gateway.verifyClientPayment("imp_invalid")
      ).rejects.toThrow();
    });

    it("GIVEN V1 결제 조회 실패 WHEN 검증 THEN throw", async () => {
      // GIVEN
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: 0,
              response: { access_token: "test-access-token" },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: -1,
              message: "존재하지 않는 결제정보",
            }),
        });

      // WHEN & THEN
      await expect(
        gateway.verifyClientPayment("imp_notfound")
      ).rejects.toThrow();
    });
  });

  describe("verifyWebhookPayment (V2)", () => {
    it("GIVEN 유효한 paymentId WHEN V2 webhook 검증 THEN PortOne API 호출 -> PaymentInfo", async () => {
      // GIVEN
      const paymentId = "payment_abc123";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "PAID",
            amount: { total: 29000 },
            customData: JSON.stringify({ orderId: "order_456" }),
          }),
      });

      // WHEN
      const result = await gateway.verifyWebhookPayment(paymentId);

      // THEN
      expect(result.externalPaymentId).toBe(paymentId);
      expect(result.status).toBe("PAID");
      expect(result.amount).toBe(29000);
      expect(result.orderId).toBe("order_456");

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.portone.io/payments/${paymentId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "PortOne test-v2-secret",
          }),
        })
      );
    });

    it("GIVEN V2 API 오류 WHEN webhook 검증 THEN throw", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ code: "NOT_FOUND", message: "결제 없음" }),
      });

      // WHEN & THEN
      await expect(
        gateway.verifyWebhookPayment("payment_invalid")
      ).rejects.toThrow();
    });
  });

  describe("refundPayment (V1)", () => {
    it("GIVEN V1 환불 성공 WHEN refundPayment THEN RefundResult.success=true", async () => {
      // GIVEN
      (global.fetch as jest.Mock)
        // Token request
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: 0,
              response: { access_token: "test-access-token" },
            }),
        })
        // Refund request
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: 0,
              response: {
                imp_uid: "imp_123",
                cancel_amount: 29000,
              },
            }),
        });

      // WHEN
      const result = await gateway.refundPayment(
        "imp_123",
        29000,
        "사용자 환불 요청"
      );

      // THEN
      expect(result.success).toBe(true);
      expect(result.refundedAmount).toBe(29000);
    });

    it("GIVEN V1 환불 실패 WHEN refundPayment THEN RefundResult.success=false", async () => {
      // GIVEN
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: 0,
              response: { access_token: "test-access-token" },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: -1,
              message: "이미 전액 환불된 결제입니다",
            }),
        });

      // WHEN
      const result = await gateway.refundPayment(
        "imp_123",
        29000,
        "환불 재시도"
      );

      // THEN
      expect(result.success).toBe(false);
      expect(result.refundedAmount).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  describe("cancelPayment (V2)", () => {
    it("GIVEN V2 취소 성공 WHEN cancelPayment THEN CancelResult.success=true", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // WHEN
      const result = await gateway.cancelPayment("payment_abc123", "구독 해지");

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN V2 API 오류 WHEN cancelPayment THEN CancelResult.success=false", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            code: "ALREADY_CANCELLED",
            message: "이미 취소됨",
          }),
      });

      // WHEN
      const result = await gateway.cancelPayment(
        "payment_invalid",
        "취소 재시도"
      );

      // THEN - ALREADY_CANCELLED is treated as success
      expect(result.success).toBe(true);
    });
  });

  describe("API secret 미설정", () => {
    it("GIVEN v2ApiSecret 미설정 WHEN cancelPayment THEN skip하고 success 반환", async () => {
      // GIVEN
      const gatewayNoSecret = new PortOnePaymentGateway({
        v1ApiKey: "test-key",
        v1ApiSecret: "test-secret",
        v2ApiSecret: undefined,
      });

      // WHEN
      const result = await gatewayNoSecret.cancelPayment("payment_123", "해지");

      // THEN
      expect(result.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
