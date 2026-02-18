"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { RepositoryList, Repository } from "./repository-list";
import { AddRepositoryModal } from "./add-repository-modal";
import { StartAnalysisButton } from "./start-analysis-button";
import { AnalysisPipeline } from "./analysis-pipeline";
import { useAnalysisPolling } from "@/hooks/use-analysis-polling";

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
  startedAt: Date;
  completedAt: Date | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  // Legacy fields (for backward compatibility, optional)
  repoProvider?: string | null;
  repoUrl?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  defaultBranch?: string;
  // New multi-repo fields
  repositories?: Repository[];
  createdAt: Date;
  updatedAt: Date;
  analyses: Analysis[];
  _count: {
    analyses: number;
  };
}

interface ProjectDetailProps {
  project: Project;
}

const TERMINAL_STATUSES_SET = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
  "CANCELLED",
];

const statusLabels: Record<string, string> = {
  PENDING: "대기 중",
  CLONING: "저장소 클론 중",
  STATIC_ANALYSIS: "정적 분석 중",
  BUILDING: "빌드 중",
  PENETRATION_TEST: "침투 테스트 중",
  COMPLETED: "완료",
  COMPLETED_WITH_ERRORS: "부분 완료",
  FAILED: "실패",
  CANCELLED: "취소됨",
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);

  // Find the latest non-terminal analysis for polling
  const activeAnalysis = useMemo(
    () =>
      project.analyses.find((a) => !TERMINAL_STATUSES_SET.includes(a.status)),
    [project.analyses]
  );

  const { analysis: polledAnalysis, isTerminal } = useAnalysisPolling(
    project.id,
    activeAnalysis?.id ?? null,
    !!activeAnalysis
  );

  // Refresh the page data when polling detects a terminal status
  useEffect(() => {
    if (isTerminal) {
      router.refresh();
    }
  }, [isTerminal, router]);

  // Determine the latest analysis status to show in the pipeline
  const latestAnalysis = project.analyses[0]; // most recent by startedAt desc
  const pipelineStatus =
    polledAnalysis?.status ?? latestAnalysis?.status ?? "PENDING";

  // Helper to check if project uses new multi-repo structure
  const hasRepositories =
    project.repositories && project.repositories.length > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/projects");
        router.refresh();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getProviderIcon = () => {
    if (project.repoProvider === "GITHUB") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      );
    }
    if (project.repoProvider === "GITLAB") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M4.845.904c-.435 0-.82.28-.955.692C2.639 5.449 1.246 9.728.07 13.335a1.437 1.437 0 00.522 1.607l11.071 8.045a.5.5 0 00.59 0l11.07-8.045a1.436 1.436 0 00.522-1.607c-1.176-3.607-2.569-7.886-3.82-11.74A1.004 1.004 0 0019.07.904h-2.774a.495.495 0 00-.477.363L12.73 10.63h-1.46L8.181 1.267A.495.495 0 007.704.904zm.07 1.49h1.862l2.84 8.702H6.978z" />
        </svg>
      );
    }
    return (
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
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
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  project.status === "ACTIVE"
                    ? "bg-green-500/10 text-green-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {project.status === "ACTIVE" ? "활성" : "보관됨"}
              </span>
            </div>
            {project.description && (
              <p className="mt-1 text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            삭제
          </button>
          <StartAnalysisButton
            projectId={project.id}
            onStart={() => router.refresh()}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-card p-6">
            <h3 className="text-lg font-semibold">프로젝트 삭제</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              정말로 &ldquo;{project.name}&rdquo; 프로젝트를 삭제하시겠습니까?
              모든 분석 결과도 함께 삭제됩니다.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repository Info - Multi-repo or Legacy */}
      {hasRepositories ? (
        <>
          <RepositoryList
            projectId={project.id}
            repositories={project.repositories!}
            onUpdate={() => router.refresh()}
            onAdd={() => setShowAddRepoModal(true)}
          />
          <AddRepositoryModal
            isOpen={showAddRepoModal}
            onClose={() => setShowAddRepoModal(false)}
            projectId={project.id}
            onSuccess={() => router.refresh()}
          />
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">저장소 정보</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              {getProviderIcon()}
            </div>
            <div className="flex-1">
              {project.repoUrl ? (
                <>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {project.repoOwner}/{project.repoName}
                  </a>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                      >
                        <line x1="6" x2="6" y1="3" y2="15" />
                        <circle cx="18" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M18 9a9 9 0 0 1-9 9" />
                      </svg>
                      {project.defaultBranch}
                    </span>
                    <span>{project.repoProvider}</span>
                  </div>
                </>
              ) : (
                <div>
                  <p className="font-medium">수동 업로드</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    코드 파일을 직접 업로드하여 분석합니다
                  </p>
                </div>
              )}
            </div>
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                저장소 열기
              </a>
            )}
          </div>
        </div>
      )}

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            총 분석 횟수
          </div>
          <p className="mt-2 text-lg font-semibold">
            {project._count.analyses}회
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            발견된 취약점
          </div>
          <p className="mt-2 text-lg font-semibold">
            {project.analyses.find(
              (a) =>
                a.status === "COMPLETED" || a.status === "COMPLETED_WITH_ERRORS"
            )?.vulnerabilitiesFound ?? 0}
            개
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            생성일
          </div>
          <p className="mt-2 text-lg font-semibold">
            {formatDistanceToNow(project.createdAt, {
              addSuffix: true,
              locale: ko,
            })}
          </p>
        </div>
      </div>

      {/* Analysis Pipeline */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">분석 프로세스</h2>
        <AnalysisPipeline currentStatus={pipelineStatus} />
      </div>

      {/* Recent Analyses */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">최근 분석</h2>
        </div>

        {project.analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h3 className="mb-1 font-medium">분석 기록이 없습니다</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              분석을 시작하여 취약점을 찾아보세요
            </p>
            <StartAnalysisButton
              projectId={project.id}
              onStart={() => router.refresh()}
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
              />
              첫 분석 시작하기
            </StartAnalysisButton>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {project.analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      analysis.status === "COMPLETED"
                        ? "bg-green-500/10 text-green-600"
                        : analysis.status === "COMPLETED_WITH_ERRORS"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : analysis.status === "FAILED" ||
                              analysis.status === "CANCELLED"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-yellow-500/10 text-yellow-600"
                    }`}
                  >
                    {analysis.status === "COMPLETED" ||
                    analysis.status === "COMPLETED_WITH_ERRORS" ? (
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : analysis.status === "FAILED" ||
                      analysis.status === "CANCELLED" ? (
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
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 animate-spin"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {statusLabels[analysis.status] || analysis.status}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(analysis.startedAt, {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      <span>|</span>
                      <span>{analysis.branch}</span>
                      {analysis.commitHash && (
                        <>
                          <span>|</span>
                          <span>{analysis.commitHash.slice(0, 7)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {(analysis.status === "COMPLETED" ||
                    analysis.status === "COMPLETED_WITH_ERRORS") && (
                    <div className="flex items-center gap-2 text-xs">
                      {analysis.criticalCount > 0 && (
                        <span className="rounded bg-red-500/10 px-2 py-1 text-red-600">
                          Critical: {analysis.criticalCount}
                        </span>
                      )}
                      {analysis.highCount > 0 && (
                        <span className="rounded bg-orange-500/10 px-2 py-1 text-orange-600">
                          High: {analysis.highCount}
                        </span>
                      )}
                      {analysis.mediumCount > 0 && (
                        <span className="rounded bg-yellow-500/10 px-2 py-1 text-yellow-600">
                          Medium: {analysis.mediumCount}
                        </span>
                      )}
                      {analysis.lowCount > 0 && (
                        <span className="rounded bg-blue-500/10 px-2 py-1 text-blue-600">
                          Low: {analysis.lowCount}
                        </span>
                      )}
                    </div>
                  )}
                  <Link
                    href={`/projects/${project.id}/analyses/${analysis.id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                  >
                    상세 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
