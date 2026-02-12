/**
 * Payment Webhook API
 *
 * PortOne 결제 웹훅 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { webhookPayloadSchema } from "@/domains/payment/dto/payment.dto";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "test-secret";

interface PortOnePaymentResponse {
  status: string;
  amount: {
    total: number;
  };
  customData?: string;
}

/**
 * PortOne API로 결제 정보 조회
 */
async function getPortOnePayment(
  paymentId: string
): Promise<PortOnePaymentResponse> {
  const response = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`PortOne API Error: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * 구독 업그레이드 처리
 */
async function upgradeSubscription(userId: string, planId: string) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existingSubscription) {
    return prisma.subscription.update({
      where: { userId },
      data: {
        planId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

/**
 * POST /api/payment/webhook
 * PortOne 웹훅 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = webhookPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("[Webhook] Invalid payload:", body);
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const { type, data } = validationResult.data;
    const { paymentId } = data;

    // 결제 완료 이벤트만 처리
    if (type !== "Transaction.Paid") {
      console.log(`[Webhook] Ignored event type: ${type}`);
      return NextResponse.json({ success: true });
    }

    console.log(`[Webhook] Processing payment: ${paymentId}`);

    // PortOne API로 결제 정보 조회
    let portonePayment: PortOnePaymentResponse;
    try {
      portonePayment = await getPortOnePayment(paymentId);
    } catch (error) {
      console.error("[Webhook] PortOne API Error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to verify payment" },
        { status: 500 }
      );
    }

    // customData에서 orderId 추출
    let orderId: string | undefined;
    if (portonePayment.customData) {
      try {
        const customData = JSON.parse(portonePayment.customData);
        orderId = customData.orderId;
      } catch {
        console.error("[Webhook] Failed to parse customData");
      }
    }

    // 내부 결제 레코드 조회
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ portonePaymentId: paymentId }, { orderId: orderId }],
      },
    });

    if (!payment) {
      console.error(`[Webhook] Payment not found: ${paymentId}`);
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // 이미 처리된 결제인지 확인
    if (payment.status === "COMPLETED") {
      console.log(`[Webhook] Payment already completed: ${payment.id}`);
      return NextResponse.json({ success: true });
    }

    // 결제 상태 확인
    if (portonePayment.status !== "PAID") {
      console.error(`[Webhook] Payment not paid: ${portonePayment.status}`);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          portonePaymentId: paymentId,
        },
      });
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // 금액 검증
    if (portonePayment.amount.total !== payment.amount) {
      console.error(
        `[Webhook] Amount mismatch: expected ${payment.amount}, got ${portonePayment.amount.total}`
      );
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          portonePaymentId: paymentId,
        },
      });
      return NextResponse.json(
        { success: false, error: "Amount mismatch" },
        { status: 400 }
      );
    }

    // 결제 성공 처리
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        portonePaymentId: paymentId,
        portoneTransactionId: data.transactionId,
        paidAt: new Date(),
      },
    });

    // 구독 업그레이드
    await upgradeSubscription(payment.userId, payment.planId);

    console.log(`[Webhook] Payment completed: ${payment.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
