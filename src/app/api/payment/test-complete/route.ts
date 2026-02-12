/**
 * Test Payment Complete API
 *
 * 테스트 환경에서 PortOne 없이 결제 완료 처리
 * 프로덕션 환경에서는 사용하지 않음
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { z } from "zod";

const testCompleteSchema = z.object({
  orderId: z.string().min(1),
});

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
 * POST /api/payment/test-complete
 * 테스트 결제 완료 처리
 */
export async function POST(request: NextRequest) {
  // 프로덕션 환경에서는 사용 불가
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Not available in production" },
      { status: 403 }
    );
  }

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
    const validationResult = testCompleteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "입력값이 유효하지 않습니다" },
        { status: 400 }
      );
    }

    const { orderId } = validationResult.data;

    // 결제 레코드 조회
    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        userId,
        status: "PENDING",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 결제 완료 처리
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        portonePaymentId: `test_${orderId}`,
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
    console.error("[Test Complete Error]", error);
    return NextResponse.json(
      { success: false, error: "처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
