"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

interface UsageInfo {
  current: number;
  limit: number;
}

interface StartAnalysisButtonProps {
  projectId: string;
  onStart?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
}

export function StartAnalysisButton({
  projectId,
  onStart,
  className = "",
  variant = "primary",
  children,
}: StartAnalysisButtonProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setIsChecking(true);
    setError("");

    try {
      // 먼저 구독 정보 확인
      const subscriptionResponse = await fetch("/api/subscription");
      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        setError("구독 정보를 확인할 수 없습니다");
        return;
      }

      const { analysisThisMonth } = subscriptionData.data;

      // 무제한이거나 한도 내인 경우 분석 시작
      if (
        analysisThisMonth.limit === -1 ||
        analysisThisMonth.current < analysisThisMonth.limit
      ) {
        await startAnalysis();
        return;
      }

      // 한도 초과인 경우 모달 표시
      setUsage(analysisThisMonth);
      setShowUpgradeModal(true);
    } catch {
      setError("오류가 발생했습니다");
    } finally {
      setIsChecking(false);
    }
  };

  const startAnalysis = async () => {
    setIsStarting(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: "main" }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "LIMIT_EXCEEDED") {
          setUsage(data.usage);
          setShowUpgradeModal(true);
          return;
        }
        setError(data.error || "분석을 시작할 수 없습니다");
        return;
      }

      // Call onStart callback for backward compatibility
      onStart?.();

      // Navigate to analysis detail page if analysis ID is available
      if (data.success && data.data?.id) {
        router.push(`/projects/${projectId}/analyses/${data.data.id}`);
      }
    } catch {
      setError("오류가 발생했습니다");
    } finally {
      setIsStarting(false);
    }
  };

  const isLoading = isChecking || isStarting;

  const baseClassName =
    variant === "primary"
      ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      : "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseClassName} ${className}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {isChecking ? "확인 중..." : "시작 중..."}
          </div>
        ) : (
          children || (
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              분석 시작
            </div>
          )
        )}
      </button>

      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="analysis"
        usage={usage || undefined}
      />
    </>
  );
}
