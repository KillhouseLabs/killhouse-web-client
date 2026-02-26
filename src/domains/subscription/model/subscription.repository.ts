/**
 * Subscription Repository Port Interface
 *
 * 구독 데이터 접근 추상화 인터페이스
 * UseCase는 이 인터페이스에만 의존하며, 구체적인 Prisma 구현을 알지 못한다.
 */

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<SubscriptionRecord | null>;

  create(data: {
    userId: string;
    planId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<SubscriptionRecord>;

  update(
    userId: string,
    data: Partial<Omit<SubscriptionRecord, "id" | "userId">>
  ): Promise<SubscriptionRecord>;
}
