/**
 * Subscription Limits UseCase
 *
 * 구독 플랜별 제한 검증 및 사용량 조회
 * 정책은 Supabase 중앙 정책에서 조회
 */

import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { fetchPolicy } from "@/domains/policy/infra/policy-repository";
import {
  getPlanLimits as getPolicyPlanLimits,
  getPlanName as getPolicyPlanName,
  isActiveStatus,
  canPerformAction,
  type PlanLimits as PolicyPlanLimits,
} from "@/domains/policy/model/policy";
import { TERMINAL_STATUSES } from "@/domains/analysis/model/analysis-state-machine";

interface PlanLimits {
  projects: number;
  analysisPerMonth: number;
  storageMB: number;
}

export interface ResourceLimits {
  containerMemoryLimit: string;
  containerCpuLimit: number;
  containerPidsLimit: number;
}

interface LimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  message?: string;
}

interface UsageStats {
  planId: string;
  planName: string;
  status: string;
  projects: {
    current: number;
    limit: number;
  };
  analysisThisMonth: {
    current: number;
    limit: number;
  };
}

function toLegacyLimits(policyLimits: PolicyPlanLimits): PlanLimits {
  return {
    projects: policyLimits.maxProjects,
    analysisPerMonth: policyLimits.maxAnalysisPerMonth,
    storageMB: policyLimits.maxStorageMB,
  };
}

export async function getPlanLimits(planId: string): Promise<PlanLimits> {
  const policy = await fetchPolicy();
  return toLegacyLimits(getPolicyPlanLimits(policy, planId));
}

async function getUserSubscription(userId: string) {
  const policy = await fetchPolicy();
  const subscription = await subscriptionRepository.findByUserId(userId);

  if (!subscription || !isActiveStatus(policy, subscription.status)) {
    return {
      planId: "free",
      status: subscription?.status || "ACTIVE",
      isActive: false,
    };
  }

  return {
    planId: subscription.planId,
    status: subscription.status,
    isActive: true,
  };
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function canCreateProject(
  userId: string
): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const limits = await getPlanLimits(subscription.planId);

  const currentCount = await projectRepository.countActiveByUser(userId);

  const allowed = canPerformAction(currentCount, limits.projects);

  return {
    allowed,
    currentCount,
    limit: limits.projects,
    message: allowed
      ? undefined
      : `프로젝트 생성 한도(${limits.projects}개)에 도달했습니다. 플랜을 업그레이드하세요.`,
  };
}

export async function canRunAnalysis(
  userId: string
): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const limits = await getPlanLimits(subscription.planId);

  const currentCount = await analysisRepository.countMonthlyByUser(
    userId,
    getMonthStart()
  );

  const allowed = canPerformAction(currentCount, limits.analysisPerMonth);

  return {
    allowed,
    currentCount,
    limit: limits.analysisPerMonth,
    message: allowed
      ? undefined
      : `이번 달 분석 한도(${limits.analysisPerMonth}회)에 도달했습니다. 플랜을 업그레이드하세요.`,
  };
}

export async function canStartConcurrentScan(
  userId: string
): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const policy = await fetchPolicy();
  const policyLimits = getPolicyPlanLimits(policy, subscription.planId);

  const currentCount = await analysisRepository.countConcurrentByUser(
    userId,
    TERMINAL_STATUSES
  );

  const allowed = canPerformAction(
    currentCount,
    policyLimits.maxConcurrentScans
  );

  return {
    allowed,
    currentCount,
    limit: policyLimits.maxConcurrentScans,
    message: allowed
      ? undefined
      : `동시 스캔 한도(${policyLimits.maxConcurrentScans}개)에 도달했습니다. 진행 중인 분석이 완료될 때까지 기다려주세요.`,
  };
}

export async function getResourceLimits(
  userId: string
): Promise<ResourceLimits> {
  const subscription = await getUserSubscription(userId);
  const policy = await fetchPolicy();
  const policyLimits = getPolicyPlanLimits(policy, subscription.planId);

  return {
    containerMemoryLimit: policyLimits.containerMemoryLimit,
    containerCpuLimit: policyLimits.containerCpuLimit,
    containerPidsLimit: policyLimits.containerPidsLimit,
  };
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const policy = await fetchPolicy();
  const subscription = await getUserSubscription(userId);
  const limits = await getPlanLimits(subscription.planId);

  const projectCount = await projectRepository.countActiveByUser(userId);

  const analysisCount = await analysisRepository.countMonthlyByUser(
    userId,
    getMonthStart()
  );

  return {
    planId: subscription.planId,
    planName: getPolicyPlanName(policy, subscription.planId),
    status: subscription.status,
    projects: {
      current: projectCount,
      limit: limits.projects,
    },
    analysisThisMonth: {
      current: analysisCount,
      limit: limits.analysisPerMonth,
    },
  };
}

export interface CreateAnalysisInput {
  userId: string;
  projectId: string;
  repositoryId: string | null;
  branch: string;
  commitHash: string | null;
}

export interface CreateAnalysisResult {
  success: boolean;
  analysis?: {
    id: string;
    status: string;
    branch: string;
    commitHash: string | null;
  };
  code?: "LIMIT_EXCEEDED" | "CONCURRENT_LIMIT_EXCEEDED";
  message?: string;
  usage?: { current: number; limit: number };
}

export async function createAnalysisWithLimitCheck(
  input: CreateAnalysisInput
): Promise<CreateAnalysisResult> {
  const subscription = await getUserSubscription(input.userId);
  const limits = await getPlanLimits(subscription.planId);
  const policy = await fetchPolicy();
  const policyLimits = getPolicyPlanLimits(policy, subscription.planId);

  const result = await analysisRepository.createWithLimitCheck({
    userId: input.userId,
    projectId: input.projectId,
    repositoryId: input.repositoryId,
    branch: input.branch,
    commitHash: input.commitHash,
    monthlyLimit: limits.analysisPerMonth,
    concurrentLimit: policyLimits.maxConcurrentScans,
    monthStart: getMonthStart(),
    terminalStatuses: TERMINAL_STATUSES,
  });

  if (!result.created) {
    if (result.reason === "MONTHLY_LIMIT") {
      return {
        success: false,
        code: "LIMIT_EXCEEDED",
        message: `이번 달 분석 한도(${limits.analysisPerMonth}회)에 도달했습니다. 플랜을 업그레이드하세요.`,
        usage: {
          current: result.currentCount,
          limit: limits.analysisPerMonth,
        },
      };
    }
    return {
      success: false,
      code: "CONCURRENT_LIMIT_EXCEEDED",
      message: `동시 스캔 한도(${policyLimits.maxConcurrentScans}개)에 도달했습니다. 진행 중인 분석이 완료될 때까지 기다려주세요.`,
      usage: {
        current: result.currentCount,
        limit: policyLimits.maxConcurrentScans,
      },
    };
  }

  return {
    success: true,
    analysis: {
      id: result.analysis.id,
      status: result.analysis.status,
      branch: result.analysis.branch,
      commitHash: result.analysis.commitHash,
    },
  };
}
