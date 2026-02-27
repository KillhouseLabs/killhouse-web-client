/**
 * Prisma Project Repository
 *
 * ProjectRepository 인터페이스의 Prisma 구현체
 */

import { prisma } from "@/infrastructure/database/prisma";
import type { ProjectRepository } from "../model/project.repository";

export const projectRepository: ProjectRepository = {
  async countActiveByUser(userId) {
    return prisma.project.count({
      where: {
        userId,
        status: { not: "DELETED" },
      },
    });
  },

  async findActiveByUser(userId, { skip, take }) {
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: {
          userId,
          status: { not: "DELETED" },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          repositories: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
          _count: {
            select: { analyses: true },
          },
        },
      }),
      prisma.project.count({
        where: {
          userId,
          status: { not: "DELETED" },
        },
      }),
    ]);

    return { projects, totalCount };
  },

  async findByIdAndUser(userId, projectId) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        status: { not: "DELETED" },
      },
    });
  },

  async findDetailByIdAndUser(userId, projectId) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        status: { not: "DELETED" },
      },
      include: {
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        analyses: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
        _count: {
          select: { analyses: true },
        },
      },
    });
  },

  async createWithRepositories({ name, description, userId, repositories }) {
    return prisma.project.create({
      data: {
        name,
        description,
        userId,
        repositories: {
          create: repositories,
        },
      },
      include: {
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        _count: {
          select: { analyses: true },
        },
      },
    });
  },

  async update(projectId, data) {
    return prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        _count: {
          select: { analyses: true },
        },
      },
    });
  },

  async findFullDetailByIdAndUser(userId, projectId) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        status: { not: "DELETED" },
      },
      include: {
        repositories: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          include: { _count: { select: { analyses: true } } },
        },
        analyses: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
        _count: { select: { analyses: true } },
      },
    });
  },

  async softDelete(projectId) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "DELETED" },
    });
  },
};
