import { checkRateLimit, getRateLimitConfig } from "../rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Reset by using unique keys per test
  });

  describe("checkRateLimit", () => {
    it("첫 번째 요청은 허용된다", () => {
      const result = checkRateLimit("test-ip-1", "test-1", {
        windowMs: 60_000,
        maxRequests: 5,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("제한 내 요청은 허용된다", () => {
      const key = "test-ip-2";
      const prefix = "test-2";
      const config = { windowMs: 60_000, maxRequests: 3 };

      checkRateLimit(key, prefix, config);
      checkRateLimit(key, prefix, config);
      const result = checkRateLimit(key, prefix, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("제한 초과 시 요청이 거부된다", () => {
      const key = "test-ip-3";
      const prefix = "test-3";
      const config = { windowMs: 60_000, maxRequests: 2 };

      checkRateLimit(key, prefix, config);
      checkRateLimit(key, prefix, config);
      const result = checkRateLimit(key, prefix, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("다른 prefix는 독립적으로 관리된다", () => {
      const key = "test-ip-4";
      const config = { windowMs: 60_000, maxRequests: 1 };

      checkRateLimit(key, "prefix-a", config);
      const result = checkRateLimit(key, "prefix-b", config);
      expect(result.allowed).toBe(true);
    });
  });

  describe("getRateLimitConfig", () => {
    it("auth 경로는 20/min 제한이다", () => {
      const { config, prefix } = getRateLimitConfig("/api/auth/signin");
      expect(config.maxRequests).toBe(20);
      expect(prefix).toBe("auth");
    });

    it("ai-chat 경로는 10/min 제한이다", () => {
      const { config, prefix } = getRateLimitConfig("/api/analyses/ai-chat");
      expect(config.maxRequests).toBe(10);
      expect(prefix).toBe("ai-chat");
    });

    it("code-fix 경로는 10/min 제한이다", () => {
      const { config, prefix } = getRateLimitConfig("/api/analyses/code-fix");
      expect(config.maxRequests).toBe(10);
      expect(prefix).toBe("code-fix");
    });

    it("checkout 경로는 5/min 제한이다", () => {
      const { config, prefix } = getRateLimitConfig(
        "/api/subscription/checkout"
      );
      expect(config.maxRequests).toBe(5);
      expect(prefix).toBe("checkout");
    });

    it("기타 API 경로는 60/min 제한이다", () => {
      const { config, prefix } = getRateLimitConfig("/api/projects");
      expect(config.maxRequests).toBe(60);
      expect(prefix).toBe("general");
    });
  });
});
