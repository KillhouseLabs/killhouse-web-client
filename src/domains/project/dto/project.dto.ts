import { z } from "zod";
import { createRepositorySchema } from "./repository.dto";

// Repository provider enum
export const RepoProvider = {
  GITHUB: "GITHUB",
  GITLAB: "GITLAB",
  GITLAB_SELF: "GITLAB_SELF",
  MANUAL: "MANUAL",
} as const;

export type RepoProviderType = (typeof RepoProvider)[keyof typeof RepoProvider];

/**
 * 프로젝트 생성 스키마 (Multi-Repository 지원)
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "프로젝트 이름을 입력하세요")
    .max(100, "프로젝트 이름은 100자 이하여야 합니다"),
  description: z.string().max(500, "설명은 500자 이하여야 합니다").optional(),
  repositories: z.array(createRepositorySchema).optional().default([]),
});

/**
 * 프로젝트 수정 스키마
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "프로젝트 이름을 입력하세요")
    .max(100, "프로젝트 이름은 100자 이하여야 합니다")
    .optional(),
  description: z.string().max(500, "설명은 500자 이하여야 합니다").optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Helper to extract repo info from URL
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

  // gitlab.com 매칭 (중첩 그룹 지원)
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

  // 셀프호스팅 GitLab 매칭 (GITLAB_SELF_URL 환경변수 기반)
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
