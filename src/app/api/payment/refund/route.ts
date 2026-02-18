import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { PLANS } from "@/config/constants";
import { calculateRefundAmount } from "@/domains/payment/usecase/refund.usecase";

const PORTONE_REST_API_KEY = process.env.PORTONE_REST_API_KEY;
const PORTONE_REST_API_SECRET = process.env.PORTONE_REST_API_SECRET;

// PortOne V1 Access Token 발급
async function getAccessToken(): Promise<string> {
  const response = await fetch("https://api.iamport.kr/users/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imp_key: PORTONE_REST_API_KEY,
      imp_secret: PORTONE_REST_API_SECRET,
    }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Access token 발급 실패: ${data.message}`);
  }

  return data.response.access_token;
}

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
      // 명시적 전액 환불 요청
      refundAmount = payment.amount;
    } else if (subscription.currentPeriodEnd) {
      // paidAt 기준 7일 청약철회 + 일할계산
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
      // 구독 종료일이 없으면 전액 환불
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

    // 4. Access Token 발급
    const accessToken = await getAccessToken();

    // 5. PortOne 환불 요청
    const refundResponse = await fetch(
      "https://api.iamport.kr/payments/cancel",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          imp_uid: payment.portonePaymentId,
          reason: reason || "사용자 요청에 의한 환불",
          amount: refundAmount,
        }),
      }
    );

    const refundData = await refundResponse.json();

    if (refundData.code !== 0) {
      console.error("[Refund] PortOne 환불 실패:", refundData);
      return NextResponse.json(
        { success: false, error: refundData.message || "환불 처리 실패" },
        { status: 400 }
      );
    }

    console.log("[Refund] 환불 성공:", refundData.response);

    // 6. 결제 상태 업데이트
    const isFullRefund = refundAmount === payment.amount;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? "REFUNDED" : "COMPLETED", // 부분 환불은 상태 유지
        cancelledAt: new Date(),
        cancelReason:
          reason ||
          `${isFullRefund ? "전액" : "부분"} 환불 (₩${refundAmount.toLocaleString()})`,
      },
    });

    // 7. 구독을 Free로 변경
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
        impUid: refundData.response.imp_uid,
        merchantUid: refundData.response.merchant_uid,
        originalAmount: payment.amount,
        refundAmount: refundData.response.cancel_amount,
        isFullRefund,
        refundInfo,
        cancelledAt: refundData.response.cancelled_at,
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
