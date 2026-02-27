/**
 * Reset Password UseCase Tests
 *
 * 비밀번호 재설정 유즈케이스 테스트
 */

jest.mock("@/domains/auth/infra/prisma-user.repository", () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/domains/auth/infra/prisma-verification-token.repository", () => ({
  verificationTokenRepository: {
    findByToken: jest.fn(),
    create: jest.fn(),
    deleteByIdentifier: jest.fn(),
    deleteByIdentifierAndToken: jest.fn(),
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

import { userRepository } from "@/domains/auth/infra/prisma-user.repository";
import { verificationTokenRepository } from "@/domains/auth/infra/prisma-verification-token.repository";
import bcrypt from "bcryptjs";
import { resetPassword } from "@/domains/auth/usecase/reset-password.usecase";

describe("Reset Password UseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("resetPassword", () => {
    it("GIVEN 유효한 토큰과 새 비밀번호 WHEN 비밀번호 재설정 THEN 비밀번호가 변경되어야 한다", async () => {
      // GIVEN
      const token = "valid-token";
      const newPassword = "NewPassword123";
      const futureDate = new Date(Date.now() + 3600 * 1000);
      const mockToken = {
        identifier: "test@example.com",
        token,
        expires: futureDate,
      };
      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(
        mockToken
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2a$12$hashedNewPassword");
      (userRepository.updatePassword as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
      });
      (
        verificationTokenRepository.deleteByIdentifierAndToken as jest.Mock
      ).mockResolvedValue(undefined);

      // WHEN
      const result = await resetPassword(token, newPassword);

      // THEN
      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(userRepository.updatePassword).toHaveBeenCalledWith(
        "test@example.com",
        "$2a$12$hashedNewPassword"
      );
      expect(
        verificationTokenRepository.deleteByIdentifierAndToken
      ).toHaveBeenCalledWith("test@example.com", token);
    });

    it("GIVEN 존재하지 않는 토큰 WHEN 비밀번호 재설정 THEN 에러를 반환해야 한다", async () => {
      // GIVEN
      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(
        null
      );

      // WHEN
      const result = await resetPassword("invalid-token", "NewPassword123");

      // THEN
      expect(result.success).toBe(false);
      expect(result.error).toBe("토큰이 만료되었거나 유효하지 않습니다");
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("GIVEN 만료된 토큰 WHEN 비밀번호 재설정 THEN 에러를 반환해야 한다", async () => {
      // GIVEN
      const pastDate = new Date(Date.now() - 3600 * 1000);
      const mockToken = {
        identifier: "test@example.com",
        token: "expired-token",
        expires: pastDate,
      };
      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(
        mockToken
      );

      // WHEN
      const result = await resetPassword("expired-token", "NewPassword123");

      // THEN
      expect(result.success).toBe(false);
      expect(result.error).toBe("토큰이 만료되었거나 유효하지 않습니다");
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("GIVEN DB 에러 WHEN 비밀번호 재설정 THEN 에러를 반환해야 한다", async () => {
      // GIVEN
      const futureDate = new Date(Date.now() + 3600 * 1000);
      const mockToken = {
        identifier: "test@example.com",
        token: "valid-token",
        expires: futureDate,
      };
      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(
        mockToken
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2a$12$hashed");
      (userRepository.updatePassword as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      // WHEN
      const result = await resetPassword("valid-token", "NewPassword123");

      // THEN
      expect(result.success).toBe(false);
      expect(result.error).toBe("비밀번호 재설정에 실패했습니다");
    });
  });
});
