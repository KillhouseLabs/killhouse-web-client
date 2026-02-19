import {
  isUnlimited,
  canPerformAction,
  isActiveStatus,
  getPlanLimits,
  getPlanName,
  type Policy,
} from "../model/policy";

const testPolicy: Policy = {
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
};

describe("Policy Model", () => {
  describe("isUnlimited", () => {
    it("-1 값은 무제한으로 판단된다", () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it("양수 값은 무제한이 아니다", () => {
      expect(isUnlimited(5)).toBe(false);
    });

    it("0은 무제한이 아니다", () => {
      expect(isUnlimited(0)).toBe(false);
    });
  });

  describe("canPerformAction", () => {
    it("현재 사용량이 제한 미만이면 행동이 허용된다", () => {
      expect(canPerformAction(3, 5)).toBe(true);
    });

    it("현재 사용량이 제한에 도달하면 행동이 거부된다", () => {
      expect(canPerformAction(5, 5)).toBe(false);
    });

    it("현재 사용량이 제한을 초과하면 행동이 거부된다", () => {
      expect(canPerformAction(6, 5)).toBe(false);
    });

    it("무제한 플랜은 항상 행동이 허용된다", () => {
      expect(canPerformAction(9999, -1)).toBe(true);
    });
  });

  describe("isActiveStatus", () => {
    it("ACTIVE는 활성 상태이다", () => {
      expect(isActiveStatus(testPolicy, "ACTIVE")).toBe(true);
    });

    it("TRIALING은 활성 상태이다", () => {
      expect(isActiveStatus(testPolicy, "TRIALING")).toBe(true);
    });

    it("CANCELLED는 비활성 상태이다", () => {
      expect(isActiveStatus(testPolicy, "CANCELLED")).toBe(false);
    });

    it("EXPIRED는 비활성 상태이다", () => {
      expect(isActiveStatus(testPolicy, "EXPIRED")).toBe(false);
    });

    it("PAST_DUE는 비활성 상태이다", () => {
      expect(isActiveStatus(testPolicy, "PAST_DUE")).toBe(false);
    });

    it("존재하지 않는 상태는 비활성이다", () => {
      expect(isActiveStatus(testPolicy, "UNKNOWN")).toBe(false);
    });
  });

  describe("getPlanLimits", () => {
    it("free 플랜의 리소스 제한이 올바르게 반환된다", () => {
      const limits = getPlanLimits(testPolicy, "free");
      expect(limits.maxConcurrentScans).toBe(2);
      expect(limits.maxConcurrentSandboxes).toBe(1);
      expect(limits.containerMemoryLimit).toBe("512m");
    });

    it("pro 플랜의 리소스 제한이 올바르게 반환된다", () => {
      const limits = getPlanLimits(testPolicy, "pro");
      expect(limits.maxConcurrentScans).toBe(5);
      expect(limits.maxConcurrentSandboxes).toBe(3);
      expect(limits.containerMemoryLimit).toBe("1g");
    });

    it("enterprise 플랜의 리소스 제한이 올바르게 반환된다", () => {
      const limits = getPlanLimits(testPolicy, "enterprise");
      expect(limits.maxConcurrentScans).toBe(10);
      expect(limits.maxConcurrentSandboxes).toBe(5);
      expect(limits.containerMemoryLimit).toBe("2g");
    });

    it("존재하지 않는 플랜은 free 플랜 제한을 반환한다", () => {
      const limits = getPlanLimits(testPolicy, "nonexistent");
      expect(limits).toEqual(testPolicy.plans["free"].limits);
    });
  });

  describe("getPlanName", () => {
    it("존재하는 플랜 이름을 반환한다", () => {
      expect(getPlanName(testPolicy, "pro")).toBe("Pro");
    });

    it("존재하지 않는 플랜은 Free를 반환한다", () => {
      expect(getPlanName(testPolicy, "nonexistent")).toBe("Free");
    });
  });
});
