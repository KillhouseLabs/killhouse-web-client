/**
 * Subscription Limits UseCase
 *
 * 구독 플랜별 제한 검증 및 사용량 조회
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PLANS } from "@/config/constants";

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

const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"];

/**
 * 플랜 ID로 제한 정보 조회
 */
export function getPlanLimits(planId: string): PlanLimits {
  const planKey = planId.toUpperCase() as keyof typeof PLANS;
  const plan = PLANS[planKey];

  if (!plan) {
    return PLANS.FREE.limits;
  }

  return plan.limits;
}

/**
 * 플랜 ID로 플랜 이름 조회
 */
function getPlanName(planId: string): string {
  const planKey = planId.toUpperCase() as keyof typeof PLANS;
  const plan = PLANS[planKey];
  return plan?.name || "Free";
}

/**
 * 사용자의 활성 구독 정보 조회
 */
async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // 구독이 없거나 비활성 상태면 free 플랜 적용
  if (!subscription || !ACTIVE_STATUSES.includes(subscription.status)) {
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

/**
 * 이번 달 시작일 계산
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * 프로젝트 생성 가능 여부 확인
 */
export async function canCreateProject(
  userId: string
): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const limits = getPlanLimits(subscription.planId);

  // 무제한인 경우
  if (limits.projects === -1) {
    const currentCount = await prisma.project.count({
      where: {
        userId,
        status: { not: "DELETED" },
      },
    });

    return {
      allowed: true,
      currentCount,
      limit: -1,
    };
  }

  // 현재 프로젝트 수 조회
  const currentCount = await prisma.project.count({
    where: {
      userId,
      status: { not: "DELETED" },
    },
  });

  const allowed = currentCount < limits.projects;

  return {
    allowed,
    currentCount,
    limit: limits.projects,
    message: allowed
      ? undefined
      : `프로젝트 생성 한도(${limits.projects}개)에 도달했습니다. 플랜을 업그레이드하세요.`,
  };
}

/**
 * 분석 실행 가능 여부 확인
 */
export async function canRunAnalysis(
  userId: string
): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const limits = getPlanLimits(subscription.planId);

  // 무제한인 경우
  if (limits.analysisPerMonth === -1) {
    const currentCount = await prisma.analysis.count({
      where: {
        project: { userId },
        startedAt: { gte: getMonthStart() },
      },
    });

    return {
      allowed: true,
      currentCount,
      limit: -1,
    };
  }

  // 이번 달 분석 횟수 조회
  const currentCount = await prisma.analysis.count({
    where: {
      project: { userId },
      startedAt: { gte: getMonthStart() },
    },
  });

  const allowed = currentCount < limits.analysisPerMonth;

  return {
    allowed,
    currentCount,
    limit: limits.analysisPerMonth,
    message: allowed
      ? undefined
      : `이번 달 분석 한도(${limits.analysisPerMonth}회)에 도달했습니다. 플랜을 업그레이드하세요.`,
  };
}

/**
 * 사용자의 사용량 통계 조회
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  const subscription = await getUserSubscription(userId);
  const limits = getPlanLimits(subscription.planId);

  // 프로젝트 수
  const projectCount = await prisma.project.count({
    where: {
      userId,
      status: { not: "DELETED" },
    },
  });

  // 이번 달 분석 횟수
  const analysisCount = await prisma.analysis.count({
    where: {
      project: { userId },
      startedAt: { gte: getMonthStart() },
    },
  });

  return {
    planId: subscription.planId,
    planName: getPlanName(subscription.planId),
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
