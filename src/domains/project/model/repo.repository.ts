/**
 * Repo Repository Interface
 *
 * Repository(저장소) 도메인의 데이터 접근 추상화.
 * 파일명이 repository.repository.ts면 혼동되므로 repo.repository.ts로 명명.
 */

export interface RepoRecord {
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

export interface RepoWithCount extends RepoRecord {
  _count: { analyses: number };
}

export interface RepoRepository {
  findManyByProject(projectId: string): Promise<RepoWithCount[]>;

  findByIdAndProject(
    repoId: string,
    projectId: string
  ): Promise<RepoWithCount | null>;

  findFirstByProject(
    projectId: string,
    where?: { provider?: string }
  ): Promise<RepoRecord | null>;

  findDuplicateUrl(projectId: string, url: string): Promise<RepoRecord | null>;

  create(
    data: Omit<RepoRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<RepoRecord>;

  update(
    repoId: string,
    data: Partial<
      Omit<RepoRecord, "id" | "projectId" | "createdAt" | "updatedAt">
    >
  ): Promise<RepoRecord>;

  unsetPrimary(projectId: string, excludeRepoId?: string): Promise<void>;

  delete(repoId: string): Promise<RepoRecord>;

  findOldestByProject(projectId: string): Promise<RepoRecord | null>;
}
