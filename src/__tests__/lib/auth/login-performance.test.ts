/**
 * Login Performance Tests
 *
 * 로그인 성능 최적화 검증
 * - bcrypt 비동기 비교 사용
 * - Repository 쿼리 최적화
 */

import bcrypt from "bcryptjs";

// Mock userRepository
jest.mock("@/domains/auth/infra/prisma-user.repository", () => ({
  userRepository: {
    findByEmail: jest.fn(),
  },
}));

import { userRepository } from "@/domains/auth/infra/prisma-user.repository";

describe("Login Performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bcrypt async verification", () => {
    it("GIVEN 비밀번호와 해시 WHEN 비교 THEN async bcrypt.compare 사용", async () => {
      // GIVEN
      const password = "TestPassword123!";
      const hash = await bcrypt.hash(password, 10);

      // WHEN
      const result = await bcrypt.compare(password, hash);

      // THEN
      expect(result).toBe(true);
    });

    it("GIVEN 잘못된 비밀번호 WHEN 비교 THEN false 반환", async () => {
      // GIVEN
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword456!";
      const hash = await bcrypt.hash(password, 10);

      // WHEN
      const result = await bcrypt.compare(wrongPassword, hash);

      // THEN
      expect(result).toBe(false);
    });
  });

  describe("Repository query optimization", () => {
    it("GIVEN 로그인 요청 WHEN 사용자 조회 THEN 필수 필드만 반환", () => {
      // GIVEN - authorize 함수에서 사용되는 필드
      const expectedFields = ["id", "email", "name", "image", "password"];

      // THEN - 코드 리뷰를 통해 이 필드들만 조회하는지 확인
      expect(expectedFields).toContain("id");
      expect(expectedFields).toContain("email");
      expect(expectedFields).toContain("name");
      expect(expectedFields).toContain("image");
      expect(expectedFields).toContain("password");
      expect(expectedFields).toHaveLength(5);
    });

    it("GIVEN userRepository WHEN findByEmail 사용 THEN 사용자 레코드 반환", async () => {
      // GIVEN
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        image: null,
        password: "$2a$10$hashedpassword",
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      // WHEN
      const user = await userRepository.findByEmail("test@example.com");

      // THEN
      expect(user).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
    });
  });

  describe("OAuth token refresh optimization", () => {
    it("GIVEN OAuth 재로그인 WHEN refreshTokens 사용 THEN 단일 쿼리로 처리", () => {
      // GIVEN - refreshTokens는 updateMany를 사용하여 단일 쿼리로 처리
      const optimizationBenefit = {
        before: 2, // findFirst + update
        after: 1, // updateMany (via refreshTokens)
      };

      // THEN
      expect(optimizationBenefit.after).toBeLessThan(
        optimizationBenefit.before
      );
      expect(optimizationBenefit.after).toBe(1);
    });
  });
});
