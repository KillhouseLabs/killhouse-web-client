import { prisma } from "@/infrastructure/database/prisma";
import type { VerificationTokenRepository } from "../model/verification-token.repository";

export const verificationTokenRepository: VerificationTokenRepository = {
  async findByToken(token) {
    return prisma.verificationToken.findFirst({ where: { token } });
  },

  async create(data) {
    return prisma.verificationToken.create({ data });
  },

  async deleteByIdentifier(identifier) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
  },

  async deleteByIdentifierAndToken(identifier, token) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    });
  },
};
