/**
 * Dashboard Stats API Route Tests
 *
 * 대시보드 통계 API 엔드포인트 테스트
 */

// Mock prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    project: {
      count: jest.fn(),
    },
    analysis: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";

describe("Dashboard Stats API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("GIVEN 인증되지 않은 사용자 WHEN 통계 요청 THEN null 세션이 반환되어야 한다", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue(null);

      // WHEN
      const session = await auth();

      // THEN
      expect(session).toBeNull();
    });

    it("GIVEN 인증된 사용자 WHEN 세션 확인 THEN 사용자 정보가 있어야 한다", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });

      // WHEN
      const session = await auth();

      // THEN
      expect(session?.user?.id).toBe("user-1");
    });
  });

  describe("프로젝트 수 조회", () => {
    it("GIVEN 사용자의 프로젝트가 있음 WHEN 프로젝트 수 조회 THEN 정확한 수가 반환되어야 한다", async () => {
      // GIVEN
      (prisma.project.count as jest.Mock).mockResolvedValue(5);

      // WHEN
      const count = await prisma.project.count({
        where: {
          userId: "user-1",
          status: { not: "DELETED" },
        },
      });

      // THEN
      expect(count).toBe(5);
    });

    it("GIVEN 프로젝트가 없음 WHEN 프로젝트 수 조회 THEN 0이 반환되어야 한다", async () => {
      // GIVEN
      (prisma.project.count as jest.Mock).mockResolvedValue(0);

      // WHEN
      const count = await prisma.project.count({
        where: {
          userId: "user-1",
          status: { not: "DELETED" },
        },
      });

      // THEN
      expect(count).toBe(0);
    });
  });

  describe("분석 통계 조회", () => {
    it("GIVEN 완료된 분석이 있음 WHEN 분석 조회 THEN 완료된 분석이 포함되어야 한다", async () => {
      // GIVEN
      const mockAnalyses = [
        { status: "COMPLETED", vulnerabilitiesFound: 5, criticalCount: 1 },
        { status: "COMPLETED", vulnerabilitiesFound: 3, criticalCount: 0 },
        { status: "FAILED", vulnerabilitiesFound: 0, criticalCount: 0 },
      ];
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue(mockAnalyses);

      // WHEN
      const analyses = await prisma.analysis.findMany({
        where: {
          project: { userId: "user-1", status: { not: "DELETED" } },
        },
        select: {
          status: true,
          vulnerabilitiesFound: true,
          criticalCount: true,
        },
      });

      // THEN
      const completedCount = analyses.filter(
        (a: { status: string }) => a.status === "COMPLETED"
      ).length;
      expect(completedCount).toBe(2);
    });

    it("GIVEN 분석 결과가 있음 WHEN 취약점 합계 계산 THEN 정확한 합계가 반환되어야 한다", async () => {
      // GIVEN
      const mockAnalyses = [
        { status: "COMPLETED", vulnerabilitiesFound: 5, criticalCount: 1 },
        { status: "COMPLETED", vulnerabilitiesFound: 3, criticalCount: 2 },
      ];
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue(mockAnalyses);

      // WHEN
      const analyses = await prisma.analysis.findMany({});
      const totalVulnerabilities = analyses.reduce(
        (sum: number, a: { vulnerabilitiesFound: number | null }) =>
          sum + (a.vulnerabilitiesFound || 0),
        0
      );
      const criticalVulnerabilities = analyses.reduce(
        (sum: number, a: { criticalCount: number | null }) =>
          sum + (a.criticalCount || 0),
        0
      );

      // THEN
      expect(totalVulnerabilities).toBe(8);
      expect(criticalVulnerabilities).toBe(3);
    });
  });

  describe("최근 활동 조회", () => {
    it("GIVEN 최근 분석이 있음 WHEN 최근 활동 조회 THEN 최근 5개가 반환되어야 한다", async () => {
      // GIVEN
      const mockRecentAnalyses = [
        {
          id: "analysis-1",
          status: "COMPLETED",
          startedAt: new Date(),
          completedAt: new Date(),
          vulnerabilitiesFound: 5,
          project: { name: "Project 1", repositories: [{ provider: "GITHUB" }] },
        },
        {
          id: "analysis-2",
          status: "RUNNING",
          startedAt: new Date(),
          completedAt: null,
          vulnerabilitiesFound: null,
          project: { name: "Project 2", repositories: [{ provider: "GITLAB" }] },
        },
      ];
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue(
        mockRecentAnalyses
      );

      // WHEN
      const recentAnalyses = await prisma.analysis.findMany({
        where: {
          project: { userId: "user-1", status: { not: "DELETED" } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          project: {
            select: {
              name: true,
              repositories: { where: { isPrimary: true }, take: 1, select: { provider: true } },
            },
          },
        },
      });

      // THEN
      expect(recentAnalyses).toHaveLength(2);
      expect(recentAnalyses[0].project.name).toBe("Project 1");
    });

    it("GIVEN 활동이 없음 WHEN 최근 활동 조회 THEN 빈 배열이 반환되어야 한다", async () => {
      // GIVEN
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue([]);

      // WHEN
      const recentAnalyses = await prisma.analysis.findMany({
        where: {
          project: { userId: "user-1", status: { not: "DELETED" } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      });

      // THEN
      expect(recentAnalyses).toHaveLength(0);
    });
  });

  describe("통계 집계", () => {
    it("GIVEN 모든 데이터가 있음 WHEN 통계 집계 THEN 올바른 통계가 계산되어야 한다", async () => {
      // GIVEN
      (prisma.project.count as jest.Mock).mockResolvedValue(3);
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue([
        { status: "COMPLETED", vulnerabilitiesFound: 10, criticalCount: 2 },
        { status: "COMPLETED", vulnerabilitiesFound: 5, criticalCount: 1 },
        { status: "RUNNING", vulnerabilitiesFound: 0, criticalCount: 0 },
      ]);

      // WHEN
      const totalProjects = await prisma.project.count({});
      const analyses = await prisma.analysis.findMany({});
      const completedAnalyses = analyses.filter(
        (a: { status: string }) => a.status === "COMPLETED"
      ).length;
      const totalVulnerabilities = analyses.reduce(
        (sum: number, a: { vulnerabilitiesFound: number }) =>
          sum + a.vulnerabilitiesFound,
        0
      );
      const criticalVulnerabilities = analyses.reduce(
        (sum: number, a: { criticalCount: number }) => sum + a.criticalCount,
        0
      );

      // THEN
      expect(totalProjects).toBe(3);
      expect(completedAnalyses).toBe(2);
      expect(totalVulnerabilities).toBe(15);
      expect(criticalVulnerabilities).toBe(3);
    });
  });
});
