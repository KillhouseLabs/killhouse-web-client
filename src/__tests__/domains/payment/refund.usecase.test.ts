/**
 * Refund UseCase Tests
 *
 * 청약철회(7일) 및 일할계산 환불 로직 테스트
 */

import { calculateRefundAmount } from "@/domains/payment/usecase/refund.usecase";

describe("calculateRefundAmount", () => {
  // 30일 구독 기간 기준 테스트 데이터
  const originalAmount = 29000;
  const periodStart = new Date("2025-01-01T00:00:00Z");
  const periodEnd = new Date("2025-01-31T00:00:00Z"); // 30일

  describe("7일 이내 청약철회 → 전액환불", () => {
    it("GIVEN 결제 당일(0일) WHEN 환불 요청 THEN 전액환불되어야 한다", () => {
      // GIVEN
      const now = new Date("2025-01-01T12:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundAmount).toBe(originalAmount);
      expect(result.refundType).toBe("FULL");
      expect(result.isWithdrawalPeriod).toBe(true);
    });

    it("GIVEN 결제 3일 후 WHEN 환불 요청 THEN 전액환불되어야 한다", () => {
      // GIVEN
      const now = new Date("2025-01-04T12:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundAmount).toBe(originalAmount);
      expect(result.refundType).toBe("FULL");
      expect(result.isWithdrawalPeriod).toBe(true);
    });

    it("GIVEN 결제 7일째 (경계값) WHEN 환불 요청 THEN 전액환불되어야 한다", () => {
      // GIVEN - 7일째 = 1월 8일 (0일부터 시작하여 7일 경과)
      const now = new Date("2025-01-08T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundAmount).toBe(originalAmount);
      expect(result.refundType).toBe("FULL");
      expect(result.isWithdrawalPeriod).toBe(true);
      expect(result.usedDays).toBe(7);
    });
  });

  describe("7일 초과 → 일할계산 환불", () => {
    it("GIVEN 결제 8일째 (경계값) WHEN 환불 요청 THEN 일할계산 환불되어야 한다", () => {
      // GIVEN - 8일째 = 1월 9일
      const now = new Date("2025-01-09T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundType).toBe("PRO_RATA");
      expect(result.isWithdrawalPeriod).toBe(false);
      expect(result.refundAmount).toBeLessThan(originalAmount);
      expect(result.usedDays).toBe(8);
    });

    it("GIVEN 결제 15일 후 WHEN 환불 요청 THEN 약 절반 환불되어야 한다", () => {
      // GIVEN
      const now = new Date("2025-01-16T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundType).toBe("PRO_RATA");
      expect(result.isWithdrawalPeriod).toBe(false);
      expect(result.usedDays).toBe(15);
      // 남은 15일/30일 = 50% → 29000 * 15/30 = 14500 → 14500 (100원 절사)
      expect(result.refundAmount).toBe(14500);
    });

    it("GIVEN 구독 종료 직전 (29일) WHEN 환불 요청 THEN 최소 금액 환불되어야 한다", () => {
      // GIVEN
      const now = new Date("2025-01-30T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundType).toBe("PRO_RATA");
      expect(result.isWithdrawalPeriod).toBe(false);
      expect(result.usedDays).toBe(29);
      // 남은 1일/30일 → 29000 * 1/30 = 966.67 → 900 (100원 절사)
      expect(result.refundAmount).toBe(900);
    });
  });

  describe("100원 단위 절사", () => {
    it("GIVEN 일할계산 결과가 100원 미만 단위 포함 WHEN 환불 계산 THEN 100원 단위로 절사되어야 한다", () => {
      // GIVEN - 10일 사용, 29000원, 30일 기간
      const now = new Date("2025-01-11T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      // 남은 20일/30일 → 29000 * 20/30 = 19333.33 → 19300 (100원 절사)
      expect(result.refundAmount).toBe(19300);
      expect(result.refundAmount % 100).toBe(0);
    });

    it("GIVEN 어떤 일할계산이든 WHEN 환불 계산 THEN 100원 단위여야 한다", () => {
      // GIVEN - 여러 날짜에 대해 테스트
      const testDays = [8, 10, 12, 17, 20, 25, 28];

      for (const day of testDays) {
        const now = new Date(
          `2025-01-${String(day + 1).padStart(2, "0")}T00:00:00Z`
        );

        // WHEN
        const result = calculateRefundAmount(
          originalAmount,
          periodStart,
          periodEnd,
          now
        );

        // THEN
        expect(result.refundAmount % 100).toBe(0);
      }
    });
  });

  describe("구독 기간 종료 후", () => {
    it("GIVEN 구독 기간이 종료된 상태 WHEN 환불 요청 THEN 환불액이 0이어야 한다", () => {
      // GIVEN
      const now = new Date("2025-02-01T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result.refundAmount).toBe(0);
      expect(result.refundType).toBe("PRO_RATA");
    });
  });

  describe("반환 객체 구조", () => {
    it("GIVEN 유효한 입력 WHEN 환불 계산 THEN 필수 필드가 모두 포함되어야 한다", () => {
      // GIVEN
      const now = new Date("2025-01-10T00:00:00Z");

      // WHEN
      const result = calculateRefundAmount(
        originalAmount,
        periodStart,
        periodEnd,
        now
      );

      // THEN
      expect(result).toHaveProperty("refundAmount");
      expect(result).toHaveProperty("refundType");
      expect(result).toHaveProperty("isWithdrawalPeriod");
      expect(result).toHaveProperty("usedDays");
      expect(result).toHaveProperty("totalDays");
      expect(result).toHaveProperty("usageRate");
      expect(typeof result.refundAmount).toBe("number");
      expect(typeof result.usageRate).toBe("number");
    });
  });

  describe("now 파라미터 기본값", () => {
    it("GIVEN now 미전달 WHEN 환불 계산 THEN 현재 시각 기준으로 계산되어야 한다", () => {
      // GIVEN - 미래의 기간으로 설정하여 현재 시각이 기간 시작 전이 되도록
      const futureStart = new Date("2099-01-01T00:00:00Z");
      const futureEnd = new Date("2099-01-31T00:00:00Z");

      // WHEN - now 미전달
      const result = calculateRefundAmount(
        originalAmount,
        futureStart,
        futureEnd
      );

      // THEN - 현재 시각은 2099년 이전이므로 0일 사용 → 전액환불 (청약철회)
      expect(result.refundAmount).toBe(originalAmount);
      expect(result.isWithdrawalPeriod).toBe(true);
    });
  });
});
