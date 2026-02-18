/**
 * Forgot Password / Reset Password DTO Validation Tests
 *
 * 비밀번호 찾기/재설정 입력 데이터 검증 테스트
 */

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/domains/auth/dto/auth.dto";

describe("forgotPasswordSchema", () => {
  describe("email 필드 검증", () => {
    it("GIVEN 유효한 이메일 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = { email: "test@example.com" };

      // WHEN
      const result = forgotPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 잘못된 이메일 형식 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = { email: "invalid-email" };

      // WHEN
      const result = forgotPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "올바른 이메일 주소를 입력하세요"
        );
      }
    });

    it("GIVEN 빈 이메일 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = { email: "" };

      // WHEN
      const result = forgotPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });
});

describe("resetPasswordSchema", () => {
  describe("token 필드 검증", () => {
    it("GIVEN 유효한 토큰 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token-string",
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 빈 토큰 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        token: "",
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("password 필드 검증", () => {
    it("GIVEN 8자 미만 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token",
        password: "Short1",
        confirmPassword: "Short1",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 대문자 없는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token",
        password: "password123",
        confirmPassword: "password123",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 소문자 없는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 숫자 없는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token",
        password: "Passworddd",
        confirmPassword: "Passworddd",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("confirmPassword 일치 검증", () => {
    it("GIVEN 일치하는 비밀번호 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token",
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 불일치하는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        token: "valid-token",
        password: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      };

      // WHEN
      const result = resetPasswordSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find((e) =>
          e.path.includes("confirmPassword")
        );
        expect(confirmError?.message).toBe("비밀번호가 일치하지 않습니다");
      }
    });
  });
});
