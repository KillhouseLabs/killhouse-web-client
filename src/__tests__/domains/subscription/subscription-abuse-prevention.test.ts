/**
 * Subscription Abuse Prevention Tests
 *
 * TOCTOU race condition 방지를 위한 원자적 분석 생성 테스트
 */

import { createAnalysisWithLimitCheck } from "@/domains/subscription/usecase/subscription-limits";
import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Mock repositories
jest.mock(
  "@/domains/subscription/infra/prisma-subscription.repository",
  () => ({
    subscriptionRepository: {
      findByUserId: jest.fn(),
    },
  })
);

jest.mock("@/domains/analysis/infra/prisma-analysis.repository", () => ({
  analysisRepository: {
    countMonthlyByUser: jest.fn(),
    countConcurrentByUser: jest.fn(),
    createWithLimitCheck: jest.fn(),
  },
}));

jest.mock("@/domains/project/infra/prisma-project.repository", () => ({
  projectRepository: {
    countActiveByUser: jest.fn(),
  },
}));

// Mock fetchPolicy
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

describe("Subscription Abuse Prevention", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAnalysisWithLimitCheck - Atomic Analysis Creation", () => {
    it("GIVEN monthly limit reached WHEN createAnalysisWithLimitCheck called THEN returns LIMIT_EXCEEDED", async () => {
      // GIVEN
      const userId = "user-1";
      const input = {
        userId,
        projectId: "project-1",
        repositoryId: "repo-1",
        branch: "main",
        commitHash: "abc123",
      };

      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      (analysisRepository.createWithLimitCheck as jest.Mock).mockResolvedValue({
        created: false,
        reason: "MONTHLY_LIMIT",
        currentCount: 10,
      });

      // WHEN
      const result = await createAnalysisWithLimitCheck(input);

      // THEN
      expect(result.success).toBe(false);
      expect(result.code).toBe("LIMIT_EXCEEDED");
      expect(result.message).toContain("이번 달 분석 한도");
      expect(result.usage).toEqual({
        current: 10,
        limit: 10,
      });
    });

    it("GIVEN concurrent limit reached WHEN createAnalysisWithLimitCheck called THEN returns CONCURRENT_LIMIT_EXCEEDED", async () => {
      // GIVEN
      const userId = "user-1";
      const input = {
        userId,
        projectId: "project-1",
        repositoryId: "repo-1",
        branch: "main",
        commitHash: "abc123",
      };

      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      (analysisRepository.createWithLimitCheck as jest.Mock).mockResolvedValue({
        created: false,
        reason: "CONCURRENT_LIMIT",
        currentCount: 2,
      });

      // WHEN
      const result = await createAnalysisWithLimitCheck(input);

      // THEN
      expect(result.success).toBe(false);
      expect(result.code).toBe("CONCURRENT_LIMIT_EXCEEDED");
      expect(result.message).toContain("동시 스캔 한도");
      expect(result.usage).toEqual({
        current: 2,
        limit: 2,
      });
    });

    it("GIVEN limits not exceeded WHEN createAnalysisWithLimitCheck called THEN creates analysis and returns success", async () => {
      // GIVEN
      const userId = "user-1";
      const input = {
        userId,
        projectId: "project-1",
        repositoryId: "repo-1",
        branch: "main",
        commitHash: "abc123",
      };

      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      (analysisRepository.createWithLimitCheck as jest.Mock).mockResolvedValue({
        created: true,
        analysis: {
          id: "analysis-1",
          status: "PENDING",
          projectId: "project-1",
          repositoryId: "repo-1",
          branch: "main",
          commitHash: "abc123",
        },
      });

      // WHEN
      const result = await createAnalysisWithLimitCheck(input);

      // THEN
      expect(result.success).toBe(true);
      expect(result.analysis).toEqual({
        id: "analysis-1",
        status: "PENDING",
        branch: "main",
        commitHash: "abc123",
      });
      expect(analysisRepository.createWithLimitCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          projectId: "project-1",
          repositoryId: "repo-1",
          branch: "main",
          commitHash: "abc123",
          monthlyLimit: 10,
          concurrentLimit: 2,
        })
      );
    });

    it("GIVEN unlimited plan (-1 limit) WHEN createAnalysisWithLimitCheck called THEN always succeeds", async () => {
      // GIVEN
      const userId = "user-1";
      const input = {
        userId,
        projectId: "project-1",
        repositoryId: null,
        branch: "develop",
        commitHash: null,
      };

      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        planId: "enterprise",
        status: "ACTIVE",
      });

      (analysisRepository.createWithLimitCheck as jest.Mock).mockResolvedValue({
        created: true,
        analysis: {
          id: "analysis-2",
          status: "PENDING",
          projectId: "project-1",
          repositoryId: null,
          branch: "develop",
          commitHash: null,
        },
      });

      // WHEN
      const result = await createAnalysisWithLimitCheck(input);

      // THEN
      expect(result.success).toBe(true);
      expect(result.analysis?.id).toBe("analysis-2");
      expect(analysisRepository.createWithLimitCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          monthlyLimit: -1,
          concurrentLimit: 10,
        })
      );
    });

    it("GIVEN transaction fails WHEN createAnalysisWithLimitCheck called THEN error propagates", async () => {
      // GIVEN
      const userId = "user-1";
      const input = {
        userId,
        projectId: "project-1",
        repositoryId: "repo-1",
        branch: "main",
        commitHash: "abc123",
      };

      (subscriptionRepository.findByUserId as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      (analysisRepository.createWithLimitCheck as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      // WHEN & THEN
      await expect(createAnalysisWithLimitCheck(input)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("Rate Limiting - Analysis Creation", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("GIVEN 5 analysis creation requests within 1 minute WHEN 6th request arrives THEN returns rate limited", () => {
      // GIVEN
      const userId = "user-1";
      const prefix = "analysis-create-user";

      // WHEN - Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(
          userId,
          prefix,
          RATE_LIMITS.analysisCreate
        );
        expect(result.allowed).toBe(true);
      }

      // WHEN - 6th request (over limit)
      const sixthResult = checkRateLimit(
        userId,
        prefix,
        RATE_LIMITS.analysisCreate
      );

      // THEN
      expect(sixthResult.allowed).toBe(false);
      expect(sixthResult.remaining).toBe(0);
      expect(sixthResult.retryAfter).toBeGreaterThan(0);
    });

    it("GIVEN analysis-create rate limit window expired WHEN new request arrives THEN allows it", () => {
      // GIVEN
      const userId = "user-1";
      const prefix = "analysis-create-user";

      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(userId, prefix, RATE_LIMITS.analysisCreate);
      }

      // Verify limit is reached
      const blockedResult = checkRateLimit(
        userId,
        prefix,
        RATE_LIMITS.analysisCreate
      );
      expect(blockedResult.allowed).toBe(false);

      // WHEN - Mock time passing (61 seconds)
      const originalDateNow = Date.now;
      const mockTime = Date.now() + 61_000;
      Date.now = jest.fn(() => mockTime);

      const result = checkRateLimit(userId, prefix, RATE_LIMITS.analysisCreate);

      // THEN
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it("GIVEN different users WHEN making analysis requests THEN rate limits are independent", () => {
      // GIVEN
      const user1 = "user-1";
      const user2 = "user-2";
      const prefix = "analysis-create-user";

      // WHEN - User 1 fills their limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(user1, prefix, RATE_LIMITS.analysisCreate);
      }

      const user1Blocked = checkRateLimit(
        user1,
        prefix,
        RATE_LIMITS.analysisCreate
      );

      // User 2 makes their first request
      const user2Result = checkRateLimit(
        user2,
        prefix,
        RATE_LIMITS.analysisCreate
      );

      // THEN
      expect(user1Blocked.allowed).toBe(false);
      expect(user2Result.allowed).toBe(true);
      expect(user2Result.remaining).toBe(4);
    });
  });
});
