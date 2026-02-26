/**
 * Payment Checkout API
 *
 * 결제 주문 생성 및 결제 준비
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPaymentSchema } from "@/domains/payment/dto/payment.dto";
import {
  createCheckout,
  CheckoutError,
} from "@/domains/payment/usecase/create-checkout.usecase";

/**
 * POST /api/payment/checkout
 * 결제 주문 생성
 */
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

    const result = await createCheckout({
      userId: session.user.id,
      planId: validationResult.data.planId,
      customerEmail: session.user.email,
      customerName: session.user.name,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Payment Checkout Error]", error);
    return NextResponse.json(
      { success: false, error: "결제 준비 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
