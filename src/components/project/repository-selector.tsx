"use client";

import { useState, useEffect, useCallback } from "react";
import { navigateTo } from "@/lib/navigation";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
  language?: string | null;
  description: string | null;
}

interface Branch {
  name: string;
  protected: boolean;
}

type Provider = "github" | "gitlab";

interface RepositorySelectorProps {
  isOpen: boolean;
  provider: Provider;
  onClose: () => void;
  onSelect: (repo: {
    url: string;
    owner: string;
    name: string;
    defaultBranch: string;
  }) => void;
}

type Step = "repositories" | "branches";

const PROVIDER_CONFIG = {
  github: {
    name: "GitHub",
    icon: (
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    ),
    notConnectedCode: "GITHUB_NOT_CONNECTED",
    tokenExpiredCode: "GITHUB_TOKEN_EXPIRED",
  },
  gitlab: {
    name: "GitLab",
    icon: (
      <path d="M4.845.904c-.435 0-.82.28-.955.692C2.639 5.449 1.246 9.728.07 13.335a1.437 1.437 0 00.522 1.607l11.071 8.045a.5.5 0 00.59 0l11.07-8.045a1.436 1.436 0 00.522-1.607c-1.176-3.607-2.569-7.886-3.82-11.74A1.004 1.004 0 0019.07.904h-2.774a.495.495 0 00-.477.363L12.73 10.63h-1.46L8.181 1.267A.495.495 0 007.704.904zm.07 1.49h1.862l2.84 8.702H6.978z" />
    ),
    notConnectedCode: "GITLAB_NOT_CONNECTED",
    tokenExpiredCode: "GITLAB_TOKEN_EXPIRED",
  },
};

export function RepositorySelector({
  isOpen,
  provider,
  onClose,
  onSelect,
}: RepositorySelectorProps) {
  const config = PROVIDER_CONFIG[provider];

  const [step, setStep] = useState<Step>("repositories");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const fetchRepositories = useCallback(
    async (pageNum: number, searchQuery: string = "") => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          per_page: "20",
        });
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        const response = await fetch(`/api/${provider}/repositories?${params}`);
        const data = await response.json();

        if (!data.success) {
          if (data.code === config.notConnectedCode) {
            setIsConnected(false);
            return;
          }
          if (data.code === config.tokenExpiredCode) {
            setIsConnected(false);
            setError(
              `${config.name} 토큰이 만료되었습니다. 다시 연동해주세요.`
            );
            return;
          }
          throw new Error(data.error);
        }

        setIsConnected(true);
        if (pageNum === 1) {
          setRepositories(data.data.repositories);
        } else {
          setRepositories((prev) => [...prev, ...data.data.repositories]);
        }
        setHasNext(data.data.pagination.has_next);
        setPage(pageNum);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "저장소를 불러올 수 없습니다"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [provider, config.notConnectedCode, config.tokenExpiredCode, config.name]
  );

  const fetchBranches = useCallback(
    async (repo: Repository) => {
      setIsLoading(true);
      setError("");
      try {
        let url: string;
        if (provider === "github") {
          const [owner, name] = repo.full_name.split("/");
          url = `/api/github/repositories/${owner}/${name}/branches`;
        } else {
          url = `/api/gitlab/repositories/${repo.id}/branches`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        setBranches(data.data.branches);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "브랜치를 불러올 수 없습니다"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [provider]
  );

  useEffect(() => {
    if (isOpen) {
      fetchRepositories(1);
    }
  }, [isOpen, fetchRepositories]);

  useEffect(() => {
    if (!isOpen) {
      setStep("repositories");
      setRepositories([]);
      setBranches([]);
      setSelectedRepo(null);
      setSearch("");
      setError("");
      setPage(1);
      setIsConnected(null);
    }
  }, [isOpen]);

  const handleSearch = () => {
    fetchRepositories(1, search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLoadMore = () => {
    fetchRepositories(page + 1, search);
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    fetchBranches(repo);
    setStep("branches");
  };

  const handleBranchSelect = (branch: Branch) => {
    if (!selectedRepo) return;
    const parts = selectedRepo.full_name.split("/");
    const owner = parts.slice(0, -1).join("/");
    const name = parts[parts.length - 1];
    onSelect({
      url: selectedRepo.html_url,
      owner,
      name,
      defaultBranch: branch.name,
    });
    onClose();
  };

  const handleConnect = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    navigateTo(`/api/integrations/link/${provider}?returnUrl=${returnUrl}`);
  };

  const handleBack = () => {
    if (step === "branches") {
      setStep("repositories");
      setSelectedRepo(null);
      setBranches([]);
    }
  };

  const getHeaderTitle = (): string => {
    if (step === "branches") return "브랜치 선택";
    return `${config.name} 저장소 선택`;
  };

  const showBackButton = step === "branches";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="rounded p-1 hover:bg-accent"
                aria-label="뒤로"
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
              </button>
            )}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-muted-foreground"
            >
              {config.icon}
            </svg>
            <h3 className="font-semibold">{getHeaderTitle()}</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-accent">
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isConnected === null && isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {isConnected === false && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mb-4 h-12 w-12 text-muted-foreground"
              >
                {config.icon}
              </svg>
              <p className="mb-4 text-center text-muted-foreground">
                저장소에 접근하려면 {config.name} 연동이 필요합니다
              </p>
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  {config.icon}
                </svg>
                {config.name} 연동하기
              </button>
            </div>
          )}

          {/* Repository Selection Step */}
          {isConnected === true && step === "repositories" && (
            <>
              {/* Search */}
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="저장소 검색..."
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                >
                  검색
                </button>
              </div>

              {/* Repository List */}
              {isLoading && repositories.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : repositories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  저장소가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {repositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleRepoSelect(repo)}
                      className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{repo.name}</span>
                          {repo.private && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.language && (
                          <span className="text-xs text-muted-foreground">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {repo.full_name}
                      </div>
                      {repo.description && (
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {repo.description}
                        </div>
                      )}
                    </button>
                  ))}

                  {hasNext && (
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-border py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      {isLoading ? "로딩 중..." : "더 보기"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Branch Selection Step */}
          {isConnected === true && step === "branches" && selectedRepo && (
            <>
              <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
                    <path d="M3 18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2" />
                    <path d="M3 9v9" />
                    <path d="M21 9v9" />
                    <path d="m9 4 3-2 3 2" />
                    <path d="M12 2v4" />
                  </svg>
                  <span className="font-medium">{selectedRepo.full_name}</span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : branches.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  브랜치가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <button
                      key={branch.name}
                      onClick={() => handleBranchSelect(branch)}
                      className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
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
                            <line x1="6" x2="6" y1="3" y2="15" />
                            <circle cx="18" cy="6" r="3" />
                            <circle cx="6" cy="18" r="3" />
                            <path d="M18 9a9 9 0 0 1-9 9" />
                          </svg>
                          <span className="font-medium">{branch.name}</span>
                          {branch.name === selectedRepo.default_branch && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                              default
                            </span>
                          )}
                        </div>
                        {branch.protected && (
                          <span className="text-xs text-muted-foreground">
                            Protected
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
