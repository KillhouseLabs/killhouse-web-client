import { z } from "zod";
import { createRepositorySchema } from "./repository.dto";

/**
 * parseRepoUrl, RepoProvider — 도메인 로직은 model에 정의.
 * 기존 import 호환을 위해 re-export.
 */
export { parseRepoUrl } from "../model/project";
export { RepoProvider, type RepoProviderType } from "./repository.dto";

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
