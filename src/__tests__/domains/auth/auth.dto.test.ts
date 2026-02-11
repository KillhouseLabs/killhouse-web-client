/**
 * Auth DTO Validation Tests
 *
 * 회원가입 입력 데이터 검증 테스트
 */

import { signUpSchema, signInSchema } from "@/domains/auth/dto/auth.dto";

describe("signUpSchema", () => {
  describe("name 필드 검증", () => {
    it("GIVEN 2자 미만 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "A",
        email: "test@example.com",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "이름은 2자 이상이어야 합니다"
        );
      }
    });

    it("GIVEN 50자 초과 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "a".repeat(51),
        email: "test@example.com",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "이름은 50자 이하여야 합니다"
        );
      }
    });

    it("GIVEN 유효한 이름 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test User");
      }
    });
  });

  describe("email 필드 검증", () => {
    it("GIVEN 잘못된 이메일 형식 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "invalid-email",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "올바른 이메일 주소를 입력하세요"
        );
      }
    });

    it("GIVEN 유효한 이메일 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("password 필드 검증", () => {
    it("GIVEN 8자 미만 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Short1",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "비밀번호는 8자 이상이어야 합니다"
        );
      }
    });

    it("GIVEN 100자 초과 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Aa1" + "a".repeat(98),
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "비밀번호는 100자 이하여야 합니다"
        );
      }
    });

    it("GIVEN 대문자 없는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"
        );
      }
    });

    it("GIVEN 소문자 없는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "PASSWORD123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"
        );
      }
    });

    it("GIVEN 숫자 없는 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Passworddd",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"
        );
      }
    });

    it("GIVEN 유효한 비밀번호 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("전체 스키마 검증", () => {
    it("GIVEN 모든 필드가 유효 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });
  });
});

describe("signInSchema", () => {
  describe("email 필드 검증", () => {
    it("GIVEN 잘못된 이메일 형식 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        email: "invalid-email",
        password: "password",
      };

      // WHEN
      const result = signInSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("password 필드 검증", () => {
    it("GIVEN 빈 비밀번호 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        email: "test@example.com",
        password: "",
      };

      // WHEN
      const result = signInSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("비밀번호를 입력하세요");
      }
    });
  });

  describe("전체 스키마 검증", () => {
    it("GIVEN 유효한 입력 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        email: "test@example.com",
        password: "anypassword",
      };

      // WHEN
      const result = signInSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });
});
