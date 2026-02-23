interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function getStore(prefix: string): Map<string, RateLimitEntry> {
  let store = stores.get(prefix);
  if (!store) {
    store = new Map();
    stores.set(prefix, store);
  }
  return store;
}

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const store of stores.values()) {
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }
  }
}

export function checkRateLimit(
  key: string,
  prefix: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const store = getStore(prefix);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export const RATE_LIMITS = {
  auth: { windowMs: 60_000, maxRequests: 20 },
  aiChat: { windowMs: 60_000, maxRequests: 10 },
  codeFix: { windowMs: 60_000, maxRequests: 10 },
  checkout: { windowMs: 60_000, maxRequests: 5 },
  analysisCreate: { windowMs: 60_000, maxRequests: 5 },
  general: { windowMs: 60_000, maxRequests: 60 },
} as const;

export function getRateLimitConfig(pathname: string): {
  config: RateLimitConfig;
  prefix: string;
} {
  if (pathname.startsWith("/api/auth/")) {
    return { config: RATE_LIMITS.auth, prefix: "auth" };
  }
  if (pathname.startsWith("/api/analyses/ai-chat")) {
    return { config: RATE_LIMITS.aiChat, prefix: "ai-chat" };
  }
  if (pathname.startsWith("/api/analyses/code-fix")) {
    return { config: RATE_LIMITS.codeFix, prefix: "code-fix" };
  }
  if (pathname.startsWith("/api/subscription/checkout")) {
    return { config: RATE_LIMITS.checkout, prefix: "checkout" };
  }
  if (pathname.match(/^\/api\/projects\/[^/]+\/analyses$/)) {
    return { config: RATE_LIMITS.analysisCreate, prefix: "analysis-create" };
  }
  if (pathname.startsWith("/api/")) {
    return { config: RATE_LIMITS.general, prefix: "general" };
  }
  return { config: RATE_LIMITS.general, prefix: "general" };
}
