/**
 * RefundPolicy — 환불 정책 도메인 모델
 *
 * 전자상거래법 청약철회 기간(7일)과
 * 일할계산 절사 단위(100원)는 결제 도메인 지식이다.
 */

export const REFUND_POLICY = {
  withdrawalPeriodDays: 7,
  roundingUnit: 100,
} as const;
