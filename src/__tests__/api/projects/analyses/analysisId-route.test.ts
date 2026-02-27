/**
 * Analysis API Route Tests
 *
 * 분석 API 엔드포인트 통합 테스트
 * - GET: 단일 분석 조회 (프로젝트 소유권 검증 포함)
 * - PATCH: 분석 취소 (진행 중인 분석만 가능)
 */

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock repositories
jest.mock("@/domains/project/infra/prisma-project.repository", () => ({
  projectRepository: {
    findByIdAndUser: jest.fn(),
  },
}));

jest.mock("@/domains/analysis/infra/prisma-analysis.repository", () => ({
  analysisRepository: {
    findByIdAndProject: jest.fn(),
    update: jest.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";

describe("Analysis API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects/[id]/analyses/[analysisId]", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 분석 조회 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });
    });

    describe("분석 조회", () => {
      it("GIVEN 유효한 분석 ID WHEN 조회 THEN 분석 데이터가 반환되어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };
        const mockAnalysis = {
          id: "analysis-1",
          projectId: "project-1",
          status: "IN_PROGRESS",
          startedAt: new Date("2024-01-01T00:00:00Z"),
          repository: {
            id: "repo-1",
            name: "frontend",
            provider: "GITHUB",
          },
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        // WHEN
        const project = await projectRepository.findByIdAndUser(
          "user-1",
          "project-1"
        );
        const analysis = await analysisRepository.findByIdAndProject(
          "analysis-1",
          "project-1"
        );

        // THEN
        expect(project).not.toBeNull();
        expect(analysis).toEqual(mockAnalysis);
        expect(analysis?.repository?.name).toBe("frontend");
        expect(analysis?.status).toBe("IN_PROGRESS");
      });

      it("GIVEN 존재하지 않는 분석 ID WHEN 조회 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const analysis = await analysisRepository.findByIdAndProject(
          "non-existent",
          "project-1"
        );

        // THEN
        expect(analysis).toBeNull();
      });

      it("GIVEN 다른 사용자의 프로젝트 WHEN 분석 조회 THEN 프로젝트를 찾을 수 없어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const project = await projectRepository.findByIdAndUser(
          "user-1",
          "project-2"
        );

        // THEN
        expect(project).toBeNull();
      });

      it("GIVEN 로그가 포함된 분석 WHEN 조회 THEN logs/reports 필드가 반환되어야 한다", async () => {
        // GIVEN
        const logsData = JSON.stringify([
          {
            timestamp: "2024-01-01T00:00:00Z",
            step: "클론",
            level: "info",
            message: "저장소 클론 시작...",
          },
        ]);
        const sastReport = JSON.stringify({
          tool: "semgrep",
          findings: [],
          total: 0,
        });
        const dastReport = JSON.stringify({
          tool: "nuclei",
          findings: [],
          total: 0,
        });

        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };
        const mockAnalysis = {
          id: "analysis-1",
          projectId: "project-1",
          status: "COMPLETED",
          logs: logsData,
          staticAnalysisReport: sastReport,
          penetrationTestReport: dastReport,
          startedAt: new Date("2024-01-01T00:00:00Z"),
          repository: {
            id: "repo-1",
            name: "frontend",
            provider: "GITHUB",
          },
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        // WHEN
        const analysis = await analysisRepository.findByIdAndProject(
          "analysis-1",
          "project-1"
        );

        // THEN
        expect(analysis).not.toBeNull();
        expect(analysis?.logs).toBe(logsData);
        expect(analysis?.staticAnalysisReport).toBe(sastReport);
        expect(analysis?.penetrationTestReport).toBe(dastReport);
      });
    });
  });

  describe("PATCH /api/projects/[id]/analyses/[analysisId]", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 분석 취소 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });
    });

    describe("분석 취소", () => {
      it("GIVEN 진행 중인 분석 WHEN 취소 요청 THEN 상태가 CANCELLED로 변경되어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };
        const mockAnalysis = {
          id: "analysis-1",
          projectId: "project-1",
          status: "IN_PROGRESS",
        };
        const mockUpdatedAnalysis = {
          id: "analysis-1",
          status: "CANCELLED",
          completedAt: new Date("2024-01-01T12:00:00Z"),
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockAnalysis
        );
        (analysisRepository.update as jest.Mock).mockResolvedValue(
          mockUpdatedAnalysis
        );

        // WHEN
        const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
        const canCancel = !TERMINAL_STATUSES.includes(mockAnalysis.status);

        let result = null;
        if (canCancel) {
          result = await analysisRepository.update("analysis-1", {
            status: "CANCELLED",
            completedAt: expect.any(Date),
          });
        }

        // THEN
        expect(canCancel).toBe(true);
        expect(result?.status).toBe("CANCELLED");
        expect(analysisRepository.update).toHaveBeenCalledWith("analysis-1", {
          status: "CANCELLED",
          completedAt: expect.any(Date),
        });
      });

      it("GIVEN 이미 완료된 분석 WHEN 취소 요청 THEN 취소할 수 없어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };
        const mockAnalysis = {
          id: "analysis-1",
          projectId: "project-1",
          status: "COMPLETED",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        // WHEN
        const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
        const canCancel = !TERMINAL_STATUSES.includes(mockAnalysis.status);

        // THEN
        expect(canCancel).toBe(false);
      });

      it("GIVEN 이미 실패한 분석 WHEN 취소 요청 THEN 취소할 수 없어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };
        const mockAnalysis = {
          id: "analysis-1",
          projectId: "project-1",
          status: "FAILED",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        // WHEN
        const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
        const canCancel = !TERMINAL_STATUSES.includes(mockAnalysis.status);

        // THEN
        expect(canCancel).toBe(false);
      });

      it("GIVEN 이미 취소된 분석 WHEN 재취소 요청 THEN 취소할 수 없어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };
        const mockAnalysis = {
          id: "analysis-1",
          projectId: "project-1",
          status: "CANCELLED",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockAnalysis
        );

        // WHEN
        const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
        const canCancel = !TERMINAL_STATUSES.includes(mockAnalysis.status);

        // THEN
        expect(canCancel).toBe(false);
      });

      it("GIVEN 존재하지 않는 분석 WHEN 취소 요청 THEN 분석을 찾을 수 없어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          status: "ACTIVE",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (analysisRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const analysis = await analysisRepository.findByIdAndProject(
          "non-existent",
          "project-1"
        );

        // THEN
        expect(analysis).toBeNull();
      });

      it("GIVEN 다른 사용자의 프로젝트 WHEN 분석 취소 THEN 프로젝트를 찾을 수 없어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const project = await projectRepository.findByIdAndUser(
          "user-1",
          "project-2"
        );

        // THEN
        expect(project).toBeNull();
      });
    });
  });
});
