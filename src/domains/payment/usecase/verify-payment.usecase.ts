/**
 * Verify Payment UseCase
 *
 * PG 결제 검증 → 결제 상태 갱신 → 구독 업그레이드
 */

import { prisma } from "@/infrastructure/database/prisma";
import type { PaymentGateway } from "@/domains/payment/model/payment-gateway";
import { upgradeSubscription } from "./upgrade-subscription";

export interface VerifyPaymentInput {
  userId: string;
  impUid: string;
  merchantUid: string;
}

export interface VerifyPaymentResult {
  payment: { id: string; status: string };
  subscription: {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: Date | null;
  } | null;
}

export async function verifyPayment(
  input: VerifyPaymentInput,
  gateway: PaymentGateway
): Promise<VerifyPaymentResult> {
  const { userId, impUid, merchantUid } = input;

  // PG 결제 정보 검증
  const paymentInfo = await gateway.verifyClientPayment(impUid);

  // 내부 결제 레코드 조회
  const payment = await prisma.payment.findFirst({
    where: { orderId: merchantUid, userId },
  });

  if (!payment) {
    throw new VerifyPaymentError("결제 정보를 찾을 수 없습니다", 404);
  }

  // 이미 처리된 결제 → 멱등성 보장
  if (payment.status === "COMPLETED") {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    return {
      payment: { id: payment.id, status: payment.status },
      subscription: subscription
        ? {
            id: subscription.id,
            planId: subscription.planId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    };
  }

  // 결제 상태 확인
  if (paymentInfo.status !== "PAID") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", portonePaymentId: impUid },
    });
    throw new VerifyPaymentError(
      "결제가 완료되지 않았습니다",
      400,
      "PAYMENT_NOT_COMPLETED"
    );
  }

  // 금액 검증
  if (paymentInfo.amount !== payment.amount) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", portonePaymentId: impUid },
    });
    throw new VerifyPaymentError(
      "결제 금액이 일치하지 않습니다",
      400,
      "AMOUNT_MISMATCH"
    );
  }

  // 결제 성공 처리
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      portonePaymentId: impUid,
      paidAt: paymentInfo.paidAt,
    },
  });

  // 구독 업그레이드
  const subscription = await upgradeSubscription(userId, payment.planId);

  return {
    payment: { id: payment.id, status: "COMPLETED" },
    subscription: {
      id: subscription.id,
      planId: subscription.planId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
  };
}

export class VerifyPaymentError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "VerifyPaymentError";
  }
}
