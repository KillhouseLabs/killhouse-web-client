/**
 * Payment Verify API (V1 - 아임포트)
 *
 * 결제 완료 검증 및 구독 업그레이드
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { z } from "zod";

const PORTONE_REST_API_KEY = process.env.PORTONE_REST_API_KEY;
const PORTONE_REST_API_SECRET = process.env.PORTONE_REST_API_SECRET;

// V1 검증 스키마
const verifyPaymentSchemaV1 = z.object({
  impUid: z.string().min(1),
  merchantUid: z.string().min(1),
});

interface IMPPaymentResponse {
  code: number;
  message: string;
  response?: {
    imp_uid: string;
    merchant_uid: string;
    status: string;
    amount: number;
    paid_at: number;
  };
}

/**
 * 아임포트 액세스 토큰 발급
 */
async function getIMPAccessToken(): Promise<string> {
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
    throw new Error(`Failed to get access token: ${data.message}`);
  }

  return data.response.access_token;
}

/**
 * 아임포트 API로 결제 정보 조회
 */
async function getIMPPayment(impUid: string): Promise<IMPPaymentResponse> {
  const accessToken = await getIMPAccessToken();

  const response = await fetch(
    `https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.json();
}

/**
 * 구독 업그레이드 처리
 */
async function upgradeSubscription(userId: string, planId: string) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // 기존 구독 확인
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

  // 신규 구독 생성
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
 * POST /api/payment/verify
 * 결제 완료 검증 (V1 아임포트)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 요청 파싱 및 검증
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

    // 아임포트 API로 결제 정보 조회
    let impPayment: IMPPaymentResponse;
    try {
      impPayment = await getIMPPayment(impUid);
    } catch (error) {
      console.error("[IMP API Error]", error);
      return NextResponse.json(
        { success: false, error: "결제 정보 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    if (impPayment.code !== 0 || !impPayment.response) {
      return NextResponse.json(
        { success: false, error: impPayment.message || "결제 정보 조회 실패" },
        { status: 400 }
      );
    }

    const paymentInfo = impPayment.response;

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
    if (paymentInfo.status !== "paid") {
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
        paidAt: new Date(paymentInfo.paid_at * 1000),
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
