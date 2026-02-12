"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

interface UsageInfo {
  current: number;
  limit: number;
}

export function NewProjectButton() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const handleClick = async () => {
    setIsChecking(true);

    try {
      const response = await fetch("/api/subscription");
      const data = await response.json();

      if (!response.ok) {
        // 인증 오류 등의 경우 그냥 페이지로 이동 (페이지에서 처리)
        router.push("/projects/new");
        return;
      }

      const { projects } = data.data;

      // 무제한이거나 한도 내인 경우 페이지로 이동
      if (projects.limit === -1 || projects.current < projects.limit) {
        router.push("/projects/new");
        return;
      }

      // 한도 초과인 경우 모달 표시
      setUsage(projects);
      setShowUpgradeModal(true);
    } catch {
      // 오류 발생 시 그냥 페이지로 이동 (페이지에서 처리)
      router.push("/projects/new");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isChecking}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isChecking ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        ) : (
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
        새 프로젝트
      </button>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="project"
        usage={usage || undefined}
      />
    </>
  );
}
