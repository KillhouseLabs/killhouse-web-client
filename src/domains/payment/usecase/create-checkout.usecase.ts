/**
 * Create Checkout UseCase
 *
 * 결제 주문 생성 및 결제 준비 정보 반환
 */

import { prisma } from "@/infrastructure/database/prisma";
import { Order } from "@/domains/payment/model/order";

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

  const order = new Order(planId);

  const payment = await prisma.payment.create({
    data: {
      orderId: order.orderId,
      userId,
      planId: order.planId,
      amount: order.amount,
      status: "PENDING",
    },
  });

  return {
    orderId: order.orderId,
    paymentId: payment.id,
    planId: order.planId,
    planName: order.planName,
    amount: order.amount,
    currency: order.currency,
    orderName: order.orderName,
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
