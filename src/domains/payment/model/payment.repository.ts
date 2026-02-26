/**
 * Payment Repository Port Interface
 *
 * 결제 데이터 접근 추상화 인터페이스
 * UseCase는 이 인터페이스에만 의존하며, 구체적인 Prisma 구현을 알지 못한다.
 */

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  planId: string;
  amount: number;
  status: string;
  portonePaymentId?: string | null;
  paidAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
}

export interface PaymentRepository {
  create(data: {
    orderId: string;
    userId: string;
    planId: string;
    amount: number;
    status: string;
  }): Promise<PaymentRecord>;

  findByOrderIdAndUserId(
    orderId: string,
    userId: string
  ): Promise<PaymentRecord | null>;

  findCompletedByIdAndUserId(
    id: string,
    userId: string
  ): Promise<PaymentRecord | null>;

  updateStatus(
    id: string,
    data: {
      status: string;
      portonePaymentId?: string;
      paidAt?: Date | null;
      cancelledAt?: Date;
      cancelReason?: string;
    }
  ): Promise<PaymentRecord>;
}
