/**
 * Subscription Abuse Prevention Tests
 *
 * TOCTOU race condition 방지를 위한 원자적 분석 생성 테스트
 */

import { createAnalysisWithLimitCheck } from "@/domains/subscription/usecase/subscription-limits";
import { prisma } from "@/infrastructure/database/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
    },
    analysis: {
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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
  let mockTx: {
    analysis: {
      count: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock transaction object
    mockTx = {
      analysis: {
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    // Mock $transaction to call the callback with mockTx
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) =>
      cb(mockTx)
    );
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

      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      // Monthly limit reached (10/10)
      mockTx.analysis.count.mockResolvedValueOnce(10);

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
      expect(mockTx.analysis.create).not.toHaveBeenCalled();
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

      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      // Monthly limit OK (5/10)
      mockTx.analysis.count.mockResolvedValueOnce(5);
      // Concurrent limit reached (2/2)
      mockTx.analysis.count.mockResolvedValueOnce(2);

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
      expect(mockTx.analysis.create).not.toHaveBeenCalled();
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

      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      // Monthly limit OK (5/10)
      mockTx.analysis.count.mockResolvedValueOnce(5);
      // Concurrent limit OK (1/2)
      mockTx.analysis.count.mockResolvedValueOnce(1);
      // Mock analysis creation
      mockTx.analysis.create.mockResolvedValue({
        id: "analysis-1",
        status: "PENDING",
        branch: "main",
        commitHash: "abc123",
        projectId: "project-1",
        repositoryId: "repo-1",
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
      expect(mockTx.analysis.create).toHaveBeenCalledWith({
        data: {
          projectId: "project-1",
          repositoryId: "repo-1",
          branch: "main",
          commitHash: "abc123",
          status: "PENDING",
        },
      });
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

      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "enterprise",
        status: "ACTIVE",
      });

      // High usage but unlimited
      mockTx.analysis.count.mockResolvedValueOnce(1000);
      mockTx.analysis.count.mockResolvedValueOnce(5);
      mockTx.analysis.create.mockResolvedValue({
        id: "analysis-2",
        status: "PENDING",
        branch: "develop",
        commitHash: null,
        projectId: "project-1",
        repositoryId: null,
      });

      // WHEN
      const result = await createAnalysisWithLimitCheck(input);

      // THEN
      expect(result.success).toBe(true);
      expect(result.analysis?.id).toBe("analysis-2");
      expect(mockTx.analysis.create).toHaveBeenCalled();
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

      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        planId: "free",
        status: "ACTIVE",
      });

      // Simulate transaction failure
      (prisma.$transaction as jest.Mock).mockRejectedValue(
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
      // Clear rate limit stores between tests
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
