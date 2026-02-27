/**
 * Prisma Repo Repository
 *
 * RepoRepository 인터페이스의 Prisma 구현체
 */

import { prisma } from "@/infrastructure/database/prisma";
import type { RepoRepository } from "../model/repo.repository";

export const repoRepository: RepoRepository = {
  async findManyByProject(projectId) {
    return prisma.repository.findMany({
      where: { projectId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { analyses: true },
        },
      },
    });
  },

  async findByIdAndProject(repoId, projectId) {
    return prisma.repository.findFirst({
      where: {
        id: repoId,
        projectId,
      },
      include: {
        _count: {
          select: { analyses: true },
        },
      },
    });
  },

  async findFirstByProject(projectId, where) {
    return prisma.repository.findFirst({
      where: {
        projectId,
        ...where,
      },
    });
  },

  async findDuplicateUrl(projectId, url) {
    return prisma.repository.findFirst({
      where: {
        projectId,
        url,
      },
    });
  },

  async create(data) {
    return prisma.repository.create({ data });
  },

  async update(repoId, data) {
    return prisma.repository.update({
      where: { id: repoId },
      data,
    });
  },

  async unsetPrimary(projectId, excludeRepoId?) {
    await prisma.repository.updateMany({
      where: {
        projectId,
        isPrimary: true,
        ...(excludeRepoId && { id: { not: excludeRepoId } }),
      },
      data: { isPrimary: false },
    });
  },

  async delete(repoId) {
    return prisma.repository.delete({
      where: { id: repoId },
    });
  },

  async findOldestByProject(projectId) {
    return prisma.repository.findFirst({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  },
};
