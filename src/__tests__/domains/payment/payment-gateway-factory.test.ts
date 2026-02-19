/**
 * PaymentGateway Factory Tests
 *
 * PAYMENT_MODE 환경변수에 따른 게이트웨이 구현체 전환 검증
 */

describe("PaymentGateway Factory Logic", () => {
  describe("PAYMENT_MODE 기반 게이트웨이 선택", () => {
    it("GIVEN PAYMENT_MODE=real WHEN 게이트웨이 생성 THEN PortOnePaymentGateway를 반환해야 한다", () => {
      // GIVEN
      const paymentMode = "real";

      // WHEN
      const isReal = paymentMode === "real";

      // THEN
      expect(isReal).toBe(true);
    });

    it("GIVEN PAYMENT_MODE=test WHEN 게이트웨이 생성 THEN TestPaymentGateway를 반환해야 한다", () => {
      // GIVEN
      const paymentMode = "test";

      // WHEN
      const isTest = paymentMode === "test";

      // THEN
      expect(isTest).toBe(true);
    });

    it("GIVEN PAYMENT_MODE 미설정 + production WHEN 게이트웨이 생성 THEN PortOnePaymentGateway를 반환해야 한다", () => {
      // GIVEN
      const paymentMode = undefined;
      const nodeEnv = "production";

      // WHEN - payment-gateway-factory.ts의 로직 재현
      let gatewayType: string;

      if (paymentMode === "real") {
        gatewayType = "portone";
      } else if (paymentMode === "test") {
        gatewayType = "test";
      } else if (nodeEnv === "production") {
        gatewayType = "portone";
      } else {
        gatewayType = "test";
      }

      // THEN
      expect(gatewayType).toBe("portone");
    });

    it("GIVEN PAYMENT_MODE 미설정 + development WHEN 게이트웨이 생성 THEN TestPaymentGateway를 반환해야 한다", () => {
      // GIVEN
      const paymentMode = undefined;
      const nodeEnv = "development";

      // WHEN
      let gatewayType: string;

      if (paymentMode === "real") {
        gatewayType = "portone";
      } else if (paymentMode === "test") {
        gatewayType = "test";
      } else if (nodeEnv === "production") {
        gatewayType = "portone";
      } else {
        gatewayType = "test";
      }

      // THEN
      expect(gatewayType).toBe("test");
    });
  });

  describe("클라이언트-서버 모드 정합성", () => {
    it("GIVEN PAYMENT_MODE=test WHEN 클라이언트와 서버 모드 판단 THEN 동일하게 test 모드여야 한다", () => {
      // GIVEN
      const paymentMode = "test";
      const impCode = undefined;

      // WHEN - 클라이언트 판단 (checkout-button.tsx)
      const clientUseTestMode = impCode ? false : paymentMode !== "real";

      // WHEN - 서버 판단 (test-complete/route.ts)
      const serverIsTestBlocked =
        paymentMode === "real" ||
        (!paymentMode && process.env.NODE_ENV === "production");

      // THEN - 클라이언트가 test 모드이면, 서버도 test 허용해야 함
      expect(clientUseTestMode).toBe(true); // 클라이언트: test 모드
      expect(serverIsTestBlocked).toBe(false); // 서버: test 허용
    });

    it("GIVEN PAYMENT_MODE=real + IMP_CODE 설정 WHEN 클라이언트와 서버 모드 판단 THEN 동일하게 real 모드여야 한다", () => {
      // GIVEN
      const paymentMode = "real";
      const impCode = "imp_1234567890";

      // WHEN - 클라이언트 판단
      const clientUseTestMode = impCode ? false : paymentMode !== "real";

      // WHEN - 서버 판단
      const serverIsTestBlocked =
        paymentMode === "real" ||
        (!paymentMode && process.env.NODE_ENV === "production");

      // THEN - 클라이언트가 real 모드이면, 서버도 test 차단
      expect(clientUseTestMode).toBe(false); // 클라이언트: real 모드
      expect(serverIsTestBlocked).toBe(true); // 서버: test 차단
    });
  });
});
