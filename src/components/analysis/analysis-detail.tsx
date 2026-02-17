"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AnalysisPipeline } from "@/components/project/analysis-pipeline";
import { useAnalysisPolling } from "@/hooks/use-analysis-polling";

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];

interface Finding {
  id?: string;
  severity: string;
  file?: string;
  line?: number;
  rule_id?: string;
  rule?: string;
  message?: string;
  description?: string;
  url?: string;
  template_id?: string;
  name?: string;
}

interface Report {
  tool: string;
  findings: Finding[];
  total: number;
  summary?: string;
}

interface Analysis {
  id: string;
  status: string;
  branch: string;
  commitHash: string | null;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  startedAt: Date;
  completedAt: Date | null;
  repository?: { id: string; name: string; provider: string } | null;
}

interface AnalysisDetailProps {
  analysis: Analysis;
  projectId: string;
  projectName: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "대기 중",
  CLONING: "저장소 클론 중",
  SCANNING: "스캔 중",
  STATIC_ANALYSIS: "정적 분석 중",
  BUILDING: "빌드 중",
  PENETRATION_TEST: "침투 테스트 중",
  COMPLETED: "완료",
  FAILED: "실패",
  CANCELLED: "취소됨",
};

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-600 border-red-500/20",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  LOW: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  INFO: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

function parseReport(raw: string | null): Report | null {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function normalizeSeverity(severity: string): string {
  return severity
    .toUpperCase()
    .replace("WARNING", "MEDIUM")
    .replace("ERROR", "HIGH");
}

function SeverityBadge({ severity }: { severity: string }) {
  const normalized = normalizeSeverity(severity);
  const colors = severityColors[normalized] || severityColors.INFO;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {normalized}
    </span>
  );
}

function VulnerabilitySummaryCards({ analysis }: { analysis: Analysis }) {
  const cards = [
    {
      label: "Critical",
      count: analysis.criticalCount,
      color: "text-red-600 bg-red-500/10",
    },
    {
      label: "High",
      count: analysis.highCount,
      color: "text-orange-600 bg-orange-500/10",
    },
    {
      label: "Medium",
      count: analysis.mediumCount,
      color: "text-yellow-600 bg-yellow-500/10",
    },
    {
      label: "Low",
      count: analysis.lowCount,
      color: "text-blue-600 bg-blue-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold ${card.color.split(" ")[0]}`}>
            {card.count}
          </p>
        </div>
      ))}
    </div>
  );
}

function FindingsTable({ title, report }: { title: string; report: Report }) {
  if (!report.findings || report.findings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          발견된 취약점이 없습니다.
        </p>
      </div>
    );
  }

  const isSast = report.tool === "semgrep";

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="text-base font-semibold">
          {title} ({report.total}개)
        </h3>
        {report.summary && (
          <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">심각도</th>
              {isSast ? (
                <>
                  <th className="px-4 py-3 font-medium">파일</th>
                  <th className="px-4 py-3 font-medium">라인</th>
                  <th className="px-4 py-3 font-medium">규칙</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">템플릿</th>
                </>
              )}
              <th className="px-4 py-3 font-medium">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {report.findings.map((finding, idx) => (
              <tr key={finding.id || idx} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <SeverityBadge severity={finding.severity} />
                </td>
                {isSast ? (
                  <>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs">
                      {finding.file || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {finding.line || "-"}
                    </td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-xs">
                      {finding.rule_id || finding.rule || "-"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs">
                      {finding.url || "-"}
                    </td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-xs">
                      {finding.template_id || finding.name || "-"}
                    </td>
                  </>
                )}
                <td className="max-w-[300px] truncate px-4 py-3 text-xs text-muted-foreground">
                  {finding.message || finding.description || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnalysisDetail({
  analysis,
  projectId,
  projectName,
}: AnalysisDetailProps) {
  const router = useRouter();
  const isActive = !TERMINAL_STATUSES.includes(analysis.status);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);

  const { analysis: polledAnalysis, isTerminal } = useAnalysisPolling(
    projectId,
    analysis.id,
    isActive
  );

  useEffect(() => {
    if (isTerminal) {
      router.refresh();
    }
  }, [isTerminal, router]);

  const currentStatus = polledAnalysis?.status ?? analysis.status;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/analyses/${analysis.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Cancel failed:", error);
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const handleRerun = async () => {
    setIsRerunning(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: analysis.repository?.id,
          branch: analysis.branch,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.id) {
          router.push(`/projects/${projectId}/analyses/${data.data.id}`);
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Rerun failed:", error);
    } finally {
      setIsRerunning(false);
    }
  };
  const sastReport = useMemo(
    () => parseReport(analysis.staticAnalysisReport),
    [analysis.staticAnalysisReport]
  );
  const dastReport = useMemo(
    () => parseReport(analysis.penetrationTestReport),
    [analysis.penetrationTestReport]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">분석 결과</h1>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  currentStatus === "COMPLETED"
                    ? "bg-green-500/10 text-green-600"
                    : currentStatus === "FAILED"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-yellow-500/10 text-yellow-600"
                }`}
              >
                {statusLabels[currentStatus] || currentStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {projectName} · {analysis.branch}
              {analysis.commitHash && ` · ${analysis.commitHash.slice(0, 7)}`}
              {" · "}
              {formatDistanceToNow(analysis.startedAt, {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!TERMINAL_STATUSES.includes(currentStatus) && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              취소
            </button>
          )}
          {TERMINAL_STATUSES.includes(currentStatus) && (
            <button
              onClick={handleRerun}
              disabled={isRerunning}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isRerunning ? "재실행 중..." : "재실행"}
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-card p-6">
            <h3 className="text-lg font-semibold">분석 취소</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              진행 중인 분석을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isCancelling ? "취소 중..." : "분석 취소"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">분석 진행 상태</h2>
        <AnalysisPipeline currentStatus={currentStatus} />
      </div>

      {/* In-progress message */}
      {!TERMINAL_STATUSES.includes(currentStatus) && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 animate-spin text-blue-500"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-blue-600">
            분석이 진행 중입니다. 완료되면 자동으로 업데이트됩니다.
          </p>
        </div>
      )}

      {/* Vulnerability Summary */}
      {currentStatus === "COMPLETED" && (
        <>
          {analysis.vulnerabilitiesFound === 0 ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2 h-8 w-8 text-green-600"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-lg font-semibold text-green-600">
                취약점이 발견되지 않았습니다
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                안전한 코드베이스입니다.
              </p>
            </div>
          ) : (
            <>
              <VulnerabilitySummaryCards analysis={analysis} />

              {/* SAST Results */}
              {sastReport && (
                <FindingsTable
                  title="SAST 분석 결과 (정적 분석)"
                  report={sastReport}
                />
              )}

              {/* DAST Results */}
              {dastReport && (
                <FindingsTable
                  title="DAST 분석 결과 (침투 테스트)"
                  report={dastReport}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Failed message */}
      {currentStatus === "FAILED" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-2 h-8 w-8 text-red-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-lg font-semibold text-red-600">
            분석에 실패했습니다
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
