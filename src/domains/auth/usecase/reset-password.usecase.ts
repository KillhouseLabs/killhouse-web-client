import bcrypt from "bcryptjs";
import { userRepository } from "../infra/prisma-user.repository";
import { verificationTokenRepository } from "../infra/prisma-verification-token.repository";

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const verificationToken =
    await verificationTokenRepository.findByToken(token);

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

    await userRepository.updatePassword(
      verificationToken.identifier,
      hashedPassword
    );

    // 사용된 토큰 삭제
    await verificationTokenRepository.deleteByIdentifierAndToken(
      verificationToken.identifier,
      token
    );

    return { success: true };
  } catch {
    return {
      success: false,
      error: "비밀번호 재설정에 실패했습니다",
    };
  }
}
