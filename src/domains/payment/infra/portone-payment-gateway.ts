/**
 * PortOne Payment Gateway
 *
 * PortOne V1(아임포트) + V2 API를 사용하는 실제 결제 게이트웨이 구현체
 * - verifyClientPayment, refundPayment: V1 아임포트 API
 * - verifyWebhookPayment, cancelPayment: V2 PortOne API
 */

import type {
  PaymentGateway,
  PaymentInfo,
  PaymentStatus,
  RefundResult,
  CancelResult,
} from "../model/payment-gateway";

export interface PortOneConfig {
  v1ApiKey: string | undefined;
  v1ApiSecret: string | undefined;
  v2ApiSecret: string | undefined;
}

export class PortOnePaymentGateway implements PaymentGateway {
  private readonly config: PortOneConfig;

  constructor(config: PortOneConfig) {
    this.config = config;
  }

  // --- V1 아임포트 API ---

  private async getV1AccessToken(): Promise<string> {
    const response = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: this.config.v1ApiKey,
        imp_secret: this.config.v1ApiSecret,
      }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(`V1 액세스 토큰 발급 실패: ${data.message}`);
    }

    return data.response.access_token;
  }

  async verifyClientPayment(impUid: string): Promise<PaymentInfo> {
    const accessToken = await this.getV1AccessToken();

    const response = await fetch(
      `https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();
    if (data.code !== 0 || !data.response) {
      throw new Error(`V1 결제 조회 실패: ${data.message || "Unknown error"}`);
    }

    const payment = data.response;
    return {
      externalPaymentId: payment.imp_uid,
      status: this.mapV1Status(payment.status),
      amount: payment.amount,
      paidAt: payment.paid_at ? new Date(payment.paid_at * 1000) : null,
      orderId: payment.merchant_uid || null,
    };
  }

  async refundPayment(
    impUid: string,
    amount: number,
    reason: string
  ): Promise<RefundResult> {
    const accessToken = await this.getV1AccessToken();

    const response = await fetch("https://api.iamport.kr/payments/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        imp_uid: impUid,
        reason,
        amount,
      }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      return {
        success: false,
        refundedAmount: 0,
        error: data.message || "환불 처리 실패",
      };
    }

    return {
      success: true,
      refundedAmount: data.response.cancel_amount,
    };
  }

  // --- V2 PortOne API ---

  async verifyWebhookPayment(paymentId: string): Promise<PaymentInfo> {
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${this.config.v2ApiSecret}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`V2 결제 조회 실패: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    let orderId: string | null = null;
    if (data.customData) {
      try {
        const customData = JSON.parse(data.customData);
        orderId = customData.orderId || null;
      } catch {
        // customData 파싱 실패 시 무시
      }
    }

    return {
      externalPaymentId: paymentId,
      status: this.mapV2Status(data.status),
      amount: data.amount.total,
      paidAt: new Date(),
      orderId,
    };
  }

  async cancelPayment(
    paymentId: string,
    reason: string
  ): Promise<CancelResult> {
    if (!this.config.v2ApiSecret) {
      return { success: true };
    }

    try {
      const response = await fetch(
        `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `PortOne ${this.config.v2ApiSecret}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "ALREADY_CANCELLED") {
          return { success: true };
        }
        return {
          success: false,
          error: errorData.message || "결제 취소 실패",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "결제 취소 중 오류 발생",
      };
    }
  }

  // --- Status Mapping ---

  private mapV1Status(status: string): PaymentStatus {
    switch (status) {
      case "paid":
        return "PAID";
      case "cancelled":
        return "CANCELLED";
      case "failed":
        return "FAILED";
      default:
        return "PENDING";
    }
  }

  private mapV2Status(status: string): PaymentStatus {
    switch (status) {
      case "PAID":
        return "PAID";
      case "CANCELLED":
        return "CANCELLED";
      case "FAILED":
        return "FAILED";
      default:
        return "PENDING";
    }
  }
}
