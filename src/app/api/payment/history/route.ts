import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderId: true,
        planId: true,
        amount: true,
        status: true,
        portonePaymentId: true,
        paidAt: true,
        cancelledAt: true,
        cancelReason: true,
        createdAt: true,
      },
    });

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
