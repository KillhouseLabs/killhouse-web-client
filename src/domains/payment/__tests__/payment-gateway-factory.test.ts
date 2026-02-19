/**
 * PaymentGatewayFactory Tests
 *
 * Feature flag 기반 결제 게이트웨이 팩토리 BDD 테스트
 */

import { createPaymentGateway } from "../infra/payment-gateway-factory";
import { TestPaymentGateway } from "../infra/test-payment-gateway";
import { PortOnePaymentGateway } from "../infra/portone-payment-gateway";

describe("PaymentGatewayFactory", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("GIVEN PAYMENT_MODE=real WHEN 생성 THEN PortOnePaymentGateway", () => {
    // GIVEN
    process.env.PAYMENT_MODE = "real";

    // WHEN
    const gateway = createPaymentGateway();

    // THEN
    expect(gateway).toBeInstanceOf(PortOnePaymentGateway);
  });

  it("GIVEN PAYMENT_MODE=test WHEN 생성 THEN TestPaymentGateway", () => {
    // GIVEN
    process.env.PAYMENT_MODE = "test";

    // WHEN
    const gateway = createPaymentGateway();

    // THEN
    expect(gateway).toBeInstanceOf(TestPaymentGateway);
  });

  it("GIVEN 미설정+production WHEN 생성 THEN PortOnePaymentGateway", () => {
    // GIVEN
    delete process.env.PAYMENT_MODE;
    (process.env as Record<string, string>).NODE_ENV = "production";

    // WHEN
    const gateway = createPaymentGateway();

    // THEN
    expect(gateway).toBeInstanceOf(PortOnePaymentGateway);
  });

  it("GIVEN 미설정+development WHEN 생성 THEN TestPaymentGateway", () => {
    // GIVEN
    delete process.env.PAYMENT_MODE;
    (process.env as Record<string, string>).NODE_ENV = "development";

    // WHEN
    const gateway = createPaymentGateway();

    // THEN
    expect(gateway).toBeInstanceOf(TestPaymentGateway);
  });

  it("GIVEN 미설정+test WHEN 생성 THEN TestPaymentGateway", () => {
    // GIVEN
    delete process.env.PAYMENT_MODE;
    (process.env as Record<string, string>).NODE_ENV = "test";

    // WHEN
    const gateway = createPaymentGateway();

    // THEN
    expect(gateway).toBeInstanceOf(TestPaymentGateway);
  });
});
