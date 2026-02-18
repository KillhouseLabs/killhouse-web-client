/**
 * Forgot Password UseCase Tests
 *
 * 비밀번호 찾기 유즈케이스 테스트
 */

jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("@/infrastructure/email/send-email", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => "mocked-random-token-string"),
  })),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { sendPasswordResetEmail } from "@/infrastructure/email/send-email";
import { requestPasswordReset } from "@/domains/auth/usecase/forgot-password.usecase";

describe("Forgot Password UseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestPasswordReset", () => {
    it("GIVEN 등록된 이메일 WHEN 비밀번호 재설정 요청 THEN 토큰을 생성하고 이메일을 발송해야 한다", async () => {
      // GIVEN
      const email = "test@example.com";
      const mockUser = {
        id: "user-1",
        email,
        name: "Test User",
        password: "$2a$12$hashedpassword",
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue({
        identifier: email,
        token: "mocked-random-token-string",
        expires: new Date(),
      });
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      const result = await requestPasswordReset(email);

      // THEN
      expect(result.success).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: email },
      });
      expect(prisma.verificationToken.create).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        "mocked-random-token-string"
      );
    });

    it("GIVEN 등록되지 않은 이메일 WHEN 비밀번호 재설정 요청 THEN 성공 응답을 반환해야 한다 (보안)", async () => {
      // GIVEN - 존재하지 않는 사용자
      const email = "nonexistent@example.com";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // WHEN
      const result = await requestPasswordReset(email);

      // THEN - 보안상 성공으로 응답 (이메일 열거 공격 방지)
      expect(result.success).toBe(true);
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("GIVEN 이메일 발송 실패 WHEN 비밀번호 재설정 요청 THEN 에러를 반환해야 한다", async () => {
      // GIVEN
      const email = "test@example.com";
      const mockUser = {
        id: "user-1",
        email,
        name: "Test User",
        password: "$2a$12$hashedpassword",
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue({
        identifier: email,
        token: "mocked-random-token-string",
        expires: new Date(),
      });
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(
        new Error("Email send failed")
      );

      // WHEN
      const result = await requestPasswordReset(email);

      // THEN
      expect(result.success).toBe(false);
      expect(result.error).toBe("이메일 발송에 실패했습니다");
    });

    it("GIVEN OAuth 전용 사용자 (비밀번호 없음) WHEN 비밀번호 재설정 요청 THEN 성공 응답을 반환해야 한다 (보안)", async () => {
      // GIVEN - OAuth 사용자 (password가 null)
      const email = "oauth@example.com";
      const mockUser = {
        id: "user-2",
        email,
        name: "OAuth User",
        password: null,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // WHEN
      const result = await requestPasswordReset(email);

      // THEN - 보안상 성공으로 응답
      expect(result.success).toBe(true);
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });
});
