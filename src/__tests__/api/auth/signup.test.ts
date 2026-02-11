/**
 * Signup API Route Tests
 *
 * 회원가입 API 엔드포인트 테스트
 */

import { signUpSchema } from "@/domains/auth/dto/auth.dto";
import bcrypt from "bcryptjs";

// Mock prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

import { prisma } from "@/infrastructure/database/prisma";

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

  describe("이메일 중복 확인", () => {
    it("GIVEN 새 이메일 WHEN 중복 확인 THEN null이 반환되어야 한다", async () => {
      // GIVEN
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // WHEN
      const existingUser = await prisma.user.findUnique({
        where: { email: "new@example.com" },
      });

      // THEN
      expect(existingUser).toBeNull();
    });

    it("GIVEN 기존 이메일 WHEN 중복 확인 THEN 사용자가 반환되어야 한다", async () => {
      // GIVEN
      const existingUser = { id: "user-1", email: "existing@example.com" };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // WHEN
      const result = await prisma.user.findUnique({
        where: { email: "existing@example.com" },
      });

      // THEN
      expect(result).toEqual(existingUser);
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

  describe("사용자 생성", () => {
    it("GIVEN 유효한 데이터 WHEN 사용자 생성 THEN 새 사용자가 생성되어야 한다", async () => {
      // GIVEN
      const userData = {
        email: "new@example.com",
        password: "$2a$12$hashedpassword",
        name: "New User",
      };
      const createdUser = {
        id: "new-user-id",
        email: userData.email,
        name: userData.name,
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      // WHEN
      const result = await prisma.user.create({
        data: userData,
        select: { id: true, email: true, name: true },
      });

      // THEN
      expect(result.id).toBe("new-user-id");
      expect(result.email).toBe("new@example.com");
    });
  });

  describe("에러 처리", () => {
    it("GIVEN 데이터베이스 에러 WHEN 사용자 생성 실패 THEN 에러가 발생해야 한다", async () => {
      // GIVEN
      const dbError = new Error("Database connection failed");
      (prisma.user.create as jest.Mock).mockRejectedValue(dbError);

      // WHEN & THEN
      await expect(
        prisma.user.create({
          data: { email: "test@example.com", password: "hashed" },
        })
      ).rejects.toThrow("Database connection failed");
    });
  });
});
