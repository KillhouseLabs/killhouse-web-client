/**
 * Payment Gateway Interface & Value Objects
 *
 * 결제 게이트웨이 추상화 인터페이스와 결제 관련 값 객체 정의
 * SOLID - Dependency Inversion: route handler는 이 인터페이스에만 의존
 */

export type PaymentStatus = "PAID" | "FAILED" | "CANCELLED" | "PENDING";

export interface PaymentInfo {
  externalPaymentId: string;
  status: PaymentStatus;
  amount: number;
  paidAt: Date | null;
  orderId: string | null;
}

export interface RefundResult {
  success: boolean;
  refundedAmount: number;
  error?: string;
}

export interface CancelResult {
  success: boolean;
  error?: string;
}

export interface PaymentGateway {
  verifyClientPayment(impUid: string): Promise<PaymentInfo>;
  verifyWebhookPayment(paymentId: string): Promise<PaymentInfo>;
  refundPayment(
    impUid: string,
    amount: number,
    reason: string
  ): Promise<RefundResult>;
  cancelPayment(paymentId: string, reason: string): Promise<CancelResult>;
}
