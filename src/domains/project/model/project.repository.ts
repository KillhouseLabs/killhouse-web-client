/**
 * Project Repository Interface
 *
 * Project 도메인의 데이터 접근 추상화.
 */

import type { Repository } from "./repository";

// --- Result Types ---

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositoryRecord {
  id: string;
  provider: string;
  url: string | null;
  owner: string | null;
  name: string;
  defaultBranch: string;
  isPrimary: boolean;
  role: string | null;
  dockerfileContent: string | null;
  composeContent: string | null;
  dockerfilePath: string | null;
  buildContext: string | null;
  targetService: string | null;
  uploadKey: string | null;
  projectId: string;
  accountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRecord {
  id: string;
  status: string;
  branch: string;
  commitHash: string | null;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount?: number;
  startedAt: Date;
  completedAt: Date | null;
  [key: string]: unknown;
}

export interface ProjectWithRelations extends ProjectRecord {
  repositories: RepositoryRecord[];
  _count: { analyses: number };
}

export interface ProjectWithDetail extends ProjectRecord {
  repositories: RepositoryRecord[];
  analyses: AnalysisRecord[];
  _count: { analyses: number };
}

export interface ProjectFullDetail extends ProjectRecord {
  repositories: (RepositoryRecord & { _count: { analyses: number } })[];
  analyses: AnalysisRecord[];
  _count: { analyses: number };
}

// --- Interface ---

export interface ProjectRepository {
  countActiveByUser(userId: string): Promise<number>;

  findActiveByUser(
    userId: string,
    options: { skip: number; take: number }
  ): Promise<{ projects: ProjectWithRelations[]; totalCount: number }>;

  findByIdAndUser(
    userId: string,
    projectId: string
  ): Promise<ProjectRecord | null>;

  findDetailByIdAndUser(
    userId: string,
    projectId: string
  ): Promise<ProjectWithDetail | null>;

  createWithRepositories(data: {
    name: string;
    description?: string;
    userId: string;
    repositories: Repository[];
  }): Promise<ProjectWithRelations>;

  update(
    projectId: string,
    data: Record<string, unknown>
  ): Promise<ProjectWithRelations>;

  findFullDetailByIdAndUser(
    userId: string,
    projectId: string
  ): Promise<ProjectFullDetail | null>;

  softDelete(projectId: string): Promise<void>;
}
