/**
 * Prisma Payment Repository
 *
 * PaymentRepository 인터페이스의 Prisma 구현체
 * 모듈 레벨 싱글톤으로 export하여 usecase에서 직접 import
 */

import { prisma } from "@/infrastructure/database/prisma";
import type { PaymentRepository } from "../model/payment.repository";

export const paymentRepository: PaymentRepository = {
  async create(data) {
    return prisma.payment.create({ data });
  },

  async findByOrderIdAndUserId(orderId, userId) {
    return prisma.payment.findFirst({
      where: { orderId, userId },
    });
  },

  async findCompletedByIdAndUserId(id, userId) {
    return prisma.payment.findFirst({
      where: { id, userId, status: "COMPLETED" },
    });
  },

  async updateStatus(id, data) {
    return prisma.payment.update({
      where: { id },
      data,
    });
  },

  async findByPortonePaymentIdOrOrderId(paymentId, orderId) {
    return prisma.payment.findFirst({
      where: {
        OR: [
          { portonePaymentId: paymentId },
          ...(orderId ? [{ orderId }] : []),
        ],
      },
    });
  },

  async findPendingByOrderIdAndUserId(orderId, userId) {
    return prisma.payment.findFirst({
      where: { orderId, userId, status: "PENDING" },
    });
  },

  async findLastCompletedByUserId(userId) {
    return prisma.payment.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
    });
  },

  async findManyByUserId(userId) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderId: true,
        planId: true,
        amount: true,
        status: true,
        portonePaymentId: true,
        paidAt: true,
        cancelledAt: true,
        cancelReason: true,
        createdAt: true,
      },
    });
  },
};
