"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutButton } from "@/components/subscription/checkout-button";
import {
  PLANS,
  formatLimit,
  formatStorage,
  formatPrice,
} from "@/domains/subscription/model/plan";

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

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SubscriptionPageContent />
    </Suspense>
  );
}

function SubscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/subscription");
      if (response.ok) {
        const data = await response.json();
        setUsage(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 결제 콜백 처리
  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const verify = searchParams.get("verify");
    const error = searchParams.get("error");

    if (error) {
      alert(`결제 실패: ${error}`);
      // URL에서 에러 파라미터 제거
      router.replace("/subscription");
      return;
    }

    if (paymentId && verify === "true" && !isVerifying) {
      setIsVerifying(true);
      // 결제 검증
      fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("구독이 성공적으로 완료되었습니다!");
            fetchUsage();
          } else {
            alert(result.error || "결제 검증에 실패했습니다");
          }
        })
        .catch(() => {
          alert("결제 검증 중 오류가 발생했습니다");
        })
        .finally(() => {
          setIsVerifying(false);
          // URL에서 파라미터 제거
          router.replace("/subscription");
        });
    }
  }, [searchParams, router, isVerifying]);

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "정말 구독을 해지하시겠습니까?\n\n⚠️ 주의사항:\n• 해지 시 즉시 무료 플랜으로 변경됩니다\n• 남은 기간에 대한 환불은 제공되지 않습니다\n• 유료 기능을 즉시 사용할 수 없게 됩니다\n\n계속하시겠습니까?"
    );

    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "구독 해지에 실패했습니다");
        return;
      }

      alert("구독이 해지되었습니다.");
      router.refresh();
      await fetchUsage();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert("구독 해지 중 오류가 발생했습니다");
    } finally {
      setIsCancelling(false);
    }
  };

  const currentPlanId = usage?.planId || "free";
  const currentPlan =
    PLANS[currentPlanId.toUpperCase() as keyof typeof PLANS] || PLANS.FREE;
  const isPaidPlan = currentPlanId !== "free";

  const formatUsage = (current: number, limit: number) => {
    if (limit === -1) return `${current} / 무제한`;
    return `${current} / ${limit}`;
  };

  if (isLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        {isVerifying && (
          <p className="mt-4 text-sm text-muted-foreground">
            결제를 검증하고 있습니다...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">구독 관리</h1>
        <p className="mt-1 text-muted-foreground">
          현재 구독 플랜을 확인하고 관리하세요
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">현재 플랜</h2>
            <p className="mt-1 text-muted-foreground">
              {currentPlan.name} 플랜을 사용 중입니다
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              currentPlanId === "pro"
                ? "bg-primary text-primary-foreground"
                : currentPlanId === "enterprise"
                  ? "bg-purple-500 text-white"
                  : "bg-muted"
            }`}
          >
            {currentPlan.name}
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">프로젝트</p>
            <p className="mt-1 text-2xl font-bold">
              {formatUsage(
                usage?.projects.current || 0,
                usage?.projects.limit ?? 3
              )}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">월간 분석</p>
            <p className="mt-1 text-2xl font-bold">
              {formatUsage(
                usage?.analysisThisMonth.current || 0,
                usage?.analysisThisMonth.limit ?? 10
              )}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">스토리지</p>
            <p className="mt-1 text-2xl font-bold">
              {currentPlan.limits.storageMB === -1
                ? "무제한"
                : currentPlan.limits.storageMB >= 1024
                  ? `${currentPlan.limits.storageMB / 1024}GB`
                  : `${currentPlan.limits.storageMB}MB`}
            </p>
          </div>
        </div>

        {/* Cancel Subscription Button */}
        {isPaidPlan && (
          <div className="mt-6 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              {isCancelling ? "해지 중..." : "구독 해지"}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              구독을 해지하면 즉시 무료 플랜으로 변경됩니다.
            </p>
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">플랜 선택</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              개인 프로젝트에 적합
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold">
                {formatPrice(PLANS.FREE.price)}
              </span>
              <span className="text-muted-foreground">/월</span>
            </p>
            <ul className="mt-6 space-y-3">
              <PlanFeature>
                최대 {formatLimit(PLANS.FREE.limits.projects)}개 프로젝트
              </PlanFeature>
              <PlanFeature>
                월 {formatLimit(PLANS.FREE.limits.analysisPerMonth)}회 분석
              </PlanFeature>
              <PlanFeature>
                {formatStorage(PLANS.FREE.limits.storageMB)} 스토리지
              </PlanFeature>
            </ul>
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
            >
              {currentPlanId === "free" ? "현재 플랜" : "무료 플랜"}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-6">
            <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              인기
            </span>
            {currentPlanId === "pro" && (
              <span className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                현재 플랜
              </span>
            )}
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              팀과 스타트업에 적합
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold">
                {formatPrice(PLANS.PRO.price)}
              </span>
              <span className="text-muted-foreground">/월</span>
            </p>
            <ul className="mt-6 space-y-3">
              <PlanFeature>
                {formatLimit(PLANS.PRO.limits.projects) === "무제한"
                  ? "무제한"
                  : `최대 ${formatLimit(PLANS.PRO.limits.projects)}개`}{" "}
                프로젝트
              </PlanFeature>
              <PlanFeature>
                월{" "}
                {formatLimit(PLANS.PRO.limits.analysisPerMonth) === "무제한"
                  ? "무제한"
                  : `${formatLimit(PLANS.PRO.limits.analysisPerMonth)}회`}{" "}
                분석
              </PlanFeature>
              <PlanFeature>
                {formatStorage(PLANS.PRO.limits.storageMB)} 스토리지
              </PlanFeature>
              <PlanFeature>우선 지원</PlanFeature>
            </ul>
            <div className="mt-6">
              {currentPlanId === "pro" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
                >
                  현재 플랜
                </button>
              ) : currentPlanId === "enterprise" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
                >
                  현재 플랜보다 낮음
                </button>
              ) : (
                <CheckoutButton planId="pro" planName="Pro" />
              )}
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="relative rounded-xl border border-border bg-card p-6">
            {currentPlanId === "enterprise" && (
              <span className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                현재 플랜
              </span>
            )}
            <h3 className="text-lg font-semibold">Enterprise</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              대규모 조직에 적합
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold">문의</span>
            </p>
            <ul className="mt-6 space-y-3">
              <PlanFeature>무제한 모든 것</PlanFeature>
              <PlanFeature>SSO / SAML</PlanFeature>
              <PlanFeature>전담 지원</PlanFeature>
              <PlanFeature>SLA 보장</PlanFeature>
            </ul>
            {currentPlanId === "enterprise" ? (
              <button
                type="button"
                disabled
                className="mt-6 w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
              >
                현재 플랜
              </button>
            ) : (
              <a
                href="mailto:sales@killhouse.io"
                className="mt-6 block w-full rounded-lg border border-border py-2 text-center text-sm font-medium transition-colors hover:bg-accent"
              >
                문의하기
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">결제 내역</h2>
          <a
            href="/subscription/payments"
            className="text-sm font-medium text-primary hover:underline"
          >
            전체 보기 →
          </a>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <h3 className="mb-1 font-medium">결제 내역이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            유료 플랜을 구독하면 여기에 결제 내역이 표시됩니다
          </p>
          <a
            href="/subscription/payments"
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            결제 관리 페이지로 이동
          </a>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <svg
        className="h-4 w-4 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      {children}
    </li>
  );
}
