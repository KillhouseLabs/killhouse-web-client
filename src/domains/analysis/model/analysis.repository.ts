export interface AnalysisRepository {
  updateStatus(
    id: string,
    data: {
      sandboxStatus?: string;
      sandboxContainerId?: string;
    }
  ): Promise<void>;
}
