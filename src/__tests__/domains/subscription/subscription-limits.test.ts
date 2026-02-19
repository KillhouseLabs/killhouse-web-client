/**
 * Subscription Limits Tests
 *
 * 구독 플랜별 제한 검증 테스트
 */

import {
  getPlanLimits,
  canCreateProject,
  canRunAnalysis,
  getUsageStats,
} from "@/domains/subscription/usecase/subscription-limits";
import { prisma } from "@/infrastructure/database/prisma";
import { PLANS } from "@/config/constants";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    analysis: {
      count: jest.fn(),
    },
  },
}));

// Mock fetchPolicy to return a policy matching the PLANS constants
jest.mock("@/domains/policy/infra/policy-repository", () => ({
  fetchPolicy: jest.fn().mockResolvedValue({
    subscriptionStatuses: {
      ACTIVE: { label: "활성", isActive: true },
      TRIALING: { label: "체험", isActive: true },
      CANCELLED: { label: "해지", isActive: false },
      EXPIRED: { label: "만료", isActive: false },
      PAST_DUE: { label: "연체", isActive: false },
    },
    plans: {
      free: {
        name: "Free",
        price: 0,
        limits: {
          maxProjects: 3,
          maxAnalysisPerMonth: 10,
          maxStorageMB: 100,
          maxConcurrentScans: 2,
          maxConcurrentSandboxes: 1,
          maxConcurrentExploitSessions: 1,
          containerMemoryLimit: "512m",
          containerCpuLimit: 0.5,
          containerPidsLimit: 50,
          scanRateLimitPerMin: 5,
        },
      },
      pro: {
        name: "Pro",
        price: 29000,
        limits: {
          maxProjects: -1,
          maxAnalysisPerMonth: 100,
          maxStorageMB: 10240,
          maxConcurrentScans: 5,
          maxConcurrentSandboxes: 3,
          maxConcurrentExploitSessions: 3,
          containerMemoryLimit: "1g",
          containerCpuLimit: 1.0,
          containerPidsLimit: 100,
          scanRateLimitPerMin: 10,
        },
      },
      enterprise: {
        name: "Enterprise",
        price: -1,
        limits: {
          maxProjects: -1,
          maxAnalysisPerMonth: -1,
          maxStorageMB: -1,
          maxConcurrentScans: 10,
          maxConcurrentSandboxes: 5,
          maxConcurrentExploitSessions: 5,
          containerMemoryLimit: "2g",
          containerCpuLimit: 2.0,
          containerPidsLimit: 200,
          scanRateLimitPerMin: 30,
        },
      },
    },
  }),
}));

describe("Subscription Limits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPlanLimits", () => {
    it("GIVEN free 플랜 WHEN 제한 조회 THEN free 플랜 제한이 반환되어야 한다", async () => {
      // GIVEN
      const planId = "free";

      // WHEN
      const limits = await getPlanLimits(planId);

      // THEN
      expect(limits).toEqual(PLANS.FREE.limits);
      expect(limits.projects).toBe(3);
      expect(limits.analysisPerMonth).toBe(10);
    });

    it("GIVEN pro 플랜 WHEN 제한 조회 THEN pro 플랜 제한이 반환되어야 한다", async () => {
      // GIVEN
      const planId = "pro";

      // WHEN
      const limits = await getPlanLimits(planId);

      // THEN
      expect(limits).toEqual(PLANS.PRO.limits);
      expect(limits.projects).toBe(-1); // unlimited
      expect(limits.analysisPerMonth).toBe(100);
    });

    it("GIVEN enterprise 플랜 WHEN 제한 조회 THEN enterprise 플랜 제한이 반환되어야 한다", async () => {
      // GIVEN
      const planId = "enterprise";

      // WHEN
      const limits = await getPlanLimits(planId);

      // THEN
      expect(limits).toEqual(PLANS.ENTERPRISE.limits);
      expect(limits.projects).toBe(-1); // unlimited
      expect(limits.analysisPerMonth).toBe(-1); // unlimited
    });

    it("GIVEN 알 수 없는 플랜 WHEN 제한 조회 THEN free 플랜 제한이 반환되어야 한다", async () => {
      // GIVEN
      const planId = "unknown";

      // WHEN
      const limits = await getPlanLimits(planId);

      // THEN
      expect(limits).toEqual(PLANS.FREE.limits);
    });
  });

  describe("canCreateProject", () => {
    it("GIVEN free 플랜 + 프로젝트 0개 WHEN 생성 가능 여부 확인 THEN true 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.project.count as jest.Mock).mockResolvedValue(0);

      // WHEN
      const result = await canCreateProject(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
      expect(result.limit).toBe(3);
    });

    it("GIVEN free 플랜 + 프로젝트 2개 WHEN 생성 가능 여부 확인 THEN true 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.project.count as jest.Mock).mockResolvedValue(2);

      // WHEN
      const result = await canCreateProject(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(2);
      expect(result.limit).toBe(3);
    });

    it("GIVEN free 플랜 + 프로젝트 3개 WHEN 생성 가능 여부 확인 THEN false 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.project.count as jest.Mock).mockResolvedValue(3);

      // WHEN
      const result = await canCreateProject(userId);

      // THEN
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(3);
      expect(result.limit).toBe(3);
      expect(result.message).toContain("프로젝트 생성 한도");
    });

    it("GIVEN pro 플랜 + 프로젝트 100개 WHEN 생성 가능 여부 확인 THEN true 반환 (무제한)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "pro",
        status: "ACTIVE",
      });
      (prisma.project.count as jest.Mock).mockResolvedValue(100);

      // WHEN
      const result = await canCreateProject(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1); // unlimited
    });

    it("GIVEN 구독 없음 WHEN 생성 가능 여부 확인 THEN free 플랜 제한 적용", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.project.count as jest.Mock).mockResolvedValue(3);

      // WHEN
      const result = await canCreateProject(userId);

      // THEN
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(3);
    });

    it("GIVEN 구독 상태가 CANCELLED WHEN 생성 가능 여부 확인 THEN free 플랜 제한 적용", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "pro",
        status: "CANCELLED",
      });
      (prisma.project.count as jest.Mock).mockResolvedValue(3);

      // WHEN
      const result = await canCreateProject(userId);

      // THEN
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(3); // Falls back to free plan
    });
  });

  describe("canRunAnalysis", () => {
    it("GIVEN free 플랜 + 이번 달 분석 0회 WHEN 분석 가능 여부 확인 THEN true 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(0);

      // WHEN
      const result = await canRunAnalysis(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
      expect(result.limit).toBe(10);
    });

    it("GIVEN free 플랜 + 이번 달 분석 10회 WHEN 분석 가능 여부 확인 THEN false 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(10);

      // WHEN
      const result = await canRunAnalysis(userId);

      // THEN
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.message).toContain("분석 한도");
    });

    it("GIVEN pro 플랜 + 이번 달 분석 50회 WHEN 분석 가능 여부 확인 THEN true 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "pro",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(50);

      // WHEN
      const result = await canRunAnalysis(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(50);
      expect(result.limit).toBe(100);
    });

    it("GIVEN enterprise 플랜 + 이번 달 분석 1000회 WHEN 분석 가능 여부 확인 THEN true 반환 (무제한)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "enterprise",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(1000);

      // WHEN
      const result = await canRunAnalysis(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1); // unlimited
    });
  });

  describe("getUsageStats", () => {
    it("GIVEN 사용자 WHEN 사용량 조회 THEN 프로젝트/분석 사용량 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.project.count as jest.Mock).mockResolvedValue(2);
      (prisma.analysis.count as jest.Mock).mockResolvedValue(5);

      // WHEN
      const stats = await getUsageStats(userId);

      // THEN
      expect(stats.planId).toBe("free");
      expect(stats.projects.current).toBe(2);
      expect(stats.projects.limit).toBe(3);
      expect(stats.analysisThisMonth.current).toBe(5);
      expect(stats.analysisThisMonth.limit).toBe(10);
    });
  });
});
