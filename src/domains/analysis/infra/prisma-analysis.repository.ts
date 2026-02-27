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

const REPOSITORY_SELECT = {
  select: { id: true, name: true, provider: true },
} as const;

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

  async findManyByProject(projectId) {
    return prisma.analysis.findMany({
      where: { projectId },
      orderBy: { startedAt: "desc" },
      include: {
        repository: REPOSITORY_SELECT,
      },
    });
  },

  async findByIdAndProject(analysisId, projectId) {
    return prisma.analysis.findFirst({
      where: {
        id: analysisId,
        projectId,
      },
      include: {
        repository: REPOSITORY_SELECT,
      },
    });
  },

  async findById(analysisId) {
    return prisma.analysis.findUnique({
      where: { id: analysisId },
    });
  },

  async update(analysisId, data) {
    return prisma.analysis.update({
      where: { id: analysisId },
      data,
    });
  },

  async batchUpdateStatus(ids, data) {
    await Promise.all(
      ids.map((id) =>
        prisma.analysis.update({
          where: { id },
          data,
        })
      )
    );
  },

  async findByIdWithOwnership(analysisId) {
    return prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        branch: true,
        repository: {
          select: { id: true, owner: true, name: true },
        },
        project: {
          select: { userId: true },
        },
      },
    });
  },

  async countCompletedByUser(userId) {
    return prisma.analysis.count({
      where: {
        project: {
          userId,
          status: { not: "DELETED" },
        },
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
    });
  },

  async aggregateByUser(userId) {
    const result = await prisma.analysis.aggregate({
      where: {
        project: {
          userId,
          status: { not: "DELETED" },
        },
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
      _sum: {
        vulnerabilitiesFound: true,
        criticalCount: true,
      },
    });
    return {
      vulnerabilitiesFound: result._sum.vulnerabilitiesFound ?? null,
      criticalCount: result._sum.criticalCount ?? null,
    };
  },

  async findRecentForDedup(userId, limit) {
    return prisma.analysis.findMany({
      where: {
        project: {
          userId,
          status: { not: "DELETED" },
        },
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      select: {
        staticAnalysisReport: true,
        penetrationTestReport: true,
      },
    });
  },

  async countActiveSandboxesByUser(userId) {
    return prisma.analysis.count({
      where: {
        project: { userId },
        sandboxStatus: { in: ["CREATING", "RUNNING"] },
      },
    });
  },

  async findRecentWithProject(userId, limit) {
    return prisma.analysis.findMany({
      where: {
        project: {
          userId,
          status: { not: "DELETED" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        project: {
          select: {
            name: true,
            repositories: {
              where: { isPrimary: true },
              take: 1,
              select: { provider: true },
            },
          },
        },
      },
    });
  },
};
