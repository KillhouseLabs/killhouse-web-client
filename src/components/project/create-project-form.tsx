"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RepositorySelector } from "./repository-selector";

type RepoProvider = "GITHUB" | "GITLAB" | "MANUAL";

export function CreateProjectForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoProvider, setRepoProvider] = useState<RepoProvider>("GITHUB");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("프로젝트 이름을 입력하세요");
      return;
    }

    if (repoProvider !== "MANUAL" && !repoUrl.trim()) {
      setError("저장소 URL을 입력하세요");
      return;
    }

    // Validate URL format
    if (repoUrl.trim()) {
      const urlPattern =
        /^https:\/\/(github\.com|gitlab\.com)\/[\w-]+\/[\w.-]+\/?$/;
      if (!urlPattern.test(repoUrl.trim())) {
        setError("올바른 GitHub 또는 GitLab 저장소 URL을 입력하세요");
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          repoProvider,
          repoUrl: repoUrl.trim() || undefined,
          defaultBranch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "프로젝트 생성에 실패했습니다");
        return;
      }

      router.push(`/projects/${data.data.id}`);
      router.refresh();
    } catch {
      setError("프로젝트 생성 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          프로젝트 이름 <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Security Project"
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          설명
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          저장소 연결 <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              if (repoProvider !== "GITHUB") {
                setRepoProvider("GITHUB");
                setRepoUrl("");
                setRepoOwner("");
                setRepoName("");
                setDefaultBranch("main");
              }
            }}
            disabled={isLoading}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              repoProvider === "GITHUB"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`h-8 w-8 ${repoProvider === "GITHUB" ? "text-primary" : "text-muted-foreground"}`}
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-sm font-medium">GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (repoProvider !== "GITLAB") {
                setRepoProvider("GITLAB");
                setRepoUrl("");
                setRepoOwner("");
                setRepoName("");
                setDefaultBranch("main");
              }
            }}
            disabled={isLoading}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              repoProvider === "GITLAB"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`h-8 w-8 ${repoProvider === "GITLAB" ? "text-primary" : "text-muted-foreground"}`}
            >
              <path d="M4.845.904c-.435 0-.82.28-.955.692C2.639 5.449 1.246 9.728.07 13.335a1.437 1.437 0 00.522 1.607l11.071 8.045a.5.5 0 00.59 0l11.07-8.045a1.436 1.436 0 00.522-1.607c-1.176-3.607-2.569-7.886-3.82-11.74A1.004 1.004 0 0019.07.904h-2.774a.495.495 0 00-.477.363L12.73 10.63h-1.46L8.181 1.267A.495.495 0 007.704.904zm.07 1.49h1.862l2.84 8.702H6.978z" />
            </svg>
            <span className="text-sm font-medium">GitLab</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (repoProvider !== "MANUAL") {
                setRepoProvider("MANUAL");
                setRepoUrl("");
                setRepoOwner("");
                setRepoName("");
                setDefaultBranch("main");
              }
            }}
            disabled={isLoading}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              repoProvider === "MANUAL"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-8 w-8 ${repoProvider === "MANUAL" ? "text-primary" : "text-muted-foreground"}`}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span className="text-sm font-medium">수동 업로드</span>
          </button>
        </div>
      </div>

      {repoProvider === "GITHUB" && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            저장소 선택 <span className="text-destructive">*</span>
          </label>
          {repoUrl ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="font-medium">
                    {repoOwner}/{repoName}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {defaultBranch}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                disabled={isLoading}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
              >
                변경
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSelectorOpen(true)}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              저장소 검색 및 선택
            </button>
          )}
        </div>
      )}

      {repoProvider === "GITLAB" && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            저장소 선택 <span className="text-destructive">*</span>
          </label>
          {repoUrl ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <path d="M4.845.904c-.435 0-.82.28-.955.692C2.639 5.449 1.246 9.728.07 13.335a1.437 1.437 0 00.522 1.607l11.071 8.045a.5.5 0 00.59 0l11.07-8.045a1.436 1.436 0 00.522-1.607c-1.176-3.607-2.569-7.886-3.82-11.74A1.004 1.004 0 0019.07.904h-2.774a.495.495 0 00-.477.363L12.73 10.63h-1.46L8.181 1.267A.495.495 0 007.704.904zm.07 1.49h1.862l2.84 8.702H6.978z" />
                  </svg>
                  <span className="font-medium">
                    {repoOwner}/{repoName}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {defaultBranch}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                disabled={isLoading}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
              >
                변경
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSelectorOpen(true)}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              저장소 검색 및 선택
            </button>
          )}
        </div>
      )}

      {repoProvider === "MANUAL" && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto h-10 w-10 text-muted-foreground"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <p className="mt-3 text-sm text-muted-foreground">
            프로젝트 생성 후 코드를 직접 업로드할 수 있습니다
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ZIP 파일 또는 개별 파일 업로드 지원 (최대 100MB)
          </p>
        </div>
      )}

      {/* Analysis Flow Info */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="mb-3 text-sm font-medium">분석 프로세스</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>
            <span className="text-muted-foreground">
              저장소 클론 및 코드 검색
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </span>
            <span className="text-muted-foreground">정적 코드 분석 (SAST)</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </span>
            <span className="text-muted-foreground">
              샌드박스 컨테이너 빌드 및 실행
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              4
            </span>
            <span className="text-muted-foreground">모의 침투 테스트 수행</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              5
            </span>
            <span className="text-muted-foreground">취약점 리포트 생성</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "생성 중..." : "프로젝트 생성"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
      </div>

      <RepositorySelector
        isOpen={isSelectorOpen}
        provider={repoProvider === "GITHUB" ? "github" : "gitlab"}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={(repo) => {
          setRepoUrl(repo.url);
          setRepoOwner(repo.owner);
          setRepoName(repo.name);
          setDefaultBranch(repo.defaultBranch);
        }}
      />
    </form>
  );
}
