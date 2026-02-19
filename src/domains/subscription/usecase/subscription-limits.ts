/**
 * Subscription Limits UseCase
 *
 * 구독 플랜별 제한 검증 및 사용량 조회
 * 정책은 Supabase 중앙 정책에서 조회
 */

import { prisma } from "@/infrastructure/database/prisma";
import { fetchPolicy } from "@/domains/policy/infra/policy-repository";
import {
  getPlanLimits as getPolicyPlanLimits,
  getPlanName as getPolicyPlanName,
  isActiveStatus,
  canPerformAction,
  type PlanLimits as PolicyPlanLimits,
} from "@/domains/policy/model/policy";

interface PlanLimits {
  projects: number;
  analysisPerMonth: number;
  storageMB: number;
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
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

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

  const currentCount = await prisma.project.count({
    where: {
      userId,
      status: { not: "DELETED" },
    },
  });

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

  const currentCount = await prisma.analysis.count({
    where: {
      project: { userId },
      startedAt: { gte: getMonthStart() },
    },
  });

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

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const policy = await fetchPolicy();
  const subscription = await getUserSubscription(userId);
  const limits = await getPlanLimits(subscription.planId);

  const projectCount = await prisma.project.count({
    where: {
      userId,
      status: { not: "DELETED" },
    },
  });

  const analysisCount = await prisma.analysis.count({
    where: {
      project: { userId },
      startedAt: { gte: getMonthStart() },
    },
  });

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
