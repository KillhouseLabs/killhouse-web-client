"use client";

import { useState, useEffect } from "react";
import { PLANS } from "@/config/constants";
import { CheckoutButton } from "./checkout-button";

interface UsageStats {
  planId: string;
  planName: string;
  status: string;
}

const planFeatures = {
  free: [
    "프로젝트 3개",
    "월 10회 분석",
    "100MB 저장공간",
    "기본 취약점 보고서",
    "이메일 지원",
  ],
  pro: [
    "무제한 프로젝트",
    "월 100회 분석",
    "10GB 저장공간",
    "상세 취약점 보고서",
    "우선 지원",
    "API 액세스",
    "팀 협업 기능",
  ],
  enterprise: [
    "무제한 프로젝트",
    "무제한 분석",
    "무제한 저장공간",
    "맞춤형 보고서",
    "전담 지원",
    "SLA 보장",
    "온프레미스 배포 가능",
    "커스텀 통합",
  ],
};

export function PricingPlans() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          const usage = data.data as UsageStats;
          setCurrentPlan(usage.planId);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Free Plan */}
        <PlanCard
          plan={PLANS.FREE}
          features={planFeatures.free}
          isCurrent={currentPlan === "free"}
          isDowngrade={currentPlan !== "free"}
        />

        {/* Pro Plan */}
        <PlanCard
          plan={PLANS.PRO}
          features={planFeatures.pro}
          isCurrent={currentPlan === "pro"}
          isUpgrade={currentPlan === "free"}
          isPopular
        />

        {/* Enterprise Plan */}
        <PlanCard
          plan={PLANS.ENTERPRISE}
          features={planFeatures.enterprise}
          isCurrent={currentPlan === "enterprise"}
          isUpgrade={currentPlan !== "enterprise"}
          isEnterprise
        />
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: (typeof PLANS)[keyof typeof PLANS];
  features: string[];
  isCurrent: boolean;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

function PlanCard({
  plan,
  features,
  isCurrent,
  isUpgrade,
  isPopular,
  isEnterprise,
}: PlanCardProps) {
  return (
    <div
      className={`relative rounded-xl border p-6 ${
        isPopular
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border bg-card"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
          인기
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
          현재 플랜
        </div>
      )}

      <div className="space-y-4">
        {/* Plan Name */}
        <div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold">무료</span>
          ) : plan.price === -1 ? (
            <span className="text-3xl font-bold">문의</span>
          ) : (
            <>
              <span className="text-3xl font-bold">
                ₩{plan.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/월</span>
            </>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 ${
                  isPopular ? "text-primary" : "text-green-500"
                }`}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <div className="pt-4">
          {isCurrent ? (
            <button
              disabled
              className="w-full rounded-lg border border-border bg-muted py-2 text-sm font-medium text-muted-foreground"
            >
              현재 플랜
            </button>
          ) : isEnterprise ? (
            <a
              href="mailto:sales@autopsy-agent.io"
              className="block w-full rounded-lg border border-primary bg-transparent py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              문의하기
            </a>
          ) : plan.price === 0 ? (
            <button
              disabled
              className="w-full rounded-lg border border-border bg-muted py-2 text-sm font-medium text-muted-foreground"
            >
              무료 플랜
            </button>
          ) : isUpgrade ? (
            <CheckoutButton planId={plan.id} planName={plan.name} />
          ) : (
            <button
              disabled
              className="w-full rounded-lg border border-border bg-muted py-2 text-sm font-medium text-muted-foreground"
            >
              현재 플랜보다 낮음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
