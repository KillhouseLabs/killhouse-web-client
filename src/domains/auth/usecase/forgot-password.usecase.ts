import crypto from "crypto";
import { prisma } from "@/infrastructure/database/prisma";
import { sendPasswordResetEmail } from "@/infrastructure/email/send-email";

export interface PasswordResetRequestResult {
  success: boolean;
  error?: string;
}

export async function requestPasswordReset(
  email: string
): Promise<PasswordResetRequestResult> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 보안: 사용자가 존재하지 않거나 OAuth 전용 사용자인 경우에도 성공 응답
  if (!user || !user.password) {
    return { success: true };
  }

  // 기존 토큰 삭제
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // 새 토큰 생성 (1시간 유효)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  try {
    await sendPasswordResetEmail(email, token);
  } catch {
    return {
      success: false,
      error: "이메일 발송에 실패했습니다",
    };
  }

  return { success: true };
}
