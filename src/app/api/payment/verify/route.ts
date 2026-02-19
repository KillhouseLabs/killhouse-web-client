/**
 * Payment Verify API (V1 - 아임포트)
 *
 * 결제 완료 검증 및 구독 업그레이드
 * gateway.verifyClientPayment()으로 PG 검증 위임
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { z } from "zod";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";
import { upgradeSubscription } from "@/domains/payment/usecase/upgrade-subscription";

const verifyPaymentSchemaV1 = z.object({
  impUid: z.string().min(1),
  merchantUid: z.string().min(1),
});

/**
 * POST /api/payment/verify
 * 결제 완료 검증 (V1 아임포트)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();
    const validationResult = verifyPaymentSchemaV1.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "입력값이 유효하지 않습니다",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { impUid, merchantUid } = validationResult.data;

    // gateway를 통한 결제 검증
    const gateway = createPaymentGateway();
    let paymentInfo;
    try {
      paymentInfo = await gateway.verifyClientPayment(impUid);
    } catch (error) {
      console.error("[IMP API Error]", error);
      return NextResponse.json(
        { success: false, error: "결제 정보 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    // merchant_uid로 내부 결제 레코드 조회
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: merchantUid,
        userId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 이미 처리된 결제인지 확인
    if (payment.status === "COMPLETED") {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      return NextResponse.json({
        success: true,
        data: {
          payment: { id: payment.id, status: payment.status },
          subscription,
        },
      });
    }

    // 결제 상태 확인
    if (paymentInfo.status !== "PAID") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          portonePaymentId: impUid,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "결제가 완료되지 않았습니다",
          code: "PAYMENT_NOT_COMPLETED",
        },
        { status: 400 }
      );
    }

    // 금액 검증
    if (paymentInfo.amount !== payment.amount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          portonePaymentId: impUid,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "결제 금액이 일치하지 않습니다",
          code: "AMOUNT_MISMATCH",
        },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      data: {
        payment: { id: payment.id, status: "COMPLETED" },
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      },
    });
  } catch (error) {
    console.error("[Payment Verify Error]", error);
    return NextResponse.json(
      { success: false, error: "결제 검증 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
