/**
 * Order — 결제 주문 도메인 모델
 *
 * 플랜 검증, orderId 생성, 금액 계산을 constructor에서 수행한다.
 * 생성 시점에 불변식(invariant)을 보장.
 */

import { PLANS } from "@/domains/subscription/model/plan";

export class Order {
  readonly orderId: string;
  readonly planId: string;
  readonly planName: string;
  readonly amount: number;
  readonly currency = "KRW" as const;
  readonly orderName: string;

  constructor(planId: string) {
    const planKey = planId.toUpperCase() as keyof typeof PLANS;
    const plan = PLANS[planKey];

    if (!plan) {
      throw new InvalidOrderError(`존재하지 않는 플랜입니다: ${planId}`);
    }
    if (plan.price <= 0) {
      throw new InvalidOrderError("유효하지 않은 플랜입니다");
    }

    this.orderId = Order.generateOrderId();
    this.planId = planId;
    this.planName = plan.name;
    this.amount = plan.price;
    this.orderName = `Killhouse ${plan.name} 플랜`;
  }

  private static generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `order_${timestamp}_${random}`;
  }
}

export class InvalidOrderError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrderError";
  }
}
