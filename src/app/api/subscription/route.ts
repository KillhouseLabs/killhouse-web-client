import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUsageStats } from "@/domains/subscription/usecase/subscription-limits";

// GET /api/subscription - Get current subscription and usage
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const usage = await getUsageStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { success: false, error: "구독 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
