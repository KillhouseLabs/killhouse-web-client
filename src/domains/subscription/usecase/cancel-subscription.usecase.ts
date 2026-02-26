/**
 * Cancel Subscription UseCase
 *
 * 구독을 Free 플랜으로 다운그레이드한다.
 * 환불 처리 후 호출되는 cross-domain 분리 지점.
 */

import { prisma } from "@/infrastructure/database/prisma";

export async function cancelSubscription(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      planId: "free",
      status: "CANCELLED",
      cancelAtPeriodEnd: false,
    },
  });
}
