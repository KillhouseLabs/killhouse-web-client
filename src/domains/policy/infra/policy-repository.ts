import { prisma } from "@/infrastructure/database/prisma";
import type { Policy } from "../model/policy";
import { DEFAULT_FREE_LIMITS } from "../model/policy";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedPolicy: Policy | null = null;
let cacheTimestamp = 0;

const DEFAULT_POLICY: Policy = {
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
      limits: DEFAULT_FREE_LIMITS,
    },
  },
};

export async function fetchPolicy(): Promise<Policy> {
  const now = Date.now();

  if (cachedPolicy && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPolicy;
  }

  try {
    const record = await prisma.platformPolicy.findUnique({
      where: { id: "current" },
    });

    if (record?.policy) {
      cachedPolicy = record.policy as unknown as Policy;
      cacheTimestamp = now;
      return cachedPolicy;
    }
  } catch {
    console.error("Failed to fetch platform policy, using fallback");
  }

  return DEFAULT_POLICY;
}

export function invalidatePolicyCache(): void {
  cachedPolicy = null;
  cacheTimestamp = 0;
}
