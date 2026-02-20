import { z } from "zod";

// Repository provider enum
export const RepoProvider = {
  GITHUB: "GITHUB",
  GITLAB: "GITLAB",
  MANUAL: "MANUAL",
} as const;

export type RepoProviderType = (typeof RepoProvider)[keyof typeof RepoProvider];

/**
 * 저장소 생성 스키마
 */
export const createRepositorySchema = z.object({
  provider: z.enum(["GITHUB", "GITLAB", "MANUAL"]),
  url: z.string().optional().or(z.literal("")),
  owner: z.string().optional(),
  name: z
    .string()
    .min(1, "저장소 이름을 입력하세요")
    .max(100, "저장소 이름은 100자 이하여야 합니다"),
  defaultBranch: z.string().default("main"),
  isPrimary: z.boolean().default(false),
  role: z.string().max(50, "역할은 50자 이하여야 합니다").optional(),
  dockerfileContent: z.string().optional(),
  composeContent: z.string().optional(),
  dockerfilePath: z.string().max(500).optional(),
  buildContext: z.string().max(500).optional(),
  targetService: z.string().max(100).optional(),
  accountId: z.string().optional(),
});

/**
 * 저장소 수정 스키마
 */
export const updateRepositorySchema = z.object({
  name: z
    .string()
    .min(1, "저장소 이름을 입력하세요")
    .max(100, "저장소 이름은 100자 이하여야 합니다")
    .optional(),
  defaultBranch: z.string().optional(),
  isPrimary: z.boolean().optional(),
  role: z.string().max(50, "역할은 50자 이하여야 합니다").optional(),
  dockerfilePath: z.string().max(500).optional(),
  buildContext: z.string().max(500).optional(),
  targetService: z.string().max(100).optional(),
});

export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
export type UpdateRepositoryInput = z.infer<typeof updateRepositorySchema>;
