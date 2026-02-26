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
};
