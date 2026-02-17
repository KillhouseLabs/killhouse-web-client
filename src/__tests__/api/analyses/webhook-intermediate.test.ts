/**
 * Analyses Webhook API Tests - Intermediate Status Handling
 *
 * 분석 웹훅 API 중간 상태 처리 테스트
 * - 중간 상태 업데이트 (CLONING, STATIC_ANALYSIS, BUILDING, PENETRATION_TEST)
 * - 터미널 상태 회귀 방지 (COMPLETED/FAILED/CANCELLED 이후 중간 상태 무시)
 * - 상태 전환 검증
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

describe("Analyses Webhook API - Intermediate Status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/analyses/webhook", () => {
    describe("API Key 검증", () => {
      it("GIVEN 유효한 API Key WHEN 웹훅 요청 THEN 요청이 처리되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENDING",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );
        (prisma.analysis.update as jest.Mock).mockResolvedValue({
          ...mockAnalysis,
          status: "CLONING",
        });

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
      });

      it("GIVEN 잘못된 API Key WHEN 웹훅 요청 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "invalid-key",
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
        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Invalid API key");
      });
    });

    describe("필수 파라미터 검증", () => {
      it("GIVEN analysis_id 누락 WHEN 웹훅 요청 THEN 400 에러가 반환되어야 한다", async () => {
        // GIVEN
        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CLONING",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("analysis_id is required");
      });

      it("GIVEN 존재하지 않는 analysis_id WHEN 웹훅 요청 THEN 404 에러가 반환되어야 한다", async () => {
        // GIVEN
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "non-existent",
            status: "CLONING",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Analysis not found");
      });
    });

    describe("중간 상태 업데이트", () => {
      it("GIVEN PENDING 상태 WHEN status=CLONING THEN 분석 상태가 CLONING으로 업데이트되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENDING",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "CLONING",
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
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
        expect(data.data.status).toBe("CLONING");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "CLONING",
          }),
        });
      });

      it("GIVEN CLONING 상태 WHEN status=STATIC_ANALYSIS THEN 분석 상태가 STATIC_ANALYSIS로 업데이트되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "CLONING",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "STATIC_ANALYSIS",
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
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
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("STATIC_ANALYSIS");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "STATIC_ANALYSIS",
          }),
        });
      });

      it("GIVEN STATIC_ANALYSIS 상태 WHEN status=BUILDING THEN 분석 상태가 BUILDING으로 업데이트되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "STATIC_ANALYSIS",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "BUILDING",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("BUILDING");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "BUILDING",
          }),
        });
      });

      it("GIVEN BUILDING 상태 WHEN status=PENETRATION_TEST THEN 분석 상태가 PENETRATION_TEST로 업데이트되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "PENETRATION_TEST",
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "PENETRATION_TEST",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("PENETRATION_TEST");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "PENETRATION_TEST",
          }),
        });
      });
    });

    describe("터미널 상태 전환", () => {
      it("GIVEN PENETRATION_TEST 상태 WHEN status=COMPLETED THEN DB가 COMPLETED로 업데이트되고 completedAt이 설정되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENETRATION_TEST",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "COMPLETED",
          completedAt: new Date(),
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

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
        expect(data.data.status).toBe("COMPLETED");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "COMPLETED",
            completedAt: expect.any(Date),
            sandboxStatus: "COMPLETED",
            vulnerabilitiesFound: 5,
            criticalCount: 1,
            highCount: 2,
            mediumCount: 1,
            lowCount: 1,
          }),
        });
      });

      it("GIVEN 중간 상태 WHEN status=FAILED THEN DB가 FAILED로 업데이트되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "BUILDING",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "FAILED",
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
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
            error: "Build failed",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("FAILED");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "FAILED",
            sandboxStatus: "FAILED",
          }),
        });
      });
    });

    describe("터미널 상태 회귀 방지", () => {
      it("GIVEN COMPLETED 상태 WHEN 중간 상태(BUILDING) 요청 THEN 상태가 COMPLETED로 유지되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "COMPLETED",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "COMPLETED", // 상태 유지
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "BUILDING", // 중간 상태 시도
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("COMPLETED");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "COMPLETED", // 터미널 상태 유지
          }),
        });
      });

      it("GIVEN FAILED 상태 WHEN 중간 상태(CLONING) 요청 THEN 상태가 FAILED로 유지되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "FAILED",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "FAILED", // 상태 유지
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "CLONING", // 중간 상태 시도
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("FAILED");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "FAILED", // 터미널 상태 유지
          }),
        });
      });

      it("GIVEN CANCELLED 상태 WHEN 중간 상태(STATIC_ANALYSIS) 요청 THEN 상태가 CANCELLED로 유지되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "CANCELLED",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "CANCELLED", // 상태 유지
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "STATIC_ANALYSIS", // 중간 상태 시도
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("CANCELLED");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "CANCELLED", // 터미널 상태 유지
          }),
        });
      });

      it("GIVEN COMPLETED 상태 WHEN status=FAILED 요청 THEN 상태가 FAILED로 업데이트되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "COMPLETED",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "FAILED",
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
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
            error: "Reprocessing failed",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("FAILED");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "FAILED",
            sandboxStatus: "FAILED",
          }),
        });
      });
    });

    describe("유효하지 않은 상태 처리", () => {
      it("GIVEN PENDING 상태 WHEN 유효하지 않은 status 요청 THEN 기존 상태가 유지되어야 한다", async () => {
        // GIVEN
        const mockAnalysis = {
          id: "analysis-1",
          status: "PENDING",
        };
        (prisma.analysis.findUnique as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        const updatedAnalysis = {
          id: "analysis-1",
          status: "PENDING", // 상태 유지
        };
        (prisma.analysis.update as jest.Mock).mockResolvedValue(
          updatedAnalysis
        );

        const request = new Request("http://localhost/api/analyses/webhook", {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysis_id: "analysis-1",
            status: "INVALID_STATUS",
          }),
        });

        // WHEN
        const response = await POST(request);
        const data = await response.json();

        // THEN
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("PENDING");
        expect(prisma.analysis.update).toHaveBeenCalledWith({
          where: { id: "analysis-1" },
          data: expect.objectContaining({
            status: "PENDING", // 기존 상태 유지
          }),
        });
      });
    });
  });
});
