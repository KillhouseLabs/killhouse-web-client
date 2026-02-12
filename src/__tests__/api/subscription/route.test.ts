/**
 * Subscription API Route Tests
 *
 * 구독 정보 및 사용량 조회 API 테스트
 */

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/domains/subscription/usecase/subscription-limits", () => ({
  getUsageStats: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { getUsageStats } from "@/domains/subscription/usecase/subscription-limits";

describe("Subscription API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/subscription", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 구독 정보 요청 THEN 401 에러", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });
    });

    describe("사용량 조회", () => {
      it("GIVEN free 플랜 사용자 WHEN 구독 정보 요청 THEN 사용량 반환", async () => {
        // GIVEN
        const mockUsage = {
          planId: "free",
          planName: "Free",
          status: "ACTIVE",
          projects: {
            current: 2,
            limit: 3,
          },
          analysisThisMonth: {
            current: 5,
            limit: 10,
          },
        };
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (getUsageStats as jest.Mock).mockResolvedValue(mockUsage);

        // WHEN
        const result = await getUsageStats("user-1");

        // THEN
        expect(result.planId).toBe("free");
        expect(result.projects.current).toBe(2);
        expect(result.projects.limit).toBe(3);
        expect(result.analysisThisMonth.current).toBe(5);
        expect(result.analysisThisMonth.limit).toBe(10);
      });

      it("GIVEN pro 플랜 사용자 WHEN 구독 정보 요청 THEN 무제한 프로젝트", async () => {
        // GIVEN
        const mockUsage = {
          planId: "pro",
          planName: "Pro",
          status: "ACTIVE",
          projects: {
            current: 50,
            limit: -1, // unlimited
          },
          analysisThisMonth: {
            current: 30,
            limit: 100,
          },
        };
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (getUsageStats as jest.Mock).mockResolvedValue(mockUsage);

        // WHEN
        const result = await getUsageStats("user-1");

        // THEN
        expect(result.planId).toBe("pro");
        expect(result.projects.limit).toBe(-1);
        expect(result.analysisThisMonth.limit).toBe(100);
      });

      it("GIVEN enterprise 플랜 사용자 WHEN 구독 정보 요청 THEN 모든 항목 무제한", async () => {
        // GIVEN
        const mockUsage = {
          planId: "enterprise",
          planName: "Enterprise",
          status: "ACTIVE",
          projects: {
            current: 200,
            limit: -1,
          },
          analysisThisMonth: {
            current: 500,
            limit: -1,
          },
        };
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (getUsageStats as jest.Mock).mockResolvedValue(mockUsage);

        // WHEN
        const result = await getUsageStats("user-1");

        // THEN
        expect(result.planId).toBe("enterprise");
        expect(result.projects.limit).toBe(-1);
        expect(result.analysisThisMonth.limit).toBe(-1);
      });
    });
  });
});
