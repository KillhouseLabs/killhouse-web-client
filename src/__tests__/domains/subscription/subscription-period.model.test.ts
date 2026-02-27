/**
 * SubscriptionPeriod Value Object Tests
 *
 * 구독 기간(1개월) 계산이 constructor에서 수행되는지 검증
 */

import { SubscriptionPeriod } from "@/domains/subscription/model/subscription-period";

describe("SubscriptionPeriod Value Object", () => {
  describe("기본 생성 (현재 시각 기준)", () => {
    it("GIVEN startFrom 미전달 WHEN 생성 THEN start가 현재 시각이어야 한다", () => {
      // GIVEN
      const before = new Date();

      // WHEN
      const period = new SubscriptionPeriod();

      // THEN
      const after = new Date();
      expect(period.start.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(period.start.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("GIVEN startFrom 미전달 WHEN 생성 THEN end가 start + 1개월이어야 한다", () => {
      // GIVEN & WHEN
      const period = new SubscriptionPeriod();

      // THEN
      const expectedEnd = new Date(period.start);
      expectedEnd.setMonth(expectedEnd.getMonth() + 1);
      expect(period.end.getTime()).toBe(expectedEnd.getTime());
    });
  });

  describe("특정 날짜 기준 생성", () => {
    it("GIVEN 1월 15일 WHEN 생성 THEN end가 2월 15일이어야 한다", () => {
      // GIVEN
      const start = new Date("2025-01-15T00:00:00Z");

      // WHEN
      const period = new SubscriptionPeriod(start);

      // THEN
      expect(period.start).toEqual(start);
      expect(period.end).toEqual(new Date("2025-02-15T00:00:00Z"));
    });

    it("GIVEN 1월 31일 WHEN 생성 THEN end가 JS Date.setMonth 기본 동작을 따라야 한다", () => {
      // GIVEN — JS Date.setMonth(1) on Jan 31 → Mar 3 (Feb 28 + 3일 overflow)
      const start = new Date("2025-01-31T00:00:00Z");

      // WHEN
      const period = new SubscriptionPeriod(start);

      // THEN
      const expected = new Date("2025-01-31T00:00:00Z");
      expected.setMonth(expected.getMonth() + 1);
      expect(period.end).toEqual(expected);
    });

    it("GIVEN 12월 1일 WHEN 생성 THEN end가 다음해 1월 1일이어야 한다", () => {
      // GIVEN
      const start = new Date("2025-12-01T00:00:00Z");

      // WHEN
      const period = new SubscriptionPeriod(start);

      // THEN
      expect(period.end).toEqual(new Date("2026-01-01T00:00:00Z"));
    });

    it("GIVEN 윤년 2월 29일 WHEN 생성 THEN end가 3월 29일이어야 한다", () => {
      // GIVEN
      const start = new Date("2024-02-29T00:00:00Z");

      // WHEN
      const period = new SubscriptionPeriod(start);

      // THEN
      expect(period.end).toEqual(new Date("2024-03-29T00:00:00Z"));
    });
  });

  describe("불변성", () => {
    it("GIVEN 생성된 SubscriptionPeriod WHEN start/end 확인 THEN 두 날짜가 서로 다른 객체여야 한다", () => {
      // GIVEN & WHEN
      const period = new SubscriptionPeriod(new Date("2025-01-01T00:00:00Z"));

      // THEN
      expect(period.start).not.toBe(period.end);
      expect(period.end.getTime()).toBeGreaterThan(period.start.getTime());
    });

    it("GIVEN 동일한 startFrom WHEN 두 번 생성 THEN 동일한 기간이어야 한다", () => {
      // GIVEN
      const startFrom = new Date("2025-06-15T12:00:00Z");

      // WHEN
      const period1 = new SubscriptionPeriod(startFrom);
      const period2 = new SubscriptionPeriod(startFrom);

      // THEN
      expect(period1.start.getTime()).toBe(period2.start.getTime());
      expect(period1.end.getTime()).toBe(period2.end.getTime());
    });
  });
});
