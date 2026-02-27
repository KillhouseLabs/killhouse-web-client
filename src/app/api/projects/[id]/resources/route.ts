import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
import { TERMINAL_STATUSES } from "@/domains/analysis/model/analysis-state-machine";
import { fetchPolicy } from "@/domains/policy/infra/policy-repository";
import {
  getPlanLimits,
  getPlanName,
  isUnlimited,
} from "@/domains/policy/model/policy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify project belongs to user
    const project = await projectRepository.findByIdAndUser(userId, id);

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const policy = await fetchPolicy();

    const subscription = await subscriptionRepository.findByUserId(userId);

    const planId = subscription?.planId ?? "free";
    const status = subscription?.status ?? "ACTIVE";
    const limits = getPlanLimits(policy, planId);
    const planName = getPlanName(policy, planId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Gather usage counts
    const [analysisCount, activeScans, activeSandboxes] = await Promise.all([
      analysisRepository.countMonthlyByUser(userId, monthStart),
      analysisRepository.countConcurrentByUser(userId, TERMINAL_STATUSES),
      analysisRepository.countActiveSandboxesByUser(userId),
    ]);

    return NextResponse.json({
      planId,
      planName,
      status,
      resources: [
        {
          label: "월간 분석",
          current: analysisCount,
          limit: limits.maxAnalysisPerMonth,
          unlimited: isUnlimited(limits.maxAnalysisPerMonth),
        },
        {
          label: "활성 스캔",
          current: activeScans,
          limit: limits.maxConcurrentScans,
          unlimited: isUnlimited(limits.maxConcurrentScans),
        },
        {
          label: "활성 샌드박스",
          current: activeSandboxes,
          limit: limits.maxConcurrentSandboxes,
          unlimited: isUnlimited(limits.maxConcurrentSandboxes),
        },
      ],
    });
  } catch (error) {
    console.error("Resource usage error:", error);
    return NextResponse.json(
      { error: "리소스 사용량 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
