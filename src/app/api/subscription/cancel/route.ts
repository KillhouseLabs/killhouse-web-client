/**
 * Subscription Cancel API
 *
 * 구독 해지 (Free 플랜으로 다운그레이드)
 * - 환불 없음
 * - PortOne 결제 취소 처리
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

/**
 * PortOne 결제 취소 API 호출
 */
async function cancelPortOnePayment(
  paymentId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!PORTONE_API_SECRET) {
    console.log("[Cancel] PortOne API secret not configured, skipping cancel");
    return { success: true };
  }

  try {
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
        body: JSON.stringify({
          reason,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Cancel] PortOne cancel failed:", errorData);
      // 이미 취소된 경우 등은 성공으로 처리
      if (errorData.code === "ALREADY_CANCELLED") {
        return { success: true };
      }
      return { success: false, error: errorData.message || "결제 취소 실패" };
    }

    console.log("[Cancel] PortOne payment cancelled successfully");
    return { success: true };
  } catch (error) {
    console.error("[Cancel] PortOne cancel error:", error);
    return { success: false, error: "결제 취소 중 오류 발생" };
  }
}

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

    // PortOne 결제 취소 처리 (환불 없이 구독만 취소)
    if (lastPayment?.portonePaymentId) {
      const cancelResult = await cancelPortOnePayment(
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
