import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { paymentRepository } from "@/domains/payment/infra/prisma-payment.repository";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const payments = await paymentRepository.findManyByUserId(session.user.id);

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("[PaymentHistory] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "결제 내역 조회 중 오류",
      },
      { status: 500 }
    );
  }
}
