"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AnalysisPipeline } from "@/components/project/analysis-pipeline";
import { CodeDiffViewer } from "@/components/analysis/code-diff-viewer";
import { AnalysisLiveLog } from "@/components/analysis/analysis-live-log";
import { ExploitLiveStream } from "@/components/analysis/exploit-live-stream";
import { useAnalysisPolling } from "@/hooks/use-analysis-polling";

const TERMINAL_STATUSES = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
  "CANCELLED",
];

interface Finding {
  id?: string;
  tool?: string;
  type?: string;
  severity: string;
  title?: string;
  description?: string;
  file_path?: string;
  line?: number;
  url?: string;
  cwe?: string;
  reference?: string;
  // backward compat with old data
  file?: string;
  rule_id?: string;
  rule?: string;
  message?: string;
  template_id?: string;
  name?: string;
}

interface StepResult {
  status: "success" | "failed" | "skipped";
  findings_count?: number;
  error?: string;
}

interface Report {
  tool: string;
  findings: Finding[];
  total: number;
  summary?: string;
  step_result?: StepResult;
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
  infoCount: number;
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  executiveSummary: string | null;
  stepResults: string | null;
  logs?: string | null;
  exploitSessionId: string | null;
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
  EXPLOIT_VERIFICATION: "모의 침투 검증 중",
  COMPLETED: "완료",
  COMPLETED_WITH_ERRORS: "일부 오류와 함께 완료",
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

function hasAnySuccessfulScan(
  sastReport: Report | null,
  dastReport: Report | null
): boolean {
  const sastSuccess = sastReport?.step_result?.status === "success";
  const dastSuccess = dastReport?.step_result?.status === "success";
  // If no step_result info, assume scan ran (backward compat with old data)
  const sastRan = !sastReport?.step_result || sastSuccess;
  const dastRan = !dastReport?.step_result || dastSuccess;
  return (sastReport !== null && sastRan) || (dastReport !== null && dastRan);
}

function normalizeSeverity(severity: string): string {
  return severity
    .toUpperCase()
    .replace("WARNING", "MEDIUM")
    .replace("ERROR", "HIGH");
}

function shortRuleName(fullRule: string): string {
  const segments = fullRule.split(".");
  return segments[segments.length - 1] || fullRule;
}

function findingFilePath(f: Finding): string {
  return f.file_path || f.file || "";
}

function findingRuleName(f: Finding): string {
  return f.title || f.rule_id || f.rule || f.template_id || f.name || "";
}

function findingDescription(f: Finding): string {
  return f.description || f.message || "";
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

function StepStatusBanner({
  label,
  stepResult,
}: {
  label: string;
  stepResult: StepResult;
}) {
  if (stepResult.status === "failed") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-red-500"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span className="text-sm font-medium text-red-600">{label} 실패</span>
        {stepResult.error && (
          <span className="text-xs text-red-500/80">: {stepResult.error}</span>
        )}
      </div>
    );
  }

  if (stepResult.status === "skipped") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-muted-foreground"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span className="text-sm font-medium text-muted-foreground">
          {label} 건너뜀
        </span>
        {stepResult.error && (
          <span className="text-xs text-muted-foreground">
            : {stepResult.error}
          </span>
        )}
      </div>
    );
  }

  return null;
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
    {
      label: "Info",
      count: analysis.infoCount,
      color: "text-gray-600 bg-gray-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
      <div className="mb-3 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-indigo-600"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <h3 className="text-base font-semibold text-indigo-700">요약</h3>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
    </div>
  );
}

function AISummaryCard({
  title,
  summary,
  type,
}: {
  title: string;
  summary: string;
  type: "sast" | "dast";
}) {
  const colors =
    type === "sast"
      ? "border-blue-500/20 bg-blue-500/5 text-blue-700"
      : "border-emerald-500/20 bg-emerald-500/5 text-emerald-700";
  const iconColor = type === "sast" ? "text-blue-600" : "text-emerald-600";

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <div className="mb-2 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 ${iconColor}`}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
    </div>
  );
}

function parseStepResults(
  raw: string | null
): Record<string, StepResult> | null {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

interface ExploitSessionData {
  session_id: string;
  status: string;
  total_vulnerabilities: number;
  exploited_count: number;
  failed_count: number;
  current_iteration: number;
}

const EXPLOIT_TERMINAL_STATUSES = ["success", "failed", "stopped", "error"];

function ExploitSessionProgress({
  exploitSessionId,
}: {
  exploitSessionId: string;
}) {
  const [session, setSession] = useState<ExploitSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const exploitAgentUrl = process.env.NEXT_PUBLIC_EXPLOIT_AGENT_URL || "";
        if (!exploitAgentUrl) return;

        const response = await fetch(
          `${exploitAgentUrl}/api/sessions/${exploitSessionId}`
        );
        if (!response.ok) {
          setError("모의 침투 세션을 불러올 수 없습니다");
          return;
        }
        const data = await response.json();
        setSession(data);

        if (EXPLOIT_TERMINAL_STATUSES.includes(data.status)) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Retry on next interval
      }
    };

    fetchSession();
    intervalRef.current = setInterval(fetchSession, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [exploitSessionId]);

  if (error) {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-sm text-yellow-600">{error}</p>
      </div>
    );
  }

  if (!session) return null;

  const statusLabelsExploit: Record<string, string> = {
    pending: "대기 중",
    running: "실행 중",
    success: "성공",
    failed: "실패",
    stopped: "중지됨",
    error: "오류",
  };

  const isRunning =
    session.status === "running" || session.status === "pending";
  const total = session.total_vulnerabilities;
  const done = session.exploited_count + session.failed_count;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-red-500"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h3 className="text-base font-semibold">모의 침투 테스트</h3>
          {isRunning && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 animate-spin text-muted-foreground"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            session.status === "success"
              ? "bg-red-500/10 text-red-600"
              : session.status === "failed"
                ? "bg-gray-500/10 text-gray-600"
                : session.status === "running"
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-yellow-500/10 text-yellow-600"
          }`}
        >
          {statusLabelsExploit[session.status] || session.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {done}/{total} 취약점 검증 완료
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Result summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-lg font-bold text-red-600">
            {session.exploited_count}
          </p>
          <p className="text-xs text-muted-foreground">성공</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-lg font-bold text-gray-600">
            {session.failed_count}
          </p>
          <p className="text-xs text-muted-foreground">실패</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-lg font-bold text-muted-foreground">
            {total - done}
          </p>
          <p className="text-xs text-muted-foreground">대기</p>
        </div>
      </div>
    </div>
  );
}

interface FixSuggestion {
  explanation: string;
  suggestion: string;
  exampleCode: string;
}

interface CodeFixResult {
  originalCode: string;
  fixedCode: string;
  unifiedDiff: string;
  explanation: string;
  filePath: string;
  startLine: number;
}

type FixCacheValue = CodeFixResult | FixSuggestion;

function findingCacheKey(f: Finding): string {
  const path = f.file_path || f.file || f.url || "";
  const line = f.line || 0;
  const rule = f.title || f.rule_id || f.template_id || "";
  return `${path}:${line}:${rule}`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function FindingDetailModal({
  finding,
  analysisId,
  onClose,
  cachedResult,
  onCacheResult,
}: {
  finding: Finding;
  analysisId?: string;
  onClose: () => void;
  cachedResult?: FixCacheValue | null;
  onCacheResult?: (result: FixCacheValue) => void;
}) {
  const [fixSuggestion, setFixSuggestion] = useState<FixSuggestion | null>(
    () =>
      cachedResult && "suggestion" in cachedResult
        ? (cachedResult as FixSuggestion)
        : null
  );
  const [codeFixResult, setCodeFixResult] = useState<CodeFixResult | null>(
    () =>
      cachedResult && "unifiedDiff" in cachedResult
        ? (cachedResult as CodeFixResult)
        : null
  );
  const [isLoadingFix, setIsLoadingFix] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  // AI Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const filePath = findingFilePath(finding);
  const ruleName = findingRuleName(finding);
  const desc = findingDescription(finding);
  const isSastFinding = !!filePath;

  const handleGetFixSuggestion = async () => {
    setIsLoadingFix(true);
    setFixError(null);
    try {
      if (isSastFinding && analysisId) {
        // SAST: use code-fix API for diff view
        const response = await fetch("/api/analyses/code-fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId, finding }),
        });
        if (!response.ok) {
          throw new Error("코드 수정 제안을 가져오는데 실패했습니다");
        }
        const data = await response.json();
        if (data.success) {
          setCodeFixResult(data.data);
          onCacheResult?.(data.data);
        } else {
          throw new Error(data.error || "알 수 없는 오류");
        }
      } else {
        // DAST: use text-based fix-suggestion API
        const response = await fetch("/api/analyses/fix-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finding),
        });
        if (!response.ok) {
          throw new Error("AI 수정 제안을 가져오는데 실패했습니다");
        }
        const data = await response.json();
        if (data.success) {
          setFixSuggestion(data.data);
          onCacheResult?.(data.data);
        } else {
          throw new Error(data.error || "알 수 없는 오류");
        }
      }
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsLoadingFix(false);
    }
  };

  const handleAskAI = async (question: string) => {
    if (!question.trim()) return;
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const response = await fetch("/api/analyses/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding, question }),
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.data.answer },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "오류가 발생했습니다. 다시 시도해주세요.",
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 발생했습니다." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const presetQuestions = [
    "이 취약점의 영향도를 분석해주세요",
    "공격 시나리오를 설명해주세요",
    "개선 코드를 제안해주세요",
  ];

  const hasResult = fixSuggestion || codeFixResult;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`mx-4 max-h-[85vh] w-full overflow-y-auto rounded-xl bg-card p-6 ${
          codeFixResult ? "max-w-4xl" : "max-w-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={finding.severity} />
            <h3 className="text-lg font-semibold">취약점 상세</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent"
            aria-label="닫기"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Metadata */}
        <div className="mb-4 space-y-2">
          {ruleName && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">규칙: </span>
              <span className="font-mono">{ruleName}</span>
            </div>
          )}
          {filePath && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">파일: </span>
              <span className="font-mono">
                {filePath}
                {finding.line ? `:${finding.line}` : ""}
              </span>
            </div>
          )}
          {finding.url && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">URL: </span>
              <span className="font-mono">{finding.url}</span>
            </div>
          )}
          {finding.cwe && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">CWE: </span>
              <span>{finding.cwe}</span>
            </div>
          )}
          {finding.reference && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">
                참고 자료:{" "}
              </span>
              <a
                href={finding.reference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-600"
              >
                {finding.reference}
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        {desc && (
          <div className="mb-4">
            <h4 className="mb-1 text-sm font-medium text-muted-foreground">
              설명
            </h4>
            <p className="whitespace-pre-wrap text-sm">{desc}</p>
          </div>
        )}

        <hr className="my-4 border-border" />

        {/* AI Fix Suggestion Button */}
        {!hasResult && !isLoadingFix && !fixError && (
          <button
            onClick={handleGetFixSuggestion}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            {isSastFinding && analysisId
              ? "코드 수정 제안 보기"
              : "AI 수정 제안 받기"}
          </button>
        )}

        {isLoadingFix && (
          <div className="flex items-center justify-center gap-2 py-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 animate-spin text-muted-foreground"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-sm text-muted-foreground">
              {isSastFinding
                ? "소스코드를 분석하고 수정 코드를 생성하고 있습니다..."
                : "AI 수정 제안을 생성하고 있습니다..."}
            </span>
          </div>
        )}

        {fixError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-sm text-red-600">{fixError}</p>
            <button
              onClick={handleGetFixSuggestion}
              className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* SAST: Code Diff View */}
        {codeFixResult && (
          <CodeDiffViewer
            originalCode={codeFixResult.originalCode}
            fixedCode={codeFixResult.fixedCode}
            filePath={codeFixResult.filePath}
            startLine={codeFixResult.startLine}
            explanation={codeFixResult.explanation}
          />
        )}

        {/* DAST: Text Suggestion View */}
        {fixSuggestion && (
          <div className="space-y-3">
            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                문제 설명
              </h4>
              <p className="text-sm">{fixSuggestion.explanation}</p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                수정 제안
              </h4>
              <p className="text-sm">{fixSuggestion.suggestion}</p>
            </div>
            {fixSuggestion.exampleCode && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                  예시 코드
                </h4>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                  <code>{fixSuggestion.exampleCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* AI Chat Section */}
        <div className="mt-4 border-t border-border pt-4">
          {!showChat ? (
            <button
              onClick={() => setShowChat(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              AI에게 질문하기
            </button>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">AI 질의</h4>

              {/* Preset questions */}
              {chatMessages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAskAI(q)}
                      disabled={isChatLoading}
                      className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.length > 0 && (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "ml-8 bg-primary/10"
                          : "mr-8 bg-muted"
                      }`}
                    >
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {msg.role === "user" ? "질문" : "AI 응답"}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="mr-8 rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 animate-spin text-muted-foreground"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span className="text-xs text-muted-foreground">
                          응답 생성 중...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskAI(chatInput);
                    }
                  }}
                  placeholder="취약점에 대해 질문하세요..."
                  disabled={isChatLoading}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                />
                <button
                  onClick={() => handleAskAI(chatInput)}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  전송
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function FindingsTable({
  title,
  report,
  analysisId,
}: {
  title: string;
  report: Report;
  analysisId?: string;
}) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const fixCacheRef = useRef<Map<string, FixCacheValue>>(new Map());

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
            {report.findings.map((finding, idx) => {
              const filePath = findingFilePath(finding);
              const ruleName = findingRuleName(finding);
              const desc = findingDescription(finding);

              return (
                <tr
                  key={finding.id || idx}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedFinding(finding)}
                >
                  <td className="px-4 py-3">
                    <SeverityBadge severity={finding.severity} />
                  </td>
                  {isSast ? (
                    <>
                      <td
                        className="max-w-[200px] truncate px-4 py-3 font-mono text-xs"
                        title={filePath}
                      >
                        {filePath || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {finding.line || "-"}
                      </td>
                      <td
                        className="max-w-[150px] truncate px-4 py-3 text-xs"
                        title={ruleName}
                      >
                        {ruleName ? shortRuleName(ruleName) : "-"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs">
                        {finding.url || "-"}
                      </td>
                      <td
                        className="max-w-[150px] truncate px-4 py-3 text-xs"
                        title={ruleName}
                      >
                        {ruleName ? shortRuleName(ruleName) : "-"}
                      </td>
                    </>
                  )}
                  <td className="max-w-[300px] px-4 py-3 text-xs text-muted-foreground">
                    <span className="line-clamp-2">{desc || "-"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          analysisId={analysisId}
          onClose={() => setSelectedFinding(null)}
          cachedResult={fixCacheRef.current.get(
            findingCacheKey(selectedFinding)
          )}
          onCacheResult={(result) => {
            fixCacheRef.current.set(findingCacheKey(selectedFinding), result);
          }}
        />
      )}
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
  const stepResults = useMemo(
    () => parseStepResults(analysis.stepResults),
    [analysis.stepResults]
  );
  const polledSastReport = useMemo(
    () => parseReport(polledAnalysis?.staticAnalysisReport ?? null),
    [polledAnalysis?.staticAnalysisReport]
  );
  const polledDastReport = useMemo(
    () => parseReport(polledAnalysis?.penetrationTestReport ?? null),
    [polledAnalysis?.penetrationTestReport]
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
                    : currentStatus === "COMPLETED_WITH_ERRORS"
                      ? "bg-orange-500/10 text-orange-600"
                      : currentStatus === "FAILED" ||
                          currentStatus === "CANCELLED"
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
        <AnalysisPipeline
          currentStatus={currentStatus}
          stepResults={stepResults ?? undefined}
        />
      </div>

      {/* Live Log */}
      <AnalysisLiveLog
        logs={polledAnalysis?.logs ?? analysis.logs ?? null}
        currentStatus={currentStatus}
      />

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

      {/* Exploit Live Stream during active analysis */}
      {!TERMINAL_STATUSES.includes(currentStatus) &&
        analysis.exploitSessionId && (
          <ExploitLiveStream exploitSessionId={analysis.exploitSessionId} />
        )}

      {/* Intermediate results - show SAST/DAST as they become available during analysis */}
      {!TERMINAL_STATUSES.includes(currentStatus) &&
        (polledSastReport || polledDastReport) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">중간 분석 결과</h2>
            {polledSastReport && (
              <FindingsTable
                title="SAST 분석 결과 (정적 분석)"
                report={polledSastReport}
                analysisId={analysis.id}
              />
            )}
            {polledDastReport && (
              <FindingsTable
                title="DAST 분석 결과 (침투 테스트)"
                report={polledDastReport}
                analysisId={analysis.id}
              />
            )}
          </div>
        )}

      {/* Vulnerability Summary */}
      {(currentStatus === "COMPLETED" ||
        currentStatus === "COMPLETED_WITH_ERRORS") && (
        <>
          {/* Executive Summary */}
          {analysis.executiveSummary && (
            <SummaryCard summary={analysis.executiveSummary} />
          )}

          {/* Step status banners for failed/skipped steps */}
          {sastReport?.step_result &&
            sastReport.step_result.status !== "success" && (
              <StepStatusBanner
                label="SAST 정적 분석"
                stepResult={sastReport.step_result}
              />
            )}
          {dastReport?.step_result &&
            dastReport.step_result.status !== "success" && (
              <StepStatusBanner
                label="DAST 침투 테스트"
                stepResult={dastReport.step_result}
              />
            )}

          {analysis.vulnerabilitiesFound === 0 ? (
            hasAnySuccessfulScan(sastReport, dastReport) ? (
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
                  실행된 스캔에서 취약점이 발견되지 않았습니다.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-2 h-8 w-8 text-yellow-600"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-lg font-semibold text-yellow-600">
                  스캔이 실행되지 않았습니다
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  모든 스캔 단계가 건너뛰어졌거나 실패했습니다. 위 상태를
                  확인하세요.
                </p>
              </div>
            )
          ) : (
            <>
              <VulnerabilitySummaryCards analysis={analysis} />

              {/* AI Summary Cards */}
              {(sastReport?.summary || dastReport?.summary) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {sastReport?.summary && (
                    <AISummaryCard
                      title="SAST 분석 요약"
                      summary={sastReport.summary}
                      type="sast"
                    />
                  )}
                  {dastReport?.summary && (
                    <AISummaryCard
                      title="DAST 분석 요약"
                      summary={dastReport.summary}
                      type="dast"
                    />
                  )}
                </div>
              )}

              {/* SAST Results */}
              {sastReport && (
                <FindingsTable
                  title="SAST 분석 결과 (정적 분석)"
                  report={sastReport}
                  analysisId={analysis.id}
                />
              )}

              {/* DAST Results */}
              {dastReport && (
                <FindingsTable
                  title="DAST 분석 결과 (침투 테스트)"
                  report={dastReport}
                  analysisId={analysis.id}
                />
              )}
            </>
          )}

          {/* Exploit Session Progress */}
          {analysis.exploitSessionId && (
            <>
              <ExploitSessionProgress
                exploitSessionId={analysis.exploitSessionId}
              />
              <ExploitLiveStream exploitSessionId={analysis.exploitSessionId} />
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
