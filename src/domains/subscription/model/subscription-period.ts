/**
 * SubscriptionPeriod — 구독 기간 Value Object
 *
 * 구독 기간(1개월) 계산을 constructor에서 수행한다.
 * 기간 규칙을 도메인 모델에 캡슐화.
 */

export class SubscriptionPeriod {
  readonly start: Date;
  readonly end: Date;

  constructor(startFrom?: Date) {
    this.start = startFrom ?? new Date();
    this.end = new Date(this.start);
    this.end.setMonth(this.end.getMonth() + 1);
  }
}
