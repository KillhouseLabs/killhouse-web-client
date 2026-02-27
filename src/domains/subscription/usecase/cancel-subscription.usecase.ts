/**
 * Cancel Subscription UseCase
 *
 * 구독을 Free 플랜으로 다운그레이드한다.
 * 환불 처리 후 호출되는 cross-domain 분리 지점.
 */

import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";

export async function cancelSubscription(userId: string) {
  return subscriptionRepository.update(userId, {
    planId: "free",
    status: "CANCELLED",
    cancelAtPeriodEnd: false,
  });
}
