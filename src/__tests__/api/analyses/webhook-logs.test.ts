/**
 * Analyses Webhook API Tests - Log Persistence
 *
 * 분석 웹훅 API 로그 저장 테스트
 * - 상태 전환 시 자동 로그 생성
 * - log_message 필드를 통한 로그 추가
 * - error 필드를 통한 에러 로그 추가
 * - 여러 웹훅 호출 간 로그 누적
 */

// Mock dependencies
jest.mock("@/domains/analysis/infra/prisma-analysis.repository", () => ({
  analysisRepository: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("@/config/env", () => ({
  serverEnv: {
    ANALYSIS_API_KEY: jest.fn().mockReturnValue("test-api-key"),
  },
}));

import { POST } from "@/app/api/analyses/webhook/route";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
import { parseAnalysisLogs } from "@/domains/analysis/model/analysis-log";

describe("Analyses Webhook API - Log Persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/analyses/webhook", () => {
    describe("상태 전환 로그", () => {
      it("GIVEN PENDING 상태 WHEN status=CLONING THEN 상태 전환 로그가 생성되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENDING",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "CLONING",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.status).toBe("CLONING");
        expect(capturedUpdateData.logs).toBeDefined();

        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        expect(logs).toHaveLength(1);
        expect(logs[0].step).toBe("저장소 클론");
        expect(logs[0].level).toBe("info");
        expect(logs[0].message).toContain("PENDING → CLONING");
      });

      it("GIVEN CLONING 상태 WHEN status=STATIC_ANALYSIS THEN 상태 전환 로그가 추가되어야 한다", async () => {
        // GIVEN
        const existingLog = JSON.stringify([
          {
            timestamp: "2024-01-01T00:00:00.000Z",
            step: "저장소 클론",
            level: "info",
            message: "상태 변경: PENDING → CLONING",
          },
        ]);

        const mockAnalysis = {
          id: "analysis-1",
          status: "CLONING",
          logs: existingLog,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "STATIC_ANALYSIS",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        expect(logs).toHaveLength(2);
        expect(logs[0].message).toContain("PENDING → CLONING");
        expect(logs[1].message).toContain("CLONING → STATIC_ANALYSIS");
        expect(logs[1].step).toBe("정적 분석");
      });
    });

    describe("log_message 필드", () => {
      it("GIVEN log_message 제공 WHEN 웹훅 호출 THEN 커스텀 로그가 추가되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "CLONING",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "STATIC_ANALYSIS",
            log_message: "정적 분석 도구 실행 중...",
            log_level: "info",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        // 상태 전환 로그 + 커스텀 로그 = 2개
        expect(logs.length).toBeGreaterThanOrEqual(2);
        const customLog = logs.find(
          (log) => log.message === "정적 분석 도구 실행 중..."
        );
        expect(customLog).toBeDefined();
        expect(customLog?.level).toBe("info");
      });

      it("GIVEN log_level 미제공 WHEN log_message만 제공 THEN 기본 info 레벨로 저장되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            log_message: "빌드 진행 중...",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        const customLog = logs.find((log) => log.message === "빌드 진행 중...");
        expect(customLog).toBeDefined();
        expect(customLog?.level).toBe("info");
      });

      it("GIVEN log_level=warn WHEN log_message 제공 THEN warn 레벨로 저장되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENETRATION_TEST",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            log_message: "일부 취약점 검증 실패",
            log_level: "warn",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        const customLog = logs.find(
          (log) => log.message === "일부 취약점 검증 실패"
        );
        expect(customLog).toBeDefined();
        expect(customLog?.level).toBe("warn");
      });
    });

    describe("error 필드", () => {
      it("GIVEN error 제공 WHEN 웹훅 호출 THEN error 레벨 로그가 추가되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "FAILED",
            error: "Docker 빌드 실패: Dockerfile not found",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        const errorLog = logs.find(
          (log) => log.message === "Docker 빌드 실패: Dockerfile not found"
        );
        expect(errorLog).toBeDefined();
        expect(errorLog?.level).toBe("error");
      });

      it("GIVEN status=FAILED와 error 제공 WHEN 웹훅 호출 THEN 상태 전환 로그와 에러 로그가 모두 생성되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "FAILED",
            error: "빌드 타임아웃",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        expect(logs.length).toBeGreaterThanOrEqual(2);

        const transitionLog = logs.find((log) =>
          log.message.includes("BUILDING → FAILED")
        );
        expect(transitionLog).toBeDefined();

        const errorLog = logs.find((log) => log.message === "빌드 타임아웃");
        expect(errorLog).toBeDefined();
        expect(errorLog?.level).toBe("error");
      });
    });

    describe("로그 누적", () => {
      it("GIVEN 여러 웹훅 호출 WHEN 순차적으로 상태 업데이트 THEN 로그가 누적되어야 한다", async () => {
        // GIVEN - 첫 번째 호출
        const mockAnalysis1 = {
          id: "analysis-1",
          status: "PENDING",
          logs: null,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValueOnce(
          mockAnalysis1
        );

        let firstCallLogs: string | null = null;
        (analysisRepository.update as jest.Mock).mockImplementationOnce(
          (_id: string, data: any) => {
            firstCallLogs = data.logs;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request1 = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "CLONING",
            log_message: "저장소 클론 시작",
          }),
        });

        // WHEN - 첫 번째 호출
        await POST(request1);

        // GIVEN - 두 번째 호출
        const mockAnalysis2 = {
          id: "analysis-1",
          status: "CLONING",
          logs: firstCallLogs,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValueOnce(
          mockAnalysis2
        );

        let secondCallLogs: string | null = null;
        (analysisRepository.update as jest.Mock).mockImplementationOnce(
          (_id: string, data: any) => {
            secondCallLogs = data.logs;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request2 = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "STATIC_ANALYSIS",
            log_message: "정적 분석 시작",
          }),
        });

        // WHEN - 두 번째 호출
        await POST(request2);

        // THEN
        const logsAfterFirstCall = parseAnalysisLogs(firstCallLogs);
        expect(logsAfterFirstCall.length).toBeGreaterThanOrEqual(2); // 상태 전환 + 커스텀 로그

        const logsAfterSecondCall = parseAnalysisLogs(secondCallLogs);
        expect(logsAfterSecondCall.length).toBeGreaterThan(
          logsAfterFirstCall.length
        );

        // 첫 번째 호출의 로그가 유지되어야 함
        expect(
          logsAfterSecondCall.some((log) => log.message === "저장소 클론 시작")
        ).toBe(true);
        // 두 번째 호출의 로그가 추가되어야 함
        expect(
          logsAfterSecondCall.some((log) => log.message === "정적 분석 시작")
        ).toBe(true);
      });

      it("GIVEN 상태 변경 없이 log_message만 제공 WHEN 웹훅 호출 THEN 로그만 추가되어야 한다", async () => {
        // GIVEN
        const existingLogs = JSON.stringify([
          {
            timestamp: "2024-01-01T00:00:00.000Z",
            step: "빌드",
            level: "info",
            message: "상태 변경: STATIC_ANALYSIS → BUILDING",
          },
        ]);

        const mockAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
          logs: existingLogs,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (analysisRepository.update as jest.Mock).mockImplementation(
          (_id: string, data: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              logs: data.logs,
            });
          }
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            log_message: "의존성 설치 완료",
          }),
        });

        // WHEN
        const response = await POST(request);

        // THEN
        expect(response.status).toBe(200);
        const logs = parseAnalysisLogs(capturedUpdateData.logs);
        expect(logs).toHaveLength(2); // 기존 1개 + 새 로그 1개
        expect(logs[0].message).toContain("STATIC_ANALYSIS → BUILDING");
        expect(logs[1].message).toBe("의존성 설치 완료");
        // 상태는 변경되지 않아야 함
        expect(capturedUpdateData.status).toBe("BUILDING");
      });
    });

    describe("기존 기능 호환성", () => {
      it("GIVEN 로그 관련 필드 없이 WHEN 기존 방식으로 호출 THEN 정상 작동해야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENETRATION_TEST",
          logs: null,
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
        };
        (analysisRepository.findById as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        (analysisRepository.update as jest.Mock).mockResolvedValue({
          id: "analysis-1",
          status: "COMPLETED",
        });

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "COMPLETED",
            vulnerabilities_found: 5,
            critical_count: 1,
            high_count: 2,
            medium_count: 1,
            low_count: 1,
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(analysisRepository.update).toHaveBeenCalledWith(
          "analysis-1",
          expect.objectContaining({
            status: "COMPLETED",
            vulnerabilitiesFound: 5,
            criticalCount: 1,
            highCount: 2,
            mediumCount: 1,
            lowCount: 1,
          })
        );
      });
    });
  });
});
