/**
 * Payment Verify API
 *
 * 결제 완료 검증 및 구독 업그레이드
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { verifyPaymentSchema } from "@/domains/payment/dto/payment.dto";

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
    throw new Error(
      `PortOne API Error: ${JSON.stringify(errorData)}`
    );
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
 * 결제 완료 검증
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
    const validationResult = verifyPaymentSchema.safeParse(body);

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

    const { paymentId } = validationResult.data;

    // PortOne API로 결제 정보 조회
    let portonePayment: PortOnePaymentResponse;
    try {
      portonePayment = await getPortOnePayment(paymentId);
    } catch (error) {
      console.error("[PortOne API Error]", error);
      return NextResponse.json(
        { success: false, error: "결제 정보 조회에 실패했습니다" },
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
        // customData 파싱 실패
      }
    }

    // 내부 결제 레코드 조회
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { portonePaymentId: paymentId },
          { orderId: orderId },
        ],
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
      // 이미 완료된 결제 - 구독 정보 반환
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
    if (portonePayment.status !== "PAID") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          portonePaymentId: paymentId,
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
    if (portonePayment.amount.total !== payment.amount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          portonePaymentId: paymentId,
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
        portonePaymentId: paymentId,
        paidAt: new Date(),
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
