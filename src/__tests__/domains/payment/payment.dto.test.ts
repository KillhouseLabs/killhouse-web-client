/**
 * Payment DTO Tests
 *
 * 결제 요청 및 검증 스키마 테스트
 */

import {
  createPaymentSchema,
  verifyPaymentSchema,
  cancelPaymentSchema,
} from "@/domains/payment/dto/payment.dto";

describe("Payment DTO", () => {
  describe("createPaymentSchema", () => {
    describe("planId 필드 검증", () => {
      it("GIVEN pro 플랜 WHEN 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const data = { planId: "pro" };

        // WHEN
        const result = createPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN enterprise 플랜 WHEN 검증 THEN 실패해야 한다 (문의 필요)", () => {
        // GIVEN - enterprise는 price가 -1 (문의 필요)이므로 온라인 결제 불가
        const data = { planId: "enterprise" };

        // WHEN
        const result = createPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN free 플랜 WHEN 검증 THEN 실패해야 한다 (무료는 결제 불필요)", () => {
        // GIVEN
        const data = { planId: "free" };

        // WHEN
        const result = createPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN 빈 planId WHEN 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const data = { planId: "" };

        // WHEN
        const result = createPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(false);
      });
    });
  });

  describe("verifyPaymentSchema", () => {
    describe("paymentId 필드 검증", () => {
      it("GIVEN 유효한 paymentId WHEN 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const data = { paymentId: "payment_abc123" };

        // WHEN
        const result = verifyPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN 빈 paymentId WHEN 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const data = { paymentId: "" };

        // WHEN
        const result = verifyPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(false);
      });
    });

    describe("orderId 필드 검증", () => {
      it("GIVEN orderId 포함 WHEN 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const data = { paymentId: "payment_abc123", orderId: "order_xyz" };

        // WHEN
        const result = verifyPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.orderId).toBe("order_xyz");
        }
      });

      it("GIVEN orderId 미포함 WHEN 검증 THEN 성공해야 한다 (optional)", () => {
        // GIVEN
        const data = { paymentId: "payment_abc123" };

        // WHEN
        const result = verifyPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(true);
      });
    });
  });

  describe("cancelPaymentSchema", () => {
    describe("paymentId 필드 검증", () => {
      it("GIVEN 유효한 paymentId WHEN 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const data = { paymentId: "payment_abc123", reason: "사용자 요청" };

        // WHEN
        const result = cancelPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(true);
      });
    });

    describe("reason 필드 검증", () => {
      it("GIVEN 유효한 사유 WHEN 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const data = { paymentId: "payment_abc123", reason: "환불 요청" };

        // WHEN
        const result = cancelPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN 빈 사유 WHEN 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const data = { paymentId: "payment_abc123", reason: "" };

        // WHEN
        const result = cancelPaymentSchema.safeParse(data);

        // THEN
        expect(result.success).toBe(false);
      });
    });
  });
});
