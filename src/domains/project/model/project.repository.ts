export interface ProjectRepository {
  countActiveByUser(userId: string): Promise<number>;
}
