/**
 * Project Domain Model
 *
 * Legacy field 변환, 저장소 처리 등 프로젝트 도메인 비즈니스 로직.
 */

import { type RepoProviderType, RepoProvider } from "../dto/repository.dto";

// --- Legacy Fields ---

interface RepositoryLike {
  isPrimary: boolean;
  provider: string;
  url: string | null;
  owner: string | null;
  name: string;
  defaultBranch: string;
}

interface HasRepositories {
  repositories: RepositoryLike[];
}

interface LegacyFields {
  repoProvider: string | null;
  repoUrl: string | null;
  repoOwner: string | null;
  repoName: string | null;
  defaultBranch: string;
}

/**
 * Multi-Repository 마이그레이션 후 하위 호환용 필드를 추가한다.
 * Primary repository 기준으로 legacy 단일-repo 필드를 계산.
 */
export function addLegacyFields<T extends HasRepositories>(
  project: T
): T & LegacyFields {
  const primaryRepo = project.repositories.find((r) => r.isPrimary);
  return {
    ...project,
    repoProvider: primaryRepo?.provider || null,
    repoUrl: primaryRepo?.url || null,
    repoOwner: primaryRepo?.owner || null,
    repoName: primaryRepo?.name || null,
    defaultBranch: primaryRepo?.defaultBranch || "main",
  };
}

// --- Repository Processing ---

interface RepositoryInput {
  provider: string;
  url?: string | null;
  name: string;
  defaultBranch: string;
  isPrimary?: boolean;
  role?: string;
}

interface ProcessedRepository {
  provider: string;
  url: string | null;
  owner: string | null;
  name: string;
  defaultBranch: string;
  isPrimary: boolean;
  role: string | undefined;
}

/**
 * Repository URL에서 provider, owner, name을 파싱한다.
 */
export function parseRepoUrl(url: string): {
  provider: RepoProviderType;
  owner: string;
  name: string;
} | null {
  const githubMatch = url.match(
    /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/
  );
  if (githubMatch) {
    return {
      provider: RepoProvider.GITHUB,
      owner: githubMatch[1],
      name: githubMatch[2].replace(/\.git$/, ""),
    };
  }

  const gitlabMatch = url.match(
    /^https:\/\/gitlab\.com\/([\w.-]+(?:\/[\w.-]+)*)\/([\w.-]+)\/?$/
  );
  if (gitlabMatch) {
    return {
      provider: RepoProvider.GITLAB,
      owner: gitlabMatch[1],
      name: gitlabMatch[2].replace(/\.git$/, ""),
    };
  }

  const gitlabSelfUrl = process.env.GITLAB_SELF_URL;
  if (gitlabSelfUrl && gitlabSelfUrl !== "https://gitlab.com") {
    const escapedUrl = gitlabSelfUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const selfHostedMatch = url.match(
      new RegExp(`^${escapedUrl}/([-\\w.]+(?:/[-\\w.]+)*)/([-\\w.]+)/?$`)
    );
    if (selfHostedMatch) {
      return {
        provider: RepoProvider.GITLAB_SELF,
        owner: selfHostedMatch[1],
        name: selfHostedMatch[2].replace(/\.git$/, ""),
      };
    }
  }

  return null;
}

/**
 * DTO 배열을 Prisma create용 저장소 객체로 변환한다.
 * - URL에서 owner 파싱
 * - 첫 번째 저장소를 primary로 기본 설정
 * - primary가 없으면 첫 번째를 강제 지정
 */
export function processRepositories(
  repositories: RepositoryInput[]
): ProcessedRepository[] {
  const processed = repositories.map((repo, index) => {
    let owner: string | null = null;
    if (repo.url) {
      const parsed = parseRepoUrl(repo.url);
      if (parsed) {
        owner = parsed.owner;
      }
    }

    return {
      provider: repo.provider,
      url: repo.url || null,
      owner,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
      isPrimary: index === 0 ? (repo.isPrimary ?? true) : !!repo.isPrimary,
      role: repo.role,
    };
  });

  const hasPrimary = processed.some((r) => r.isPrimary);
  if (processed.length > 0 && !hasPrimary) {
    processed[0].isPrimary = true;
  }

  return processed;
}
