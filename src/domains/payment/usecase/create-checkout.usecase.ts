/**
 * Create Checkout UseCase
 *
 * 결제 주문 생성 및 결제 준비 정보 반환
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PLANS } from "@/domains/subscription/model/plan";

export interface CheckoutInput {
  userId: string;
  planId: string;
  customerEmail: string | null | undefined;
  customerName: string | null | undefined;
}

export interface CheckoutResult {
  orderId: string;
  paymentId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  orderName: string;
  customer: {
    email: string | null | undefined;
    name: string;
  };
}

export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${random}`;
}

export async function createCheckout(
  input: CheckoutInput
): Promise<CheckoutResult> {
  const { userId, planId, customerEmail, customerName } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new CheckoutError("사용자 정보를 찾을 수 없습니다", 404);
  }

  const planKey = planId.toUpperCase() as keyof typeof PLANS;
  const plan = PLANS[planKey];

  if (!plan || plan.price <= 0) {
    throw new CheckoutError("유효하지 않은 플랜입니다", 400);
  }

  const orderId = generateOrderId();

  const payment = await prisma.payment.create({
    data: {
      orderId,
      userId,
      planId,
      amount: plan.price,
      status: "PENDING",
    },
  });

  return {
    orderId: payment.orderId,
    paymentId: payment.id,
    planId: payment.planId,
    planName: plan.name,
    amount: payment.amount,
    currency: "KRW",
    orderName: `Killhouse ${plan.name} 플랜`,
    customer: {
      email: customerEmail,
      name: customerName || "고객",
    },
  };
}

export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}
