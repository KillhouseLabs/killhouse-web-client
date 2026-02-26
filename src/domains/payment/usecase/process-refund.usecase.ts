/**
 * Process Refund UseCase
 *
 * 환불 처리 오케스트레이션:
 * 결제·구독 조회 → 환불 금액 계산 → PG 환불 → 상태 업데이트 → 구독 취소
 */

import type { PaymentGateway } from "@/domains/payment/model/payment-gateway";
import { paymentRepository } from "@/domains/payment/infra/prisma-payment.repository";
import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { calculateRefundAmount } from "./refund.usecase";
import { cancelSubscription } from "@/domains/subscription/usecase/cancel-subscription.usecase";

export interface ProcessRefundInput {
  userId: string;
  paymentId: string;
  reason?: string;
  fullRefund?: boolean;
}

export interface ProcessRefundResult {
  paymentId: string;
  originalAmount: number;
  refundAmount: number;
  isFullRefund: boolean;
  refundInfo: {
    usedDays: number;
    totalDays: number;
    usageRate: number;
  } | null;
}

export async function processRefund(
  input: ProcessRefundInput,
  gateway: PaymentGateway
): Promise<ProcessRefundResult> {
  const { userId, paymentId, reason, fullRefund } = input;

  // 1. 결제 정보 조회
  const payment = await paymentRepository.findCompletedByIdAndUserId(
    paymentId,
    userId
  );

  if (!payment) {
    throw new RefundError("환불 가능한 결제 내역이 없습니다", 404);
  }

  if (!payment.portonePaymentId) {
    throw new RefundError("PortOne 결제 정보가 없습니다", 400);
  }

  // 2. 구독 정보 조회
  const subscription = await subscriptionRepository.findByUserId(userId);

  if (!subscription) {
    throw new RefundError("구독 정보가 없습니다", 404);
  }

  // 3. 환불 금액 계산
  let refundAmount: number;
  let refundInfo: ProcessRefundResult["refundInfo"] = null;

  if (fullRefund) {
    refundAmount = payment.amount;
  } else if (subscription.currentPeriodEnd) {
    const calculated = calculateRefundAmount(
      payment.amount,
      payment.paidAt ?? subscription.currentPeriodStart,
      subscription.currentPeriodEnd
    );
    refundAmount = calculated.refundAmount;
    refundInfo = {
      usedDays: calculated.usedDays,
      totalDays: calculated.totalDays,
      usageRate: calculated.usageRate,
    };
  } else {
    refundAmount = payment.amount;
  }

  if (refundAmount <= 0) {
    throw new RefundError(
      "환불 가능한 금액이 없습니다 (구독 기간이 거의 종료됨)",
      400
    );
  }

  // 4. PG 환불 처리
  const refundResult = await gateway.refundPayment(
    payment.portonePaymentId,
    refundAmount,
    reason || "사용자 요청에 의한 환불"
  );

  if (!refundResult.success) {
    console.error("[Refund] 환불 실패:", refundResult.error);
    throw new RefundError(refundResult.error || "환불 처리 실패", 400);
  }

  console.log("[Refund] 환불 성공:", refundResult.refundedAmount);

  // 5. 결제 상태 업데이트
  const isFullRefund = refundAmount === payment.amount;
  await paymentRepository.updateStatus(payment.id, {
    status: isFullRefund ? "REFUNDED" : "COMPLETED",
    cancelledAt: new Date(),
    cancelReason:
      reason ||
      `${isFullRefund ? "전액" : "부분"} 환불 (₩${refundAmount.toLocaleString()})`,
  });

  // 6. 구독 취소 (subscription 도메인에 위임)
  await cancelSubscription(userId);

  return {
    paymentId: payment.id,
    originalAmount: payment.amount,
    refundAmount: refundResult.refundedAmount,
    isFullRefund,
    refundInfo,
  };
}

export class RefundError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "RefundError";
  }
}
