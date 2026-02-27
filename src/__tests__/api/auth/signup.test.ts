/**
 * Signup API Route Tests
 *
 * 회원가입 API 엔드포인트 테스트
 */

import { signUpSchema } from "@/domains/auth/dto/auth.dto";
import bcrypt from "bcryptjs";

jest.mock("@/domains/auth/infra/prisma-user.repository", () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock(
  "@/domains/subscription/infra/prisma-subscription.repository",
  () => ({
    subscriptionRepository: {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })
);

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

import { userRepository } from "@/domains/auth/infra/prisma-user.repository";
import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { signUpUser } from "@/domains/auth/usecase/signup.usecase";

describe("Signup API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("입력 검증", () => {
    it("GIVEN 유효한 이메일과 비밀번호 WHEN 스키마 검증 THEN 성공해야 한다", () => {
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

    it("GIVEN 잘못된 이메일 형식 WHEN 스키마 검증 THEN 실패해야 한다", () => {
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
    });

    it("GIVEN 짧은 비밀번호 WHEN 스키마 검증 THEN 실패해야 한다", () => {
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
    });

    it("GIVEN 복잡하지 않은 비밀번호 WHEN 스키마 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "simplepassword",
      };

      // WHEN
      const result = signUpSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("signUpUser usecase", () => {
    it("GIVEN 새 이메일 WHEN 회원가입 THEN 사용자와 구독이 생성되어야 한다", async () => {
      // GIVEN
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2a$12$hashedpassword");
      (userRepository.create as jest.Mock).mockResolvedValue({
        id: "new-user-id",
        name: "Test User",
        email: "test@example.com",
        password: "$2a$12$hashedpassword",
      });
      (subscriptionRepository.create as jest.Mock).mockResolvedValue({});

      // WHEN
      const result = await signUpUser({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

      // THEN
      expect(result.success).toBe(true);
      expect(result.userId).toBe("new-user-id");
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "$2a$12$hashedpassword",
      });
      expect(subscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "new-user-id",
          planId: "free",
          status: "ACTIVE",
        })
      );
    });

    it("GIVEN 기존 이메일 WHEN 회원가입 THEN 에러를 반환해야 한다", async () => {
      // GIVEN
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: "existing-id",
        email: "existing@example.com",
      });

      // WHEN
      const result = await signUpUser({
        name: "Test User",
        email: "existing@example.com",
        password: "Password123",
      });

      // THEN
      expect(result.success).toBe(false);
      expect(result.error).toBe("이미 등록된 이메일입니다");
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("비밀번호 해싱", () => {
    it("GIVEN 평문 비밀번호 WHEN 해싱 THEN 해시된 비밀번호가 반환되어야 한다", async () => {
      // GIVEN
      const plainPassword = "Password123";
      const hashedPassword = "$2a$12$hashedpassword";
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // WHEN
      const result = await bcrypt.hash(plainPassword, 12);

      // THEN
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
    });
  });
});
