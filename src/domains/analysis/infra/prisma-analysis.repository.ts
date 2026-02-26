/**
 * Prisma Analysis Repository
 *
 * AnalysisRepository 인터페이스의 Prisma 구현체
 * 트랜잭션 로직을 캡슐화하여 usecase 레이어에서 Prisma 의존을 제거한다.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { canPerformAction } from "@/domains/policy/model/policy";
import type {
  AnalysisRepository,
  AtomicCreateResult,
} from "../model/analysis.repository";

export const analysisRepository: AnalysisRepository = {
  async updateStatus(id, data) {
    await prisma.analysis.update({ where: { id }, data });
  },

  async countMonthlyByUser(userId, since) {
    return prisma.analysis.count({
      where: {
        project: { userId },
        startedAt: { gte: since },
      },
    });
  },

  async countConcurrentByUser(userId, terminalStatuses) {
    return prisma.analysis.count({
      where: {
        project: { userId },
        status: { notIn: [...terminalStatuses] },
      },
    });
  },

  async createWithLimitCheck(params): Promise<AtomicCreateResult> {
    return prisma.$transaction(
      async (tx) => {
        const monthlyCount = await tx.analysis.count({
          where: {
            project: { userId: params.userId },
            startedAt: { gte: params.monthStart },
          },
        });

        if (!canPerformAction(monthlyCount, params.monthlyLimit)) {
          return {
            created: false as const,
            reason: "MONTHLY_LIMIT" as const,
            currentCount: monthlyCount,
          };
        }

        const concurrentCount = await tx.analysis.count({
          where: {
            project: { userId: params.userId },
            status: { notIn: [...params.terminalStatuses] },
          },
        });

        if (!canPerformAction(concurrentCount, params.concurrentLimit)) {
          return {
            created: false as const,
            reason: "CONCURRENT_LIMIT" as const,
            currentCount: concurrentCount,
          };
        }

        const analysis = await tx.analysis.create({
          data: {
            projectId: params.projectId,
            repositoryId: params.repositoryId,
            branch: params.branch,
            commitHash: params.commitHash,
            status: "PENDING",
          },
        });

        return {
          created: true as const,
          analysis: {
            id: analysis.id,
            status: analysis.status,
            projectId: analysis.projectId,
            repositoryId: analysis.repositoryId,
            branch: analysis.branch,
            commitHash: analysis.commitHash,
          },
        };
      },
      { isolationLevel: "Serializable" }
    );
  },
};
