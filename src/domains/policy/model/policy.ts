export interface SubscriptionStatusConfig {
  label: string;
  isActive: boolean;
}

export interface PlanLimits {
  maxProjects: number;
  maxAnalysisPerMonth: number;
  maxStorageMB: number;
  maxConcurrentScans: number;
  maxConcurrentSandboxes: number;
  maxConcurrentExploitSessions: number;
  containerMemoryLimit: string;
  containerCpuLimit: number;
  containerPidsLimit: number;
  scanRateLimitPerMin: number;
}

export interface PlanConfig {
  name: string;
  price: number;
  limits: PlanLimits;
}

export interface Policy {
  subscriptionStatuses: Record<string, SubscriptionStatusConfig>;
  plans: Record<string, PlanConfig>;
}

const DEFAULT_FREE_LIMITS: PlanLimits = {
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
};

export const isUnlimited = (value: number): boolean => value === -1;

export const canPerformAction = (current: number, limit: number): boolean =>
  isUnlimited(limit) || current < limit;

export const isActiveStatus = (policy: Policy, status: string): boolean =>
  policy.subscriptionStatuses[status]?.isActive ?? false;

export const getPlanLimits = (policy: Policy, planId: string): PlanLimits =>
  policy.plans[planId]?.limits ??
  policy.plans["free"]?.limits ??
  DEFAULT_FREE_LIMITS;

export const getPlanName = (policy: Policy, planId: string): string =>
  policy.plans[planId]?.name ?? "Free";

export const getPlanPrice = (policy: Policy, planId: string): number =>
  policy.plans[planId]?.price ?? 0;

export { DEFAULT_FREE_LIMITS };
