/**
 * Payment Checkout API
 *
 * 결제 주문 생성 및 결제 준비
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  createPaymentSchema,
  type CreatePaymentRequest,
} from "@/domains/payment/dto/payment.dto";
import { PLANS } from "@/domains/subscription/model/plan";

/**
 * 주문 ID 생성
 */
function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${random}`;
}

/**
 * POST /api/payment/checkout
 * 결제 주문 생성
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

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error("[Payment Checkout] User not found:", userId);
      return NextResponse.json(
        { success: false, error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 요청 파싱 및 검증
    const body = (await request.json()) as CreatePaymentRequest;
    const validationResult = createPaymentSchema.safeParse(body);

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

    const { planId } = validationResult.data;

    // 플랜 정보 조회
    const planKey = planId.toUpperCase() as keyof typeof PLANS;
    const plan = PLANS[planKey];

    if (!plan || plan.price <= 0) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 플랜입니다" },
        { status: 400 }
      );
    }

    // 주문 ID 생성
    const orderId = generateOrderId();

    // 결제 레코드 생성
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId,
        planId,
        amount: plan.price,
        status: "PENDING",
      },
    });

    // 결제 준비 정보 반환
    return NextResponse.json({
      success: true,
      data: {
        orderId: payment.orderId,
        paymentId: payment.id,
        planId: payment.planId,
        planName: plan.name,
        amount: payment.amount,
        currency: "KRW",
        // PortOne 결제창 호출에 필요한 정보
        orderName: `Killhouse ${plan.name} 플랜`,
        customer: {
          email: session.user.email,
          name: session.user.name || "고객",
        },
      },
    });
  } catch (error) {
    console.error("[Payment Checkout Error]", error);
    return NextResponse.json(
      { success: false, error: "결제 준비 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
