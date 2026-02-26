/**
 * Test Payment Complete API
 *
 * 테스트 환경에서 PortOne 없이 결제 완료 처리
 * PAYMENT_MODE 환경변수로 테스트/실제 결제 모드를 제어
 * - PAYMENT_MODE=test → 테스트 결제 허용 (NODE_ENV 무관)
 * - PAYMENT_MODE=real → 테스트 결제 차단
 * - 미설정 시 → NEXT_PUBLIC_IMP_CODE 설정 여부로 판단
 *   (클라이언트 checkout-button.tsx의 USE_TEST_MODE 로직과 일관성 유지)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { paymentRepository } from "@/domains/payment/infra/prisma-payment.repository";
import { z } from "zod";
import { upgradeSubscription } from "@/domains/payment/usecase/upgrade-subscription";

const testCompleteSchema = z.object({
  orderId: z.string().min(1),
});

/**
 * POST /api/payment/test-complete
 * 테스트 결제 완료 처리
 */
export async function POST(request: NextRequest) {
  // 클라이언트(checkout-button.tsx)와 동일한 판단 기준 사용:
  // USE_TEST_MODE = IMP_CODE ? false : PAYMENT_MODE !== "real"
  // 서버 등가 로직: PAYMENT_MODE=real이거나, PAYMENT_MODE 미설정 시 IMP_CODE가 있으면 차단
  const paymentMode = process.env.PAYMENT_MODE;
  const impCode = process.env.NEXT_PUBLIC_IMP_CODE;
  const isTestBlocked = paymentMode === "real" || (!paymentMode && !!impCode);

  if (isTestBlocked) {
    return NextResponse.json(
      {
        success: false,
        error: "테스트 결제를 사용할 수 없습니다. 실제 결제를 이용해 주세요.",
      },
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
    const payment = await paymentRepository.findPendingByOrderIdAndUserId(
      orderId,
      userId
    );

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 결제 완료 처리
    await paymentRepository.updateStatus(payment.id, {
      status: "COMPLETED",
      portonePaymentId: `test_${orderId}`,
      paidAt: new Date(),
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
