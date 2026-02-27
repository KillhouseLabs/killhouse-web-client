/**
 * Payment Verify API (V1 - 아임포트)
 *
 * 결제 완료 검증 및 구독 업그레이드
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createPaymentGateway } from "@/domains/payment/infra/payment-gateway-factory";
import {
  verifyPayment,
  VerifyPaymentError,
} from "@/domains/payment/usecase/verify-payment.usecase";

const verifyPaymentSchemaV1 = z.object({
  impUid: z.string().min(1),
  merchantUid: z.string().min(1),
});

/**
 * POST /api/payment/verify
 * 결제 완료 검증 (V1 아임포트)
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
    const gateway = createPaymentGateway();

    const result = await verifyPayment(
      { userId: session.user.id, impUid, merchantUid },
      gateway
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof VerifyPaymentError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          ...(error.code && { code: error.code }),
        },
        { status: error.statusCode }
      );
    }
    console.error("[Payment Verify Error]", error);
    return NextResponse.json(
      { success: false, error: "결제 검증 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
