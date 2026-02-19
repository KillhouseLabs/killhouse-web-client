/**
 * Test Payment Gateway
 *
 * 테스트 환경용 결제 게이트웨이 구현체
 * 실제 PG사 API 호출 없이 항상 성공 응답을 반환
 */

import type {
  PaymentGateway,
  PaymentInfo,
  RefundResult,
  CancelResult,
} from "../model/payment-gateway";

const TEST_AMOUNT = 29000;

export class TestPaymentGateway implements PaymentGateway {
  async verifyClientPayment(impUid: string): Promise<PaymentInfo> {
    return {
      externalPaymentId: impUid,
      status: "PAID",
      amount: TEST_AMOUNT,
      paidAt: new Date(),
      orderId: null,
    };
  }

  async verifyWebhookPayment(paymentId: string): Promise<PaymentInfo> {
    return {
      externalPaymentId: paymentId,
      status: "PAID",
      amount: TEST_AMOUNT,
      paidAt: new Date(),
      orderId: null,
    };
  }

  async refundPayment(
    _impUid: string,
    amount: number,
    _reason: string
  ): Promise<RefundResult> {
    return {
      success: true,
      refundedAmount: amount,
    };
  }

  async cancelPayment(
    _paymentId: string,
    _reason: string
  ): Promise<CancelResult> {
    return {
      success: true,
    };
  }
}
