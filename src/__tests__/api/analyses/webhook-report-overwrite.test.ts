/**
 * Analyses Webhook API Tests - Report Overwrite Protection
 *
 * 분석 웹훅 API 리포트 덮어쓰기 방지 테스트
 * - 스킵된 리포트로 기존 리포트 덮어쓰기 방지
 * - 빈 리포트로 기존 리포트 덮어쓰기 방지
 * - 새 리포트 저장 허용
 * - 유효한 리포트로 업데이트 허용
 */

// Mock dependencies
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    analysis: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/config/env", () => ({
  serverEnv: {
    ANALYSIS_API_KEY: jest.fn().mockReturnValue("test-api-key"),
  },
}));

import { POST } from "@/app/api/analyses/webhook/route";
import { prisma } from "@/infrastructure/database/prisma";

describe("Analyses Webhook API - Report Overwrite Protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/analyses/webhook", () => {
    describe("SAST 리포트 덮어쓰기 방지", () => {
      it("GIVEN SAST 리포트 저장됨 WHEN 빈 SAST 리포트(step_result=skipped) 콜백 도착 THEN 기존 SAST 리포트가 유지되어야 한다", async () => {
        // GIVEN
        const existingSastReport = JSON.stringify({
          tool: "semgrep",
          findings: [
            {
              severity: "HIGH",
              title: "SQL Injection",
              description: "Potential SQL injection vulnerability",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        });

        const mockAnalysis = {
          id: "analysis-1",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: existingSastReport,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-1",
              status: data.status,
              staticAnalysisReport:
                data.staticAnalysisReport || existingSastReport,
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
            static_analysis_report: {
              tool: "semgrep",
              findings: [],
              total: 0,
              step_result: { status: "skipped" },
            },
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBeUndefined();
      });

      it("GIVEN SAST 리포트 저장됨 WHEN 빈 SAST 리포트(findings=0) 콜백 도착 THEN 기존 SAST 리포트가 유지되어야 한다", async () => {
        // GIVEN
        const existingSastReport = JSON.stringify({
          tool: "trivy",
          findings: [
            {
              severity: "CRITICAL",
              title: "Outdated dependency",
              description: "Using vulnerable library version",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        });

        const mockAnalysis = {
          id: "analysis-2",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: existingSastReport,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-2",
              status: data.status,
              staticAnalysisReport:
                data.staticAnalysisReport || existingSastReport,
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
            analysis_id: "analysis-2",
            static_analysis_report: {
              tool: "trivy",
              findings: [],
              total: 0,
              step_result: { status: "success" },
            },
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBeUndefined();
      });
    });

    describe("DAST 리포트 덮어쓰기 방지", () => {
      it("GIVEN DAST 리포트 저장됨 WHEN 빈 DAST 리포트(step_result=skipped) 콜백 도착 THEN 기존 DAST 리포트가 유지되어야 한다", async () => {
        // GIVEN
        const existingDastReport = JSON.stringify({
          tool: "exploit_agent",
          findings: [
            {
              severity: "HIGH",
              title: "XSS Vulnerability",
              description: "Reflected XSS in search parameter",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        });

        const mockAnalysis = {
          id: "analysis-3",
          status: "PENETRATION_TEST",
          logs: null,
          staticAnalysisReport: null,
          penetrationTestReport: existingDastReport,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-3",
              status: data.status,
              penetrationTestReport:
                data.penetrationTestReport || existingDastReport,
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
            analysis_id: "analysis-3",
            penetration_test_report: {
              tool: "exploit_agent",
              findings: [],
              total: 0,
              step_result: { status: "skipped" },
            },
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.penetrationTestReport).toBeUndefined();
      });
    });

    describe("새 리포트 저장 허용", () => {
      it("GIVEN 기존 리포트 없음 WHEN 새 SAST 리포트 콜백 도착 THEN 리포트가 저장되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-4",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: null,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-4",
              status: data.status,
              staticAnalysisReport: data.staticAnalysisReport,
            });
          }
        );

        const newSastReport = {
          tool: "semgrep",
          findings: [
            {
              severity: "MEDIUM",
              title: "Hardcoded Secret",
              description: "API key found in source code",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        };

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-4",
            static_analysis_report: newSastReport,
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBe(
          JSON.stringify(newSastReport)
        );
      });

      it("GIVEN 기존 SAST 리포트 없음 WHEN 빈 SAST 리포트(step_result=skipped) 콜백 도착 THEN 리포트가 저장되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-5",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: null,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-5",
              status: data.status,
              staticAnalysisReport: data.staticAnalysisReport,
            });
          }
        );

        const skippedReport = {
          tool: "semgrep",
          findings: [],
          total: 0,
          step_result: { status: "skipped" },
        };

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-5",
            static_analysis_report: skippedReport,
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBe(
          JSON.stringify(skippedReport)
        );
      });
    });

    describe("리포트 업데이트 허용", () => {
      it("GIVEN SAST 리포트 저장됨 WHEN 새 SAST 리포트(findings 있음) 콜백 도착 THEN 리포트가 업데이트되어야 한다", async () => {
        // GIVEN
        const existingSastReport = JSON.stringify({
          tool: "semgrep",
          findings: [
            {
              severity: "LOW",
              title: "Insecure Random",
              description: "Using weak random generator",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        });

        const mockAnalysis = {
          id: "analysis-6",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: existingSastReport,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-6",
              status: data.status,
              staticAnalysisReport:
                data.staticAnalysisReport || existingSastReport,
            });
          }
        );

        const newSastReport = {
          tool: "semgrep",
          findings: [
            {
              severity: "HIGH",
              title: "Command Injection",
              description: "Unsafe command execution",
            },
            {
              severity: "MEDIUM",
              title: "Path Traversal",
              description: "Unvalidated file path",
            },
          ],
          total: 2,
          step_result: { status: "success" },
        };

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-6",
            static_analysis_report: newSastReport,
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBe(
          JSON.stringify(newSastReport)
        );
      });

      it("GIVEN 빈 SAST 리포트 저장됨 WHEN 새 SAST 리포트(findings 있음) 콜백 도착 THEN 리포트가 업데이트되어야 한다", async () => {
        // GIVEN
        const existingEmptyReport = JSON.stringify({
          tool: "semgrep",
          findings: [],
          total: 0,
          step_result: { status: "success" },
        });

        const mockAnalysis = {
          id: "analysis-7",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: existingEmptyReport,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-7",
              status: data.status,
              staticAnalysisReport:
                data.staticAnalysisReport || existingEmptyReport,
            });
          }
        );

        const newSastReport = {
          tool: "semgrep",
          findings: [
            {
              severity: "CRITICAL",
              title: "Authentication Bypass",
              description: "Missing authentication check",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        };

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-7",
            static_analysis_report: newSastReport,
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBe(
          JSON.stringify(newSastReport)
        );
      });
    });

    describe("문자열 형식 리포트 처리", () => {
      it("GIVEN 문자열 형식 SAST 리포트 저장됨 WHEN 빈 SAST 리포트(step_result=skipped) 콜백 도착 THEN 기존 SAST 리포트가 유지되어야 한다", async () => {
        // GIVEN
        const existingSastReport = JSON.stringify({
          tool: "semgrep",
          findings: [
            {
              severity: "HIGH",
              title: "SSRF Vulnerability",
              description: "Server-side request forgery risk",
            },
          ],
          total: 1,
          step_result: { status: "success" },
        });

        const mockAnalysis = {
          id: "analysis-8",
          status: "STATIC_ANALYSIS",
          logs: null,
          staticAnalysisReport: existingSastReport,
          penetrationTestReport: null,
        };

        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        let capturedUpdateData: any = null;
        (prisma.analysis.update as jest.Mock).mockImplementation(
          ({ data }: any) => {
            capturedUpdateData = data;
            return Promise.resolve({
              id: "analysis-8",
              status: data.status,
              staticAnalysisReport:
                data.staticAnalysisReport || existingSastReport,
            });
          }
        );

        const skippedReportString = JSON.stringify({
          tool: "semgrep",
          findings: [],
          total: 0,
          step_result: { status: "skipped" },
        });

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-8",
            static_analysis_report: skippedReportString,
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(capturedUpdateData.staticAnalysisReport).toBeUndefined();
      });
    });
  });
});
