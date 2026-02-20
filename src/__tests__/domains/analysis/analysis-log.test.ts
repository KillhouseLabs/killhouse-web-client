/**
 * Analysis Log Tests
 *
 * 분석 로그 유틸리티 테스트
 * - parseAnalysisLogs: JSON 파싱
 * - appendLog: 로그 추가
 * - groupLogsByStep: 단계별 그룹화
 */

import {
  parseAnalysisLogs,
  appendLog,
  groupLogsByStep,
  type AnalysisLogEntry,
} from "@/domains/analysis/model/analysis-log";

describe("Analysis Log Utilities", () => {
  describe("parseAnalysisLogs", () => {
    it("GIVEN null WHEN 파싱 THEN 빈 배열을 반환해야 한다", () => {
      expect(parseAnalysisLogs(null)).toEqual([]);
    });

    it("GIVEN 빈 문자열 WHEN 파싱 THEN 빈 배열을 반환해야 한다", () => {
      expect(parseAnalysisLogs("")).toEqual([]);
    });

    it("GIVEN 유효한 JSON WHEN 파싱 THEN 로그 배열을 반환해야 한다", () => {
      const logsJson = JSON.stringify([
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "저장소 클론",
          level: "info",
          message: "클론 시작",
        },
        {
          timestamp: "2024-01-01T00:01:00.000Z",
          step: "저장소 클론",
          level: "success",
          message: "클론 완료",
        },
      ]);

      const logs = parseAnalysisLogs(logsJson);

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual({
        timestamp: "2024-01-01T00:00:00.000Z",
        step: "저장소 클론",
        level: "info",
        message: "클론 시작",
      });
      expect(logs[1]).toEqual({
        timestamp: "2024-01-01T00:01:00.000Z",
        step: "저장소 클론",
        level: "success",
        message: "클론 완료",
      });
    });

    it("GIVEN 잘못된 JSON WHEN 파싱 THEN 빈 배열을 반환해야 한다", () => {
      expect(parseAnalysisLogs("invalid json")).toEqual([]);
      expect(parseAnalysisLogs("{broken")).toEqual([]);
      expect(parseAnalysisLogs("[incomplete")).toEqual([]);
    });
  });

  describe("appendLog", () => {
    it("GIVEN null 로그 WHEN 로그 추가 THEN 새 로그가 포함된 JSON을 반환해야 한다", () => {
      const newEntry: AnalysisLogEntry = {
        timestamp: "2024-01-01T00:00:00.000Z",
        step: "저장소 클론",
        level: "info",
        message: "클론 시작",
      };

      const result = appendLog(null, newEntry);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(newEntry);
    });

    it("GIVEN 기존 로그 WHEN 로그 추가 THEN 기존 로그와 새 로그가 모두 포함되어야 한다", () => {
      const existingLogs = JSON.stringify([
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "저장소 클론",
          level: "info",
          message: "클론 시작",
        },
      ]);

      const newEntry: AnalysisLogEntry = {
        timestamp: "2024-01-01T00:01:00.000Z",
        step: "저장소 클론",
        level: "success",
        message: "클론 완료",
      };

      const result = appendLog(existingLogs, newEntry);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe("클론 시작");
      expect(parsed[1].message).toBe("클론 완료");
    });

    it("GIVEN 여러 단계의 로그 WHEN 새 단계 로그 추가 THEN 모든 로그가 순서대로 포함되어야 한다", () => {
      const existingLogs = JSON.stringify([
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "저장소 클론",
          level: "info",
          message: "클론 시작",
        },
        {
          timestamp: "2024-01-01T00:01:00.000Z",
          step: "저장소 클론",
          level: "success",
          message: "클론 완료",
        },
      ]);

      const newEntry: AnalysisLogEntry = {
        timestamp: "2024-01-01T00:02:00.000Z",
        step: "정적 분석",
        level: "info",
        message: "정적 분석 시작",
      };

      const result = appendLog(existingLogs, newEntry);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(3);
      expect(parsed[2].step).toBe("정적 분석");
    });

    it("GIVEN error 레벨 로그 WHEN 추가 THEN error 레벨이 유지되어야 한다", () => {
      const errorEntry: AnalysisLogEntry = {
        timestamp: "2024-01-01T00:00:00.000Z",
        step: "빌드",
        level: "error",
        message: "빌드 실패",
      };

      const result = appendLog(null, errorEntry);
      const parsed = JSON.parse(result);

      expect(parsed[0].level).toBe("error");
    });
  });

  describe("groupLogsByStep", () => {
    it("GIVEN 빈 로그 배열 WHEN 그룹화 THEN 빈 Map을 반환해야 한다", () => {
      const grouped = groupLogsByStep([]);
      expect(grouped.size).toBe(0);
    });

    it("GIVEN 단일 단계의 로그 WHEN 그룹화 THEN 단일 그룹을 반환해야 한다", () => {
      const logs: AnalysisLogEntry[] = [
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "저장소 클론",
          level: "info",
          message: "클론 시작",
        },
        {
          timestamp: "2024-01-01T00:01:00.000Z",
          step: "저장소 클론",
          level: "success",
          message: "클론 완료",
        },
      ];

      const grouped = groupLogsByStep(logs);

      expect(grouped.size).toBe(1);
      expect(grouped.has("저장소 클론")).toBe(true);
      expect(grouped.get("저장소 클론")).toHaveLength(2);
    });

    it("GIVEN 여러 단계의 로그 WHEN 그룹화 THEN 단계별로 그룹화되어야 한다", () => {
      const logs: AnalysisLogEntry[] = [
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "저장소 클론",
          level: "info",
          message: "클론 시작",
        },
        {
          timestamp: "2024-01-01T00:01:00.000Z",
          step: "저장소 클론",
          level: "success",
          message: "클론 완료",
        },
        {
          timestamp: "2024-01-01T00:02:00.000Z",
          step: "정적 분석",
          level: "info",
          message: "정적 분석 시작",
        },
        {
          timestamp: "2024-01-01T00:03:00.000Z",
          step: "정적 분석",
          level: "success",
          message: "정적 분석 완료",
        },
        {
          timestamp: "2024-01-01T00:04:00.000Z",
          step: "빌드",
          level: "info",
          message: "빌드 시작",
        },
      ];

      const grouped = groupLogsByStep(logs);

      expect(grouped.size).toBe(3);
      expect(grouped.get("저장소 클론")).toHaveLength(2);
      expect(grouped.get("정적 분석")).toHaveLength(2);
      expect(grouped.get("빌드")).toHaveLength(1);
    });

    it("GIVEN 여러 단계의 로그 WHEN 그룹화 THEN 각 그룹의 로그가 순서대로 유지되어야 한다", () => {
      const logs: AnalysisLogEntry[] = [
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "저장소 클론",
          level: "info",
          message: "클론 시작",
        },
        {
          timestamp: "2024-01-01T00:01:00.000Z",
          step: "저장소 클론",
          level: "success",
          message: "클론 완료",
        },
        {
          timestamp: "2024-01-01T00:02:00.000Z",
          step: "정적 분석",
          level: "info",
          message: "정적 분석 시작",
        },
      ];

      const grouped = groupLogsByStep(logs);
      const cloningLogs = grouped.get("저장소 클론")!;

      expect(cloningLogs[0].message).toBe("클론 시작");
      expect(cloningLogs[1].message).toBe("클론 완료");
    });

    it("GIVEN error 포함 로그 WHEN 그룹화 THEN error 로그도 올바른 그룹에 포함되어야 한다", () => {
      const logs: AnalysisLogEntry[] = [
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          step: "빌드",
          level: "info",
          message: "빌드 시작",
        },
        {
          timestamp: "2024-01-01T00:01:00.000Z",
          step: "빌드",
          level: "error",
          message: "빌드 실패",
        },
      ];

      const grouped = groupLogsByStep(logs);
      const buildLogs = grouped.get("빌드")!;

      expect(buildLogs).toHaveLength(2);
      expect(buildLogs[1].level).toBe("error");
      expect(buildLogs[1].message).toBe("빌드 실패");
    });
  });
});
