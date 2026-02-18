import { REFUND_POLICY } from "@/config/constants";

export type RefundType = "FULL" | "PRO_RATA";

export interface RefundResult {
  refundAmount: number;
  refundType: RefundType;
  isWithdrawalPeriod: boolean;
  usedDays: number;
  totalDays: number;
  usageRate: number;
}

/**
 * 환불 금액을 계산한다.
 *
 * - 결제일로부터 7일 이내: 전액환불 (전자상거래법 청약철회)
 * - 7일 초과: 사용일수 기반 일할계산, 100원 단위 절사
 */
export function calculateRefundAmount(
  originalAmount: number,
  periodStart: Date,
  periodEnd: Date,
  now?: Date
): RefundResult {
  const current = now ?? new Date();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const usedDays = Math.max(
    0,
    Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isWithdrawalPeriod = usedDays <= REFUND_POLICY.withdrawalPeriodDays;

  if (isWithdrawalPeriod) {
    return {
      refundAmount: originalAmount,
      refundType: "FULL",
      isWithdrawalPeriod: true,
      usedDays,
      totalDays,
      usageRate: totalDays > 0 ? usedDays / totalDays : 0,
    };
  }

  const remainingDays = Math.max(0, totalDays - usedDays);
  const rawRefund = (originalAmount * remainingDays) / totalDays;
  const refundAmount =
    Math.floor(rawRefund / REFUND_POLICY.roundingUnit) *
    REFUND_POLICY.roundingUnit;

  return {
    refundAmount,
    refundType: "PRO_RATA",
    isWithdrawalPeriod: false,
    usedDays,
    totalDays,
    usageRate: totalDays > 0 ? usedDays / totalDays : 0,
  };
}
