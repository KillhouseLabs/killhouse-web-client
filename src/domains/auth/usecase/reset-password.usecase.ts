import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/database/prisma";

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!verificationToken) {
    return {
      success: false,
      error: "토큰이 만료되었거나 유효하지 않습니다",
    };
  }

  // 토큰 만료 확인
  if (new Date() > verificationToken.expires) {
    return {
      success: false,
      error: "토큰이 만료되었거나 유효하지 않습니다",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword },
    });

    // 사용된 토큰 삭제
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token,
        },
      },
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: "비밀번호 재설정에 실패했습니다",
    };
  }
}
