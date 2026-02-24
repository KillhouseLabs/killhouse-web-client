import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import {
  accountDeletionHandler,
  type AuthenticatedContext,
} from "@/lib/api/middleware";

export const DELETE = accountDeletionHandler(async (_request, context) => {
  const { userId } = context as AuthenticatedContext;

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json(
    { success: true, message: "계정이 삭제되었습니다" },
    { status: 200 }
  );
});
