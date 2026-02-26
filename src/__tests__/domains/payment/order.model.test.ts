/**
 * Order Domain Model Tests
 *
 * 플랜 검증, orderId 생성, 금액 계산이 constructor에서 수행되는지 검증
 */

import { Order, InvalidOrderError } from "@/domains/payment/model/order";
import { PLANS } from "@/domains/subscription/model/plan";

describe("Order Domain Model", () => {
  describe("유효한 플랜으로 생성", () => {
    it("GIVEN pro 플랜 WHEN Order 생성 THEN 플랜 정보가 올바르게 설정되어야 한다", () => {
      // GIVEN & WHEN
      const order = new Order("pro");

      // THEN
      expect(order.planId).toBe("pro");
      expect(order.planName).toBe(PLANS.PRO.name);
      expect(order.amount).toBe(PLANS.PRO.price);
      expect(order.currency).toBe("KRW");
      expect(order.orderName).toBe(`Killhouse ${PLANS.PRO.name} 플랜`);
    });

    it("GIVEN 대소문자 혼합 planId WHEN Order 생성 THEN 정상 처리되어야 한다", () => {
      // GIVEN & WHEN
      const order = new Order("Pro");

      // THEN
      expect(order.planName).toBe(PLANS.PRO.name);
      expect(order.amount).toBe(PLANS.PRO.price);
    });
  });

  describe("orderId 생성", () => {
    it("GIVEN Order 생성 WHEN orderId 확인 THEN order_ 접두사를 가져야 한다", () => {
      // GIVEN & WHEN
      const order = new Order("pro");

      // THEN
      expect(order.orderId).toMatch(/^order_\d+_[a-z0-9]+$/);
    });

    it("GIVEN 두 개의 Order WHEN 각각 생성 THEN orderId가 달라야 한다", () => {
      // GIVEN & WHEN
      const order1 = new Order("pro");
      const order2 = new Order("pro");

      // THEN
      expect(order1.orderId).not.toBe(order2.orderId);
    });
  });

  describe("불변식 위반 → InvalidOrderError", () => {
    it("GIVEN 존재하지 않는 플랜 WHEN Order 생성 THEN InvalidOrderError를 던져야 한다", () => {
      // GIVEN & WHEN & THEN
      expect(() => new Order("nonexistent")).toThrow(InvalidOrderError);
      expect(() => new Order("nonexistent")).toThrow(
        "존재하지 않는 플랜입니다: nonexistent"
      );
    });

    it("GIVEN free 플랜 (price=0) WHEN Order 생성 THEN InvalidOrderError를 던져야 한다", () => {
      // GIVEN & WHEN & THEN
      expect(() => new Order("free")).toThrow(InvalidOrderError);
      expect(() => new Order("free")).toThrow("유효하지 않은 플랜입니다");
    });

    it("GIVEN enterprise 플랜 (price=-1) WHEN Order 생성 THEN InvalidOrderError를 던져야 한다", () => {
      // GIVEN & WHEN & THEN
      expect(() => new Order("enterprise")).toThrow(InvalidOrderError);
    });

    it("GIVEN InvalidOrderError WHEN 확인 THEN statusCode 400이어야 한다", () => {
      // GIVEN & WHEN
      try {
        new Order("nonexistent");
        fail("should have thrown");
      } catch (e) {
        // THEN
        expect(e).toBeInstanceOf(InvalidOrderError);
        expect((e as InvalidOrderError).statusCode).toBe(400);
        expect((e as InvalidOrderError).name).toBe("InvalidOrderError");
      }
    });
  });

  describe("readonly 불변성", () => {
    it("GIVEN 생성된 Order WHEN 프로퍼티 접근 THEN 모든 필드가 존재해야 한다", () => {
      // GIVEN & WHEN
      const order = new Order("pro");

      // THEN
      expect(order).toHaveProperty("orderId");
      expect(order).toHaveProperty("planId");
      expect(order).toHaveProperty("planName");
      expect(order).toHaveProperty("amount");
      expect(order).toHaveProperty("currency");
      expect(order).toHaveProperty("orderName");
    });
  });
});
