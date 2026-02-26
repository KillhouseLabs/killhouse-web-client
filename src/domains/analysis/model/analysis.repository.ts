export interface AnalysisRecord {
  id: string;
  status: string;
  projectId: string;
  repositoryId: string | null;
  branch: string;
  commitHash: string | null;
}

export interface AnalysisWithRepository {
  id: string;
  status: string;
  projectId: string;
  repositoryId: string | null;
  branch: string;
  commitHash: string | null;
  startedAt: Date;
  completedAt: Date | null;
  repository: { id: string; name: string; provider: string } | null;
  [key: string]: unknown;
}

export type AtomicCreateResult =
  | { created: true; analysis: AnalysisRecord }
  | { created: false; reason: "MONTHLY_LIMIT"; currentCount: number }
  | { created: false; reason: "CONCURRENT_LIMIT"; currentCount: number };

export interface AnalysisRepository {
  updateStatus(
    id: string,
    data: {
      sandboxStatus?: string;
      sandboxContainerId?: string;
    }
  ): Promise<void>;

  countMonthlyByUser(userId: string, since: Date): Promise<number>;

  countConcurrentByUser(
    userId: string,
    terminalStatuses: readonly string[]
  ): Promise<number>;

  createWithLimitCheck(params: {
    userId: string;
    projectId: string;
    repositoryId: string | null;
    branch: string;
    commitHash: string | null;
    monthlyLimit: number;
    concurrentLimit: number;
    monthStart: Date;
    terminalStatuses: readonly string[];
  }): Promise<AtomicCreateResult>;

  findManyByProject(projectId: string): Promise<AnalysisWithRepository[]>;

  findByIdAndProject(
    analysisId: string,
    projectId: string
  ): Promise<AnalysisWithRepository | null>;

  findById(analysisId: string): Promise<Record<string, unknown> | null>;

  update(
    analysisId: string,
    data: Record<string, unknown>
  ): Promise<{ id: string; status: string }>;

  batchUpdateStatus(
    ids: string[],
    data: { status: string; completedAt: Date }
  ): Promise<void>;
}
