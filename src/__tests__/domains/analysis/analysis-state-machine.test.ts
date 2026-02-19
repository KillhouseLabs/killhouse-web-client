/**
 * Analysis State Machine Tests
 *
 * 분석 상태 머신 테스트
 * - 유효한 상태 전환 검증
 * - 무효한 상태 전환 검증
 * - 터미널 상태 감지
 * - 터미널 간 전환 허용
 * - 상태 → 단계명 매핑
 */

import {
  canTransition,
  isTerminalStatus,
  mapStatusToStep,
  type AnalysisStatus,
} from "@/domains/analysis/model/analysis-state-machine";

describe("Analysis State Machine", () => {
  describe("canTransition", () => {
    describe("유효한 전환", () => {
      it("GIVEN PENDING 상태 WHEN CLONING으로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("PENDING", "CLONING")).toBe(true);
      });

      it("GIVEN PENDING 상태 WHEN FAILED로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("PENDING", "FAILED")).toBe(true);
      });

      it("GIVEN PENDING 상태 WHEN CANCELLED로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("PENDING", "CANCELLED")).toBe(true);
      });

      it("GIVEN CLONING 상태 WHEN STATIC_ANALYSIS로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("CLONING", "STATIC_ANALYSIS")).toBe(true);
      });

      it("GIVEN CLONING 상태 WHEN FAILED로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("CLONING", "FAILED")).toBe(true);
      });

      it("GIVEN STATIC_ANALYSIS 상태 WHEN BUILDING으로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("STATIC_ANALYSIS", "BUILDING")).toBe(true);
      });

      it("GIVEN BUILDING 상태 WHEN PENETRATION_TEST로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("BUILDING", "PENETRATION_TEST")).toBe(true);
      });

      it("GIVEN PENETRATION_TEST 상태 WHEN EXPLOIT_VERIFICATION으로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("PENETRATION_TEST", "EXPLOIT_VERIFICATION")).toBe(
          true
        );
      });

      it("GIVEN PENETRATION_TEST 상태 WHEN COMPLETED로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("PENETRATION_TEST", "COMPLETED")).toBe(true);
      });

      it("GIVEN PENETRATION_TEST 상태 WHEN COMPLETED_WITH_ERRORS로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("PENETRATION_TEST", "COMPLETED_WITH_ERRORS")).toBe(
          true
        );
      });

      it("GIVEN EXPLOIT_VERIFICATION 상태 WHEN COMPLETED로 전환 THEN 허용되어야 한다", () => {
        expect(canTransition("EXPLOIT_VERIFICATION", "COMPLETED")).toBe(true);
      });

      it("GIVEN EXPLOIT_VERIFICATION 상태 WHEN COMPLETED_WITH_ERRORS로 전환 THEN 허용되어야 한다", () => {
        expect(
          canTransition("EXPLOIT_VERIFICATION", "COMPLETED_WITH_ERRORS")
        ).toBe(true);
      });
    });

    describe("무효한 전환", () => {
      it("GIVEN PENDING 상태 WHEN STATIC_ANALYSIS로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("PENDING", "STATIC_ANALYSIS")).toBe(false);
      });

      it("GIVEN PENDING 상태 WHEN COMPLETED로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("PENDING", "COMPLETED")).toBe(false);
      });

      it("GIVEN CLONING 상태 WHEN BUILDING으로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("CLONING", "BUILDING")).toBe(false);
      });

      it("GIVEN STATIC_ANALYSIS 상태 WHEN PENETRATION_TEST로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("STATIC_ANALYSIS", "PENETRATION_TEST")).toBe(
          false
        );
      });

      it("GIVEN BUILDING 상태 WHEN COMPLETED로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("BUILDING", "COMPLETED")).toBe(false);
      });
    });

    describe("터미널 상태 전환", () => {
      it("GIVEN COMPLETED 상태 WHEN 중간 상태로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("COMPLETED", "PENDING")).toBe(false);
        expect(canTransition("COMPLETED", "CLONING")).toBe(false);
        expect(canTransition("COMPLETED", "BUILDING")).toBe(false);
      });

      it("GIVEN FAILED 상태 WHEN 중간 상태로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("FAILED", "PENDING")).toBe(false);
        expect(canTransition("FAILED", "CLONING")).toBe(false);
        expect(canTransition("FAILED", "BUILDING")).toBe(false);
      });

      it("GIVEN CANCELLED 상태 WHEN 중간 상태로 전환 THEN 거부되어야 한다", () => {
        expect(canTransition("CANCELLED", "PENDING")).toBe(false);
        expect(canTransition("CANCELLED", "CLONING")).toBe(false);
        expect(canTransition("CANCELLED", "BUILDING")).toBe(false);
      });

      it("GIVEN COMPLETED 상태 WHEN FAILED로 전환 THEN 허용되어야 한다 (터미널 간 전환)", () => {
        expect(canTransition("COMPLETED", "FAILED")).toBe(true);
      });

      it("GIVEN FAILED 상태 WHEN COMPLETED로 전환 THEN 허용되어야 한다 (터미널 간 전환)", () => {
        expect(canTransition("FAILED", "COMPLETED")).toBe(true);
      });

      it("GIVEN COMPLETED 상태 WHEN CANCELLED로 전환 THEN 허용되어야 한다 (터미널 간 전환)", () => {
        expect(canTransition("COMPLETED", "CANCELLED")).toBe(true);
      });
    });
  });

  describe("isTerminalStatus", () => {
    it("GIVEN COMPLETED 상태 THEN true를 반환해야 한다", () => {
      expect(isTerminalStatus("COMPLETED")).toBe(true);
    });

    it("GIVEN COMPLETED_WITH_ERRORS 상태 THEN true를 반환해야 한다", () => {
      expect(isTerminalStatus("COMPLETED_WITH_ERRORS")).toBe(true);
    });

    it("GIVEN FAILED 상태 THEN true를 반환해야 한다", () => {
      expect(isTerminalStatus("FAILED")).toBe(true);
    });

    it("GIVEN CANCELLED 상태 THEN true를 반환해야 한다", () => {
      expect(isTerminalStatus("CANCELLED")).toBe(true);
    });

    it("GIVEN PENDING 상태 THEN false를 반환해야 한다", () => {
      expect(isTerminalStatus("PENDING")).toBe(false);
    });

    it("GIVEN CLONING 상태 THEN false를 반환해야 한다", () => {
      expect(isTerminalStatus("CLONING")).toBe(false);
    });

    it("GIVEN STATIC_ANALYSIS 상태 THEN false를 반환해야 한다", () => {
      expect(isTerminalStatus("STATIC_ANALYSIS")).toBe(false);
    });

    it("GIVEN BUILDING 상태 THEN false를 반환해야 한다", () => {
      expect(isTerminalStatus("BUILDING")).toBe(false);
    });

    it("GIVEN PENETRATION_TEST 상태 THEN false를 반환해야 한다", () => {
      expect(isTerminalStatus("PENETRATION_TEST")).toBe(false);
    });

    it("GIVEN EXPLOIT_VERIFICATION 상태 THEN false를 반환해야 한다", () => {
      expect(isTerminalStatus("EXPLOIT_VERIFICATION")).toBe(false);
    });
  });

  describe("mapStatusToStep", () => {
    const testCases: Array<[AnalysisStatus, string]> = [
      ["PENDING", "대기"],
      ["CLONING", "저장소 클론"],
      ["STATIC_ANALYSIS", "정적 분석"],
      ["BUILDING", "빌드"],
      ["PENETRATION_TEST", "침투 테스트"],
      ["EXPLOIT_VERIFICATION", "모의 침투 검증"],
      ["COMPLETED", "완료"],
      ["COMPLETED_WITH_ERRORS", "일부 오류 완료"],
      ["FAILED", "실패"],
      ["CANCELLED", "취소"],
    ];

    testCases.forEach(([status, expectedStep]) => {
      it(`GIVEN ${status} 상태 THEN "${expectedStep}"를 반환해야 한다`, () => {
        expect(mapStatusToStep(status)).toBe(expectedStep);
      });
    });
  });
});
