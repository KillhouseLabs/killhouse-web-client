import { prisma } from "@/infrastructure/database/prisma";
import type { AnalysisRepository } from "../model/analysis.repository";

export const analysisRepository: AnalysisRepository = {
  async updateStatus(id, data) {
    await prisma.analysis.update({ where: { id }, data });
  },
};
