/**
 * Upgrade Subscription UseCase
 *
 * 구독 업그레이드 처리 (단일 책임)
 * verify, webhook, test-complete 3곳에서 중복되던 로직을 통합
 */

import { subscriptionRepository } from "@/domains/subscription/infra/prisma-subscription.repository";
import { SubscriptionPeriod } from "@/domains/subscription/model/subscription-period";

export async function upgradeSubscription(userId: string, planId: string) {
  const period = new SubscriptionPeriod();

  const existingSubscription =
    await subscriptionRepository.findByUserId(userId);

  if (existingSubscription) {
    return subscriptionRepository.update(userId, {
      planId,
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: false,
    });
  }

  return subscriptionRepository.create({
    userId,
    planId,
    status: "ACTIVE",
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
  });
}
