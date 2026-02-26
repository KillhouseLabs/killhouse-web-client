/**
 * Payment Webhook API
 *
 * PortOne 결제 웹훅 처리
 * gateway.verifyWebhookPayment()으로 PG 검증 위임
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentRepository } from "@/domains/payment/infra/prisma-payment.repository";
import { webhookPayloadSchema } from "@/domains/payment/dto/payment.dto";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";
import { upgradeSubscription } from "@/domains/payment/usecase/upgrade-subscription";

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

    // gateway를 통한 결제 검증
    const gateway = createPaymentGateway();
    let portonePayment;
    try {
      portonePayment = await gateway.verifyWebhookPayment(paymentId);
    } catch (error) {
      console.error("[Webhook] PortOne API Error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to verify payment" },
        { status: 500 }
      );
    }

    // 내부 결제 레코드 조회
    const payment = await paymentRepository.findByPortonePaymentIdOrOrderId(
      paymentId,
      portonePayment.orderId ?? undefined
    );

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
      await paymentRepository.updateStatus(payment.id, {
        status: "FAILED",
        portonePaymentId: paymentId,
      });
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // 금액 검증
    if (portonePayment.amount !== payment.amount) {
      console.error(
        `[Webhook] Amount mismatch: expected ${payment.amount}, got ${portonePayment.amount}`
      );
      await paymentRepository.updateStatus(payment.id, {
        status: "FAILED",
        portonePaymentId: paymentId,
      });
      return NextResponse.json(
        { success: false, error: "Amount mismatch" },
        { status: 400 }
      );
    }

    // 결제 성공 처리
    await paymentRepository.updateStatus(payment.id, {
      status: "COMPLETED",
      portonePaymentId: paymentId,
      portoneTransactionId: data.transactionId,
      paidAt: new Date(),
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
