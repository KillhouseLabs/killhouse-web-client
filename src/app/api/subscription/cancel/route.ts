/**
 * Subscription Cancel API
 *
 * 구독 해지 (Free 플랜으로 다운그레이드)
 * - 환불 없음
 * - gateway.cancelPayment()으로 PortOne 결제 취소 위임
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";

/**
 * POST /api/subscription/cancel
 * 구독 해지
 */
export async function POST() {
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

    // 현재 구독 확인
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "구독 정보가 없습니다" },
        { status: 404 }
      );
    }

    if (subscription.planId === "free") {
      return NextResponse.json(
        { success: false, error: "이미 무료 플랜입니다" },
        { status: 400 }
      );
    }

    // 최근 결제 정보 조회 (PortOne 결제 취소용)
    const lastPayment = await prisma.payment.findFirst({
      where: {
        userId,
        status: "COMPLETED",
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    // gateway를 통한 PortOne 결제 취소 처리 (환불 없이 구독만 취소)
    if (lastPayment?.portonePaymentId) {
      const gateway = createPaymentGateway();
      const cancelResult = await gateway.cancelPayment(
        lastPayment.portonePaymentId,
        "사용자 구독 해지 요청 (환불 없음)"
      );

      if (!cancelResult.success) {
        console.warn(
          "[Cancel] PortOne cancel failed, but continuing with subscription cancel"
        );
        // PortOne 취소 실패해도 구독 해지는 진행
      }

      // 결제 상태 업데이트
      await prisma.payment.update({
        where: { id: lastPayment.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "사용자 구독 해지 (환불 없음)",
        },
      });
    }

    // 구독 해지 (Free 플랜으로 변경)
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        planId: "free",
        status: "CANCELLED",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(), // 즉시 해지
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: updatedSubscription.id,
          planId: updatedSubscription.planId,
          status: updatedSubscription.status,
        },
        message: "구독이 해지되었습니다. 환불은 제공되지 않습니다.",
      },
    });
  } catch (error) {
    console.error("[Subscription Cancel Error]", error);
    return NextResponse.json(
      { success: false, error: "구독 해지 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
