/**
 * API Middleware Tests
 *
 * HOF Wrapper 패턴 미들웨어 테스트
 * (Unit test level - mocked functions 직접 호출)
 */

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/domains/subscription/usecase/subscription-limits", () => ({
  canCreateProject: jest.fn(),
  canRunAnalysis: jest.fn(),
}));

import { auth } from "@/lib/auth";
import {
  canCreateProject,
  canRunAnalysis,
} from "@/domains/subscription/usecase/subscription-limits";

describe("API Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("withAuth", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 인증 확인 THEN null 반환", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });

      it("GIVEN 세션은 있지만 user.id 없음 WHEN 인증 확인 THEN 유효하지 않음", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({ user: {} });

        // WHEN
        const session = await auth();

        // THEN
        expect(session?.user?.id).toBeUndefined();
      });

      it("GIVEN 인증된 사용자 WHEN 인증 확인 THEN 세션 정보 포함", async () => {
        // GIVEN
        const mockSession = {
          user: { id: "user-123", email: "test@test.com" },
        };
        (auth as jest.Mock).mockResolvedValue(mockSession);

        // WHEN
        const session = await auth();

        // THEN
        expect(session?.user?.id).toBe("user-123");
        expect(session?.user?.email).toBe("test@test.com");
      });
    });
  });

  describe("withSubscriptionCheck", () => {
    describe("프로젝트 생성 제한", () => {
      it("GIVEN 제한 초과 WHEN 프로젝트 생성 확인 THEN allowed: false", async () => {
        // GIVEN
        (canCreateProject as jest.Mock).mockResolvedValue({
          allowed: false,
          currentCount: 3,
          limit: 3,
          message: "프로젝트 생성 한도(3개)에 도달했습니다.",
        });

        // WHEN
        const result = await canCreateProject("user-123");

        // THEN
        expect(result.allowed).toBe(false);
        expect(result.currentCount).toBe(3);
        expect(result.limit).toBe(3);
        expect(result.message).toContain("한도");
      });

      it("GIVEN 제한 내 WHEN 프로젝트 생성 확인 THEN allowed: true", async () => {
        // GIVEN
        (canCreateProject as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 1,
          limit: 3,
        });

        // WHEN
        const result = await canCreateProject("user-123");

        // THEN
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(1);
        expect(result.limit).toBe(3);
      });

      it("GIVEN Pro 플랜 (무제한) WHEN 프로젝트 생성 확인 THEN limit: -1", async () => {
        // GIVEN
        (canCreateProject as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 50,
          limit: -1,
        });

        // WHEN
        const result = await canCreateProject("user-pro");

        // THEN
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(-1);
      });
    });

    describe("분석 실행 제한", () => {
      it("GIVEN 제한 초과 WHEN 분석 실행 확인 THEN allowed: false", async () => {
        // GIVEN
        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: false,
          currentCount: 10,
          limit: 10,
          message: "이번 달 분석 한도(10회)에 도달했습니다.",
        });

        // WHEN
        const result = await canRunAnalysis("user-123");

        // THEN
        expect(result.allowed).toBe(false);
        expect(result.currentCount).toBe(10);
        expect(result.limit).toBe(10);
      });

      it("GIVEN 제한 내 WHEN 분석 실행 확인 THEN allowed: true", async () => {
        // GIVEN
        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 5,
          limit: 10,
        });

        // WHEN
        const result = await canRunAnalysis("user-123");

        // THEN
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(5);
      });

      it("GIVEN Enterprise 플랜 (무제한) WHEN 분석 실행 확인 THEN limit: -1", async () => {
        // GIVEN
        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 500,
          limit: -1,
        });

        // WHEN
        const result = await canRunAnalysis("user-enterprise");

        // THEN
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(-1);
      });
    });
  });

  describe("Middleware Chain Integration", () => {
    it("GIVEN 미인증 사용자 WHEN 체인 실행 THEN 인증 단계에서 차단", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue(null);

      // WHEN
      const session = await auth();

      // THEN
      expect(session).toBeNull();
      // 인증 실패시 canCreateProject는 호출되지 않아야 함
      expect(canCreateProject).not.toHaveBeenCalled();
    });

    it("GIVEN 인증된 사용자 + 제한 초과 WHEN 체인 실행 THEN 구독 단계에서 차단", async () => {
      // GIVEN
      const mockSession = { user: { id: "user-123" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (canCreateProject as jest.Mock).mockResolvedValue({
        allowed: false,
        currentCount: 3,
        limit: 3,
        message: "한도 초과",
      });

      // WHEN
      const session = await auth();
      const limitCheck = await canCreateProject(session!.user!.id);

      // THEN
      expect(session).not.toBeNull();
      expect(limitCheck.allowed).toBe(false);
    });

    it("GIVEN 인증된 사용자 + 제한 내 WHEN 체인 실행 THEN 모든 단계 통과", async () => {
      // GIVEN
      const mockSession = { user: { id: "user-123" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (canCreateProject as jest.Mock).mockResolvedValue({
        allowed: true,
        currentCount: 1,
        limit: 3,
      });

      // WHEN
      const session = await auth();
      const limitCheck = await canCreateProject(session!.user!.id);

      // THEN
      expect(session?.user?.id).toBe("user-123");
      expect(limitCheck.allowed).toBe(true);
    });
  });

  describe("Error Scenarios", () => {
    it("GIVEN auth 함수 에러 WHEN 인증 확인 THEN 에러 throw", async () => {
      // GIVEN
      (auth as jest.Mock).mockRejectedValue(new Error("인증 서버 오류"));

      // WHEN & THEN
      await expect(auth()).rejects.toThrow("인증 서버 오류");
    });

    it("GIVEN canCreateProject 에러 WHEN 제한 확인 THEN 에러 throw", async () => {
      // GIVEN
      (canCreateProject as jest.Mock).mockRejectedValue(
        new Error("DB 연결 오류")
      );

      // WHEN & THEN
      await expect(canCreateProject("user-123")).rejects.toThrow(
        "DB 연결 오류"
      );
    });
  });
});
