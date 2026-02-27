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
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount?: number;
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  executiveSummary: string | null;
  stepResults: string | null;
  logs?: string | null;
  exploitSessionId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  repository: { id: string; name: string; provider: string } | null;
  [key: string]: unknown;
}

export interface AnalysisWithOwnership {
  id: string;
  branch: string;
  repository: {
    id: string;
    owner: string | null;
    name: string;
  } | null;
  project: {
    userId: string;
  };
}

export interface AnalysisAggregateResult {
  vulnerabilitiesFound: number | null;
  criticalCount: number | null;
}

export interface AnalysisForDedup {
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
}

export interface RecentAnalysisWithProject {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  vulnerabilitiesFound: number | null;
  project: {
    name: string;
    repositories: { provider: string }[];
  };
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

  findByIdWithOwnership(
    analysisId: string
  ): Promise<AnalysisWithOwnership | null>;

  countCompletedByUser(userId: string): Promise<number>;

  aggregateByUser(userId: string): Promise<AnalysisAggregateResult>;

  findRecentForDedup(
    userId: string,
    limit: number
  ): Promise<AnalysisForDedup[]>;

  findRecentWithProject(
    userId: string,
    limit: number
  ): Promise<RecentAnalysisWithProject[]>;

  countActiveSandboxesByUser(userId: string): Promise<number>;
}
