/**
 * TestPaymentGateway Tests
 *
 * 테스트 환경용 결제 게이트웨이 구현체 BDD 테스트
 */

import { TestPaymentGateway } from "../infra/test-payment-gateway";

describe("TestPaymentGateway", () => {
  let gateway: TestPaymentGateway;

  beforeEach(() => {
    gateway = new TestPaymentGateway();
  });

  describe("verifyClientPayment", () => {
    it("GIVEN 어떤 imp_uid WHEN verifyClientPayment THEN 항상 PAID 반환", async () => {
      // GIVEN
      const impUid = "imp_test_12345";

      // WHEN
      const result = await gateway.verifyClientPayment(impUid);

      // THEN
      expect(result.status).toBe("PAID");
      expect(result.externalPaymentId).toBe(impUid);
      expect(result.amount).toBeGreaterThan(0);
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });

  describe("verifyWebhookPayment", () => {
    it("GIVEN 어떤 paymentId WHEN verifyWebhookPayment THEN 항상 PAID 반환", async () => {
      // GIVEN
      const paymentId = "payment_test_67890";

      // WHEN
      const result = await gateway.verifyWebhookPayment(paymentId);

      // THEN
      expect(result.status).toBe("PAID");
      expect(result.externalPaymentId).toBe(paymentId);
      expect(result.amount).toBeGreaterThan(0);
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });

  describe("refundPayment", () => {
    it("GIVEN 환불 요청 WHEN refundPayment THEN 항상 success + 요청 금액 반환", async () => {
      // GIVEN
      const impUid = "imp_test_12345";
      const amount = 29000;
      const reason = "테스트 환불";

      // WHEN
      const result = await gateway.refundPayment(impUid, amount, reason);

      // THEN
      expect(result.success).toBe(true);
      expect(result.refundedAmount).toBe(amount);
      expect(result.error).toBeUndefined();
    });
  });

  describe("cancelPayment", () => {
    it("GIVEN 취소 요청 WHEN cancelPayment THEN 항상 success", async () => {
      // GIVEN
      const paymentId = "payment_test_67890";
      const reason = "테스트 취소";

      // WHEN
      const result = await gateway.cancelPayment(paymentId, reason);

      // THEN
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
