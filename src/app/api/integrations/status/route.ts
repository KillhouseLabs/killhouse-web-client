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

    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        provider: {
          in: ["github", "gitlab"],
        },
      },
      select: {
        provider: true,
        scope: true,
      },
    });

    const github = accounts.find(
      (a: { provider: string; scope: string | null }) => a.provider === "github"
    );
    const gitlab = accounts.find(
      (a: { provider: string; scope: string | null }) => a.provider === "gitlab"
    );

    return NextResponse.json({
      success: true,
      data: {
        github: {
          connected: !!github,
          scope: github?.scope || null,
        },
        gitlab: {
          connected: !!gitlab,
          scope: gitlab?.scope || null,
        },
      },
    });
  } catch (error) {
    console.error("Integration status error:", error);
    return NextResponse.json(
      { success: false, error: "연동 상태 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
