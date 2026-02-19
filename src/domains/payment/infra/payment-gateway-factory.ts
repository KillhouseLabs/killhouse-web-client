/**
 * Payment Gateway Factory
 *
 * Feature flag(PAYMENT_MODE) 기반으로 결제 게이트웨이 구현체를 전환
 * - PAYMENT_MODE=real → PortOnePaymentGateway (실제 PG)
 * - PAYMENT_MODE=test → TestPaymentGateway (mock)
 * - 미설정 시: production → real, 그 외 → test
 */

import type { PaymentGateway } from "../model/payment-gateway";
import { PortOnePaymentGateway } from "./portone-payment-gateway";
import { TestPaymentGateway } from "./test-payment-gateway";

export function createPaymentGateway(): PaymentGateway {
  const paymentMode = process.env.PAYMENT_MODE;

  if (paymentMode === "real") {
    return new PortOnePaymentGateway({
      v1ApiKey: process.env.PORTONE_REST_API_KEY,
      v1ApiSecret: process.env.PORTONE_REST_API_SECRET,
      v2ApiSecret: process.env.PORTONE_API_SECRET,
    });
  }

  if (paymentMode === "test") {
    return new TestPaymentGateway();
  }

  // 미설정 시 NODE_ENV로 판단
  if (process.env.NODE_ENV === "production") {
    return new PortOnePaymentGateway({
      v1ApiKey: process.env.PORTONE_REST_API_KEY,
      v1ApiSecret: process.env.PORTONE_REST_API_SECRET,
      v2ApiSecret: process.env.PORTONE_API_SECRET,
    });
  }

  return new TestPaymentGateway();
}
