import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Delete user (cascades to related data due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json(
      { success: true, message: "계정이 삭제되었습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "계정 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
