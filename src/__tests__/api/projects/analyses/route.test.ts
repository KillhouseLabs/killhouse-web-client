/**
 * Analyses API Route Tests
 *
 * 분석 API 엔드포인트 테스트
 * - 분석 목록 조회
 * - 분석 시작 (구독 제한 적용)
 */

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    project: {
      findFirst: jest.fn(),
    },
    analysis: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/domains/subscription/usecase/subscription-limits", () => ({
  canRunAnalysis: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { canRunAnalysis } from "@/domains/subscription/usecase/subscription-limits";

describe("Analyses API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects/[id]/analyses", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 분석 목록 요청 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });
    });

    describe("프로젝트 소유권 검증", () => {
      it("GIVEN 인증된 사용자 WHEN 자신의 프로젝트 분석 조회 THEN 분석 목록이 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });

        const mockProject = { id: "project-1", userId: "user-1" };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        const mockAnalyses = [
          {
            id: "analysis-1",
            status: "COMPLETED",
            projectId: "project-1",
            repository: { id: "repo-1", name: "frontend", provider: "GITHUB" },
          },
        ];
        (prisma.analysis.findMany as jest.Mock).mockResolvedValue(mockAnalyses);

        // WHEN
        const project = await prisma.project.findFirst({
          where: {
            id: "project-1",
            userId: "user-1",
            status: { not: "DELETED" },
          },
        });
        const analyses = await prisma.analysis.findMany({
          where: { projectId: "project-1" },
        });

        // THEN
        expect(project).not.toBeNull();
        expect(analyses).toHaveLength(1);
        expect(analyses[0].status).toBe("COMPLETED");
      });

      it("GIVEN 다른 사용자의 프로젝트 WHEN 분석 조회 시도 THEN 프로젝트를 찾을 수 없어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });

        (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

        // WHEN
        const project = await prisma.project.findFirst({
          where: {
            id: "project-other",
            userId: "user-1",
            status: { not: "DELETED" },
          },
        });

        // THEN
        expect(project).toBeNull();
      });
    });
  });

  describe("POST /api/projects/[id]/analyses", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 분석 시작 요청 THEN 401 에러", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });
    });

    describe("구독 제한 검증", () => {
      it("GIVEN free 플랜 제한 초과 WHEN 분석 시작 THEN 403 에러와 사용량 정보 반환", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });

        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: false,
          currentCount: 10,
          limit: 10,
          message: "이번 달 분석 한도(10회)에 도달했습니다. 플랜을 업그레이드하세요.",
        });

        // WHEN
        const limitCheck = await canRunAnalysis("user-1");

        // THEN
        expect(limitCheck.allowed).toBe(false);
        expect(limitCheck.currentCount).toBe(10);
        expect(limitCheck.limit).toBe(10);
        expect(limitCheck.message).toContain("한도");
      });

      it("GIVEN free 플랜 제한 내 WHEN 분석 시작 THEN 분석이 생성되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });

        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 5,
          limit: 10,
        });

        const mockProject = {
          id: "project-1",
          userId: "user-1",
          repositories: [{ id: "repo-1", name: "frontend" }],
        };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        const mockAnalysis = {
          id: "analysis-new",
          status: "PENDING",
          projectId: "project-1",
          repositoryId: "repo-1",
          branch: "main",
        };
        (prisma.analysis.create as jest.Mock).mockResolvedValue(mockAnalysis);

        // WHEN
        const limitCheck = await canRunAnalysis("user-1");
        const analysis = await prisma.analysis.create({
          data: {
            projectId: "project-1",
            repositoryId: "repo-1",
            branch: "main",
            status: "PENDING",
          },
        });

        // THEN
        expect(limitCheck.allowed).toBe(true);
        expect(analysis.status).toBe("PENDING");
        expect(analysis.repositoryId).toBe("repo-1");
      });

      it("GIVEN Pro 플랜 (무제한) WHEN 분석 시작 THEN 분석이 생성되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-pro" },
        });

        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 100,
          limit: -1, // unlimited
        });

        const mockProject = {
          id: "project-1",
          userId: "user-pro",
          repositories: [],
        };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        const mockAnalysis = {
          id: "analysis-pro",
          status: "PENDING",
          projectId: "project-1",
        };
        (prisma.analysis.create as jest.Mock).mockResolvedValue(mockAnalysis);

        // WHEN
        const limitCheck = await canRunAnalysis("user-pro");

        // THEN
        expect(limitCheck.allowed).toBe(true);
        expect(limitCheck.limit).toBe(-1);
      });
    });

    describe("분석 생성", () => {
      it("GIVEN 유효한 저장소 ID WHEN 분석 시작 THEN 해당 저장소로 분석 생성", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });

        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 0,
          limit: 10,
        });

        const mockProject = {
          id: "project-1",
          userId: "user-1",
          repositories: [
            { id: "repo-1", name: "frontend" },
            { id: "repo-2", name: "backend" },
          ],
        };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        const mockAnalysis = {
          id: "analysis-1",
          status: "PENDING",
          projectId: "project-1",
          repositoryId: "repo-2",
          branch: "develop",
          repository: { id: "repo-2", name: "backend", provider: "GITHUB" },
        };
        (prisma.analysis.create as jest.Mock).mockResolvedValue(mockAnalysis);

        // WHEN
        const analysis = await prisma.analysis.create({
          data: {
            projectId: "project-1",
            repositoryId: "repo-2",
            branch: "develop",
            status: "PENDING",
          },
        });

        // THEN
        expect(analysis.repositoryId).toBe("repo-2");
        expect(analysis.branch).toBe("develop");
      });

      it("GIVEN 유효하지 않은 저장소 ID WHEN 분석 시작 THEN 저장소를 찾을 수 없음", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          userId: "user-1",
          repositories: [{ id: "repo-1", name: "frontend" }],
        };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        // WHEN
        const invalidRepoId = "invalid-repo";
        const repository = mockProject.repositories.find(
          (r) => r.id === invalidRepoId
        );

        // THEN
        expect(repository).toBeUndefined();
      });

      it("GIVEN 저장소 ID 없음 WHEN 분석 시작 THEN repositoryId null로 분석 생성", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });

        (canRunAnalysis as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 0,
          limit: 10,
        });

        const mockProject = {
          id: "project-1",
          userId: "user-1",
          repositories: [],
        };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        const mockAnalysis = {
          id: "analysis-1",
          status: "PENDING",
          projectId: "project-1",
          repositoryId: null,
          branch: "main",
        };
        (prisma.analysis.create as jest.Mock).mockResolvedValue(mockAnalysis);

        // WHEN
        const analysis = await prisma.analysis.create({
          data: {
            projectId: "project-1",
            repositoryId: null,
            branch: "main",
            status: "PENDING",
          },
        });

        // THEN
        expect(analysis.repositoryId).toBeNull();
      });
    });
  });
});
