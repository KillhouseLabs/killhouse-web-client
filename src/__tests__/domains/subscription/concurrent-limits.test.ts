/**
 * Concurrent Limits Tests
 *
 * 동시 스캔 및 리소스 제한 검증 테스트
 */

import {
  canStartConcurrentScan,
  getResourceLimits,
} from "@/domains/subscription/usecase/subscription-limits";
import { prisma } from "@/infrastructure/database/prisma";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    analysis: {
      count: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock fetchPolicy with full test policy
jest.mock("@/domains/policy/infra/policy-repository", () => ({
  fetchPolicy: jest.fn().mockResolvedValue({
    subscriptionStatuses: {
      ACTIVE: { label: "활성", isActive: true },
      CANCELLED: { label: "해지", isActive: false },
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

describe("Concurrent Limits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canStartConcurrentScan", () => {
    it("GIVEN free 플랜, 0개 동시 스캔 WHEN 스캔 시작 THEN 허용", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(0);

      // WHEN
      const result = await canStartConcurrentScan(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
      expect(result.limit).toBe(2);
      expect(prisma.analysis.count).toHaveBeenCalledWith({
        where: {
          project: { userId },
          status: {
            notIn: [
              "COMPLETED",
              "COMPLETED_WITH_ERRORS",
              "FAILED",
              "CANCELLED",
            ],
          },
        },
      });
    });

    it("GIVEN free 플랜, 2개 동시 스캔(한도) WHEN 스캔 시작 THEN 거부 (maxConcurrentScans=2)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(2);

      // WHEN
      const result = await canStartConcurrentScan(userId);

      // THEN
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.message).toContain("동시 스캔 한도");
    });

    it("GIVEN pro 플랜, 4개 동시 스캔 WHEN 스캔 시작 THEN 허용 (maxConcurrentScans=5)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "pro",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(4);

      // WHEN
      const result = await canStartConcurrentScan(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(4);
      expect(result.limit).toBe(5);
    });

    it("GIVEN pro 플랜, 5개 동시 스캔 WHEN 스캔 시작 THEN 거부", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "pro",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(5);

      // WHEN
      const result = await canStartConcurrentScan(userId);

      // THEN
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(5);
      expect(result.limit).toBe(5);
      expect(result.message).toContain("동시 스캔 한도");
    });

    it("GIVEN enterprise 플랜, 9개 동시 스캔 WHEN 스캔 시작 THEN 허용 (maxConcurrentScans=10)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "enterprise",
        status: "ACTIVE",
      });
      (prisma.analysis.count as jest.Mock).mockResolvedValue(9);

      // WHEN
      const result = await canStartConcurrentScan(userId);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(9);
      expect(result.limit).toBe(10);
    });
  });

  describe("getResourceLimits", () => {
    it("GIVEN free 플랜 WHEN 리소스 제한 조회 THEN free 제한 반환 (512m, 0.5, 50)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      // WHEN
      const limits = await getResourceLimits(userId);

      // THEN
      expect(limits.containerMemoryLimit).toBe("512m");
      expect(limits.containerCpuLimit).toBe(0.5);
      expect(limits.containerPidsLimit).toBe(50);
    });

    it("GIVEN pro 플랜 WHEN 리소스 제한 조회 THEN pro 제한 반환 (1g, 1.0, 100)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "pro",
        status: "ACTIVE",
      });

      // WHEN
      const limits = await getResourceLimits(userId);

      // THEN
      expect(limits.containerMemoryLimit).toBe("1g");
      expect(limits.containerCpuLimit).toBe(1.0);
      expect(limits.containerPidsLimit).toBe(100);
    });

    it("GIVEN enterprise 플랜 WHEN 리소스 제한 조회 THEN enterprise 제한 반환 (2g, 2.0, 200)", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "enterprise",
        status: "ACTIVE",
      });

      // WHEN
      const limits = await getResourceLimits(userId);

      // THEN
      expect(limits.containerMemoryLimit).toBe("2g");
      expect(limits.containerCpuLimit).toBe(2.0);
      expect(limits.containerPidsLimit).toBe(200);
    });

    it("GIVEN 구독 없음 WHEN 리소스 제한 조회 THEN free 기본값 반환", async () => {
      // GIVEN
      const userId = "user-1";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      // WHEN
      const limits = await getResourceLimits(userId);

      // THEN
      expect(limits.containerMemoryLimit).toBe("512m");
      expect(limits.containerCpuLimit).toBe(0.5);
      expect(limits.containerPidsLimit).toBe(50);
    });
  });
});
