/**
 * Payment Refund API
 *
 * POST: 환불 처리 (processRefund usecase 위임)
 * GET: 환불 예상 금액 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { PLANS } from "@/domains/subscription/model/plan";
import { calculateRefundAmount } from "@/domains/payment/usecase/refund.usecase";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";
import {
  processRefund,
  RefundError,
} from "@/domains/payment/usecase/process-refund.usecase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, reason, fullRefund } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId가 필요합니다" },
        { status: 400 }
      );
    }

    const gateway = createPaymentGateway();
    const result = await processRefund(
      {
        userId: session.user.id,
        paymentId,
        reason,
        fullRefund,
      },
      gateway
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof RefundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Refund] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "환불 처리 중 오류",
      },
      { status: 500 }
    );
  }
}

// 환불 예상 금액 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId가 필요합니다" },
        { status: 400 }
      );
    }

    // 1. 결제 정보 조회
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        status: "COMPLETED",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "환불 가능한 결제 내역이 없습니다" },
        { status: 404 }
      );
    }

    // 2. 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || !subscription.currentPeriodEnd) {
      return NextResponse.json({
        success: true,
        data: {
          originalAmount: payment.amount,
          refundAmount: payment.amount,
          usedDays: 0,
          totalDays: 30,
          usageRate: 0,
          isFullRefund: true,
        },
      });
    }

    // 3. 환불 예상 금액 계산 (7일 청약철회 포함)
    const calculated = calculateRefundAmount(
      payment.amount,
      payment.paidAt ?? subscription.currentPeriodStart,
      subscription.currentPeriodEnd
    );

    const plan = PLANS[payment.planId.toUpperCase() as keyof typeof PLANS];

    return NextResponse.json({
      success: true,
      data: {
        planName: plan?.name || payment.planId,
        originalAmount: payment.amount,
        refundAmount: calculated.refundAmount,
        usedDays: calculated.usedDays,
        totalDays: calculated.totalDays,
        usageRate: Math.round(calculated.usageRate * 100),
        isFullRefund: calculated.refundAmount === payment.amount,
      },
    });
  } catch (error) {
    console.error("[Refund] GET Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "환불 정보 조회 중 오류",
      },
      { status: 500 }
    );
  }
}
