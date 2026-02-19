/**
 * Circuit Breaker Tests
 *
 * Circuit Breaker 패턴 구현 테스트
 * RED phase TDD - implementation doesn't exist yet
 */

import { CircuitBreaker } from "@/lib/circuit-breaker";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;
  let originalDateNow: () => number;

  beforeEach(() => {
    // Date.now() 모킹을 위한 원본 저장
    originalDateNow = Date.now;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Date.now() 원복
    Date.now = originalDateNow;
  });

  describe("초기 상태", () => {
    it("GIVEN 기본 설정 WHEN CircuitBreaker 생성 THEN CLOSED 상태로 시작", () => {
      // GIVEN & WHEN
      circuitBreaker = new CircuitBreaker();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
    });

    it("GIVEN 기본 설정 WHEN CircuitBreaker 생성 THEN canExecute는 true 반환", () => {
      // GIVEN & WHEN
      circuitBreaker = new CircuitBreaker();

      // THEN
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it("GIVEN 커스텀 threshold와 resetTimeMs WHEN CircuitBreaker 생성 THEN 설정값이 적용됨", () => {
      // GIVEN
      const threshold = 5;
      const resetTimeMs = 60000;

      // WHEN
      circuitBreaker = new CircuitBreaker(threshold, resetTimeMs);

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe("CLOSED 상태 동작", () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 300000);
    });

    it("GIVEN CLOSED 상태 WHEN onSuccess 호출 THEN CLOSED 상태 유지", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      circuitBreaker.onSuccess();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
    });

    it("GIVEN CLOSED 상태 WHEN onSuccess 호출 THEN canExecute는 true 반환", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      circuitBreaker.onSuccess();

      // THEN
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it("GIVEN CLOSED 상태 WHEN 1번 실패 THEN CLOSED 상태 유지", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      circuitBreaker.onFailure();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it("GIVEN CLOSED 상태 WHEN 2번 실패 THEN CLOSED 상태 유지", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it("GIVEN CLOSED 상태 WHEN 실패 후 성공 THEN 실패 카운트가 리셋됨", () => {
      // GIVEN
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // WHEN
      circuitBreaker.onSuccess();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe("OPEN 상태 전이", () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 300000);
    });

    it("GIVEN CLOSED 상태 WHEN threshold(3)만큼 연속 실패 THEN OPEN 상태로 전이", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // THEN
      expect(circuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN OPEN 상태 WHEN canExecute 호출 THEN false 반환", () => {
      // GIVEN
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(false);
    });

    it("GIVEN OPEN 상태 WHEN resetTimeMs 이전에 canExecute 호출 THEN false 반환", () => {
      // GIVEN
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // WHEN - resetTimeMs(300000) 이전 시점
      Date.now = jest.fn(() => now + 200000);
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(false);
      expect(circuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN OPEN 상태 WHEN resetTimeMs 경과 후 canExecute 호출 THEN HALF_OPEN으로 전이", () => {
      // GIVEN
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN - resetTimeMs(300000) 경과
      Date.now = jest.fn(() => now + 300000);
      circuitBreaker.canExecute();

      // THEN
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");
    });

    it("GIVEN OPEN 상태 WHEN resetTimeMs 경과 후 canExecute 호출 THEN true 반환", () => {
      // GIVEN
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // WHEN - resetTimeMs(300000) 경과
      Date.now = jest.fn(() => now + 300000);
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(true);
    });
  });

  describe("HALF_OPEN 상태 동작", () => {
    beforeEach(() => {
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker = new CircuitBreaker(3, 300000);

      // OPEN 상태로 전이
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // HALF_OPEN으로 전이
      Date.now = jest.fn(() => now + 300000);
      circuitBreaker.canExecute();
    });

    it("GIVEN HALF_OPEN 상태 WHEN canExecute 호출 THEN true 반환", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      // WHEN
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(true);
    });

    it("GIVEN HALF_OPEN 상태 WHEN onSuccess 호출 THEN CLOSED 상태로 전이", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      // WHEN
      circuitBreaker.onSuccess();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
    });

    it("GIVEN HALF_OPEN 상태 WHEN onSuccess 후 canExecute 호출 THEN true 반환", () => {
      // GIVEN
      circuitBreaker.onSuccess();
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(true);
    });

    it("GIVEN HALF_OPEN 상태 WHEN onFailure 호출 THEN OPEN 상태로 전이", () => {
      // GIVEN
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      // WHEN
      circuitBreaker.onFailure();

      // THEN
      expect(circuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN HALF_OPEN 상태 WHEN onFailure 후 canExecute 호출 THEN false 반환", () => {
      // GIVEN
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(false);
    });
  });

  describe("실패 카운트 리셋", () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 300000);
    });

    it("GIVEN 2번 실패 WHEN onSuccess 호출 THEN 실패 카운트 리셋되어 다시 3번 실패해야 OPEN", () => {
      // GIVEN
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // WHEN
      circuitBreaker.onSuccess();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      // THEN - 아직 2번만 실패했으므로 CLOSED 유지
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);

      // WHEN - 한 번 더 실패
      circuitBreaker.onFailure();

      // THEN - 이제 OPEN으로 전이
      expect(circuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN HALF_OPEN에서 성공 WHEN CLOSED 전이 후 실패 카운트 리셋 확인 THEN 다시 threshold만큼 실패해야 OPEN", () => {
      // GIVEN - HALF_OPEN으로 전이
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      Date.now = jest.fn(() => now + 300000);
      circuitBreaker.canExecute();
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      // WHEN - CLOSED로 전이
      circuitBreaker.onSuccess();
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // THEN - 실패 카운트가 리셋되어 다시 3번 실패해야 OPEN
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("CLOSED");

      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN 다양한 threshold 값 WHEN 해당 threshold만큼 실패 THEN OPEN 전이", () => {
      // GIVEN
      const customCircuitBreaker = new CircuitBreaker(5, 300000);

      // WHEN
      customCircuitBreaker.onFailure();
      customCircuitBreaker.onFailure();
      customCircuitBreaker.onFailure();
      customCircuitBreaker.onFailure();
      expect(customCircuitBreaker.getState()).toBe("CLOSED");

      customCircuitBreaker.onFailure();

      // THEN
      expect(customCircuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN threshold=1 WHEN 1번 실패 THEN 즉시 OPEN", () => {
      // GIVEN
      const fastFailCircuitBreaker = new CircuitBreaker(1, 300000);

      // WHEN
      fastFailCircuitBreaker.onFailure();

      // THEN
      expect(fastFailCircuitBreaker.getState()).toBe("OPEN");
      expect(fastFailCircuitBreaker.canExecute()).toBe(false);
    });
  });

  describe("엣지 케이스", () => {
    it("GIVEN OPEN 상태 WHEN resetTimeMs 정확히 경과 THEN HALF_OPEN으로 전이", () => {
      // GIVEN
      const now = 1000000;
      const resetTimeMs = 300000;
      Date.now = jest.fn(() => now);

      circuitBreaker = new CircuitBreaker(3, resetTimeMs);
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN - 정확히 resetTimeMs만큼 경과
      Date.now = jest.fn(() => now + resetTimeMs);
      circuitBreaker.canExecute();

      // THEN
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");
    });

    it("GIVEN OPEN 상태 WHEN resetTimeMs보다 1ms 적게 경과 THEN OPEN 상태 유지", () => {
      // GIVEN
      const now = 1000000;
      const resetTimeMs = 300000;
      Date.now = jest.fn(() => now);

      circuitBreaker = new CircuitBreaker(3, resetTimeMs);
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN - resetTimeMs보다 1ms 적게 경과
      Date.now = jest.fn(() => now + resetTimeMs - 1);
      const result = circuitBreaker.canExecute();

      // THEN
      expect(result).toBe(false);
      expect(circuitBreaker.getState()).toBe("OPEN");
    });

    it("GIVEN CLOSED 상태 WHEN 성공만 여러 번 호출 THEN CLOSED 상태 유지", () => {
      // GIVEN
      circuitBreaker = new CircuitBreaker(3, 300000);

      // WHEN
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it("GIVEN HALF_OPEN 상태 WHEN 여러 번 성공 호출 THEN CLOSED 상태 유지", () => {
      // GIVEN
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker = new CircuitBreaker(3, 300000);
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();

      Date.now = jest.fn(() => now + 300000);
      circuitBreaker.canExecute();
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      // WHEN
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe("복합 시나리오", () => {
    it("GIVEN 정상 운영 WHEN 간헐적 실패 발생 THEN CLOSED 상태 유지", () => {
      // GIVEN
      circuitBreaker = new CircuitBreaker(3, 300000);

      // WHEN - 성공과 실패가 섞여있지만 연속 실패가 threshold 미만
      circuitBreaker.onSuccess();
      circuitBreaker.onFailure();
      circuitBreaker.onSuccess();
      circuitBreaker.onFailure();
      circuitBreaker.onSuccess();
      circuitBreaker.onFailure();
      circuitBreaker.onSuccess();

      // THEN
      expect(circuitBreaker.getState()).toBe("CLOSED");
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it("GIVEN OPEN → HALF_OPEN 전이 WHEN 여러 번 실패 THEN 다시 OPEN", () => {
      // GIVEN
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker = new CircuitBreaker(3, 300000);
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN - HALF_OPEN으로 전이 후 실패
      Date.now = jest.fn(() => now + 300000);
      circuitBreaker.canExecute();
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      circuitBreaker.onFailure();

      // THEN
      expect(circuitBreaker.getState()).toBe("OPEN");
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it("GIVEN OPEN → HALF_OPEN → CLOSED WHEN 완전 복구 시나리오 THEN 정상 동작", () => {
      // GIVEN
      const now = 1000000;
      Date.now = jest.fn(() => now);

      circuitBreaker = new CircuitBreaker(3, 300000);

      // OPEN 상태로 전이
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      circuitBreaker.onFailure();
      expect(circuitBreaker.getState()).toBe("OPEN");

      // WHEN - HALF_OPEN으로 전이
      Date.now = jest.fn(() => now + 300000);
      circuitBreaker.canExecute();
      expect(circuitBreaker.getState()).toBe("HALF_OPEN");

      // WHEN - CLOSED로 복구
      circuitBreaker.onSuccess();
      expect(circuitBreaker.getState()).toBe("CLOSED");

      // THEN - 정상 동작 확인
      expect(circuitBreaker.canExecute()).toBe(true);
      circuitBreaker.onSuccess();
      circuitBreaker.onSuccess();
      expect(circuitBreaker.getState()).toBe("CLOSED");
    });
  });
});
