import { NextResponse } from "next/server";
import { userRepository } from "@/domains/auth/infra/prisma-user.repository";
import {
  accountDeletionHandler,
  type AuthenticatedContext,
} from "@/lib/api/middleware";

export const DELETE = accountDeletionHandler(async (_request, context) => {
  const { userId } = context as AuthenticatedContext;

  await userRepository.delete(userId);

  return NextResponse.json(
    { success: true, message: "계정이 삭제되었습니다" },
    { status: 200 }
  );
});
