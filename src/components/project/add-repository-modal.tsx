"use client";

import { useState } from "react";

type Provider = "GITHUB" | "GITLAB" | "MANUAL";

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

export function AddRepositoryModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: AddRepositoryModalProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setProvider(null);
    setName("");
    setUrl("");
    setDefaultBranch("main");
    setRole("");
    setIsPrimary(false);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!provider || !name) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/repositories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name,
          url: url || undefined,
          defaultBranch,
          role: role || undefined,
          isPrimary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "저장소 추가에 실패했습니다");
        return;
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch {
      setError("저장소 추가 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-xl bg-card p-6">
        <h2 className="text-xl font-semibold">저장소 추가</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          프로젝트에 분석할 저장소를 추가하세요
        </p>

        {/* Provider Selection */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium">저장소 타입</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setProvider("GITHUB")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                provider === "GITHUB"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("GITLAB")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                provider === "GITLAB"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M4.845.904c-.435 0-.82.28-.955.692C2.639 5.449 1.246 9.728.07 13.335a1.437 1.437 0 00.522 1.607l11.071 8.045a.5.5 0 00.59 0l11.07-8.045a1.436 1.436 0 00.522-1.607c-1.176-3.607-2.569-7.886-3.82-11.74A1.004 1.004 0 0019.07.904h-2.774a.495.495 0 00-.477.363L12.73 10.63h-1.46L8.181 1.267A.495.495 0 007.704.904zm.07 1.49h1.862l2.84 8.702H6.978z" />
              </svg>
              <span className="text-sm font-medium">GitLab</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("MANUAL")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                provider === "MANUAL"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
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
                className="h-6 w-6"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              <span className="text-sm font-medium">수동 업로드</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        {provider && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="repo-name" className="mb-1 block text-sm font-medium">
                저장소 이름 *
              </label>
              <input
                id="repo-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: my-frontend-app"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {provider !== "MANUAL" && (
              <div>
                <label htmlFor="repo-url" className="mb-1 block text-sm font-medium">
                  저장소 URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={`https://${provider === "GITHUB" ? "github.com" : "gitlab.com"}/owner/repo`}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="default-branch" className="mb-1 block text-sm font-medium">
                기본 브랜치
              </label>
              <input
                id="default-branch"
                type="text"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                placeholder="main"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="repo-role" className="mb-1 block text-sm font-medium">
                역할 (선택)
              </label>
              <input
                id="repo-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="예: frontend, backend, shared"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is-primary"
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-border"
                aria-label="Primary 저장소로 설정"
              />
              <label htmlFor="is-primary" className="text-sm">
                Primary 저장소로 설정
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!provider || !name || isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "추가 중..." : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
