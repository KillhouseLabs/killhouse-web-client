import { prisma } from "@/infrastructure/database/prisma";
import type { AccountRepository } from "../model/account.repository";

export const accountRepository: AccountRepository = {
  async findAccessToken(userId, provider, accountId?) {
    return prisma.account.findFirst({
      where: accountId
        ? { id: accountId, userId, provider }
        : { userId, provider },
      select: { access_token: true },
    });
  },

  async findOAuthAccounts(userId) {
    return prisma.account.findMany({
      where: { userId, type: "oauth" },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        access_token: true,
      },
      orderBy: { provider: "asc" },
    });
  },

  async findProviderStatuses(userId, providers) {
    return prisma.account.findMany({
      where: { userId, provider: { in: providers } },
      select: { provider: true, scope: true },
    });
  },

  async findByProviderAccount(provider, providerAccountId) {
    return prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    });
  },

  async refreshTokens(provider, providerAccountId, data) {
    await prisma.account.updateMany({
      where: { provider, providerAccountId },
      data,
    });
  },

  async updateById(id, data) {
    await prisma.account.update({ where: { id }, data });
  },

  async create(data) {
    return prisma.account.create({ data });
  },
};
