/**
 * Payment Refund API
 *
 * 결제 환불 처리 (gateway.refundPayment()으로 PG 환불 위임)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { PLANS } from "@/config/constants";
import { calculateRefundAmount } from "@/domains/payment/usecase/refund.usecase";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";

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

    if (!payment.portonePaymentId) {
      return NextResponse.json(
        { success: false, error: "PortOne 결제 정보가 없습니다" },
        { status: 400 }
      );
    }

    // 2. 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "구독 정보가 없습니다" },
        { status: 404 }
      );
    }

    // 3. 환불 금액 계산 (7일 청약철회 포함)
    let refundAmount: number;
    let refundInfo: {
      usedDays: number;
      totalDays: number;
      usageRate: number;
    } | null = null;

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
      return NextResponse.json(
        {
          success: false,
          error: "환불 가능한 금액이 없습니다 (구독 기간이 거의 종료됨)",
        },
        { status: 400 }
      );
    }

    // 4. gateway를 통한 환불 처리
    const gateway = createPaymentGateway();
    const refundResult = await gateway.refundPayment(
      payment.portonePaymentId,
      refundAmount,
      reason || "사용자 요청에 의한 환불"
    );

    if (!refundResult.success) {
      console.error("[Refund] 환불 실패:", refundResult.error);
      return NextResponse.json(
        { success: false, error: refundResult.error || "환불 처리 실패" },
        { status: 400 }
      );
    }

    console.log("[Refund] 환불 성공:", refundResult.refundedAmount);

    // 5. 결제 상태 업데이트
    const isFullRefund = refundAmount === payment.amount;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? "REFUNDED" : "COMPLETED",
        cancelledAt: new Date(),
        cancelReason:
          reason ||
          `${isFullRefund ? "전액" : "부분"} 환불 (₩${refundAmount.toLocaleString()})`,
      },
    });

    // 6. 구독을 Free로 변경
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        planId: "free",
        status: "CANCELLED",
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        originalAmount: payment.amount,
        refundAmount: refundResult.refundedAmount,
        isFullRefund,
        refundInfo,
      },
    });
  } catch (error) {
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
