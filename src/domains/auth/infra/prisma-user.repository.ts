import { prisma } from "@/infrastructure/database/prisma";
import type { UserRepository } from "../model/user.repository";

export const userRepository: UserRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.user.create({ data });
  },

  async updatePassword(email, password) {
    return prisma.user.update({
      where: { email },
      data: { password },
    });
  },

  async delete(id) {
    await prisma.user.delete({ where: { id } });
  },
};
