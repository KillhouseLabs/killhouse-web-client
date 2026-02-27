/**
 * Prisma Subscription Repository
 *
 * SubscriptionRepository 인터페이스의 Prisma 구현체
 * 모듈 레벨 싱글톤으로 export하여 usecase에서 직접 import
 */

import { prisma } from "@/infrastructure/database/prisma";
import type { SubscriptionRepository } from "../model/subscription.repository";

export const subscriptionRepository: SubscriptionRepository = {
  async findByUserId(userId) {
    return prisma.subscription.findUnique({ where: { userId } });
  },

  async create(data) {
    return prisma.subscription.create({ data });
  },

  async update(userId, data) {
    return prisma.subscription.update({
      where: { userId },
      data,
    });
  },
};
