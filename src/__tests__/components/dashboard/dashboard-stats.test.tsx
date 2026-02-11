/**
 * DashboardStats Component Tests
 *
 * 대시보드 통계 UI 및 API 통합 테스트
 */

import { render, screen, waitFor } from "@testing-library/react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockStats = {
  totalProjects: 5,
  completedAnalyses: 12,
  totalVulnerabilities: 25,
  criticalVulnerabilities: 3,
  recentActivities: [
    {
      id: "analysis-1",
      projectName: "Test Project 1",
      projectType: "CODE",
      status: "COMPLETED",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      vulnerabilitiesFound: 5,
    },
    {
      id: "analysis-2",
      projectName: "Test Project 2",
      projectType: "CONTAINER",
      status: "FAILED",
      startedAt: new Date().toISOString(),
      completedAt: null,
      vulnerabilitiesFound: null,
    },
  ],
};

describe("DashboardStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("로딩 상태", () => {
    it("GIVEN API 호출 중 WHEN 컴포넌트 렌더링 THEN 로딩 스켈레톤이 표시되어야 한다", () => {
      // GIVEN
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // WHEN
      render(<DashboardStats />);

      // THEN
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("통계 표시", () => {
    it("GIVEN API 응답 성공 WHEN 통계 로드 THEN 총 프로젝트 수가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("총 프로젝트")).toBeInTheDocument();
      });
    });

    it("GIVEN API 응답 성공 WHEN 통계 로드 THEN 완료된 분석 수가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("완료된 분석")).toBeInTheDocument();
      });
    });

    it("GIVEN API 응답 성공 WHEN 통계 로드 THEN 취약점 수가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("25")).toBeInTheDocument();
        expect(screen.getByText("발견된 취약점")).toBeInTheDocument();
      });
    });

    it("GIVEN API 응답 성공 WHEN 통계 로드 THEN 심각한 취약점 수가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("심각한 취약점")).toBeInTheDocument();
      });
    });
  });

  describe("빠른 시작", () => {
    it("GIVEN 대시보드 로드 WHEN 통계 표시 THEN 빠른 시작 링크들이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("새 프로젝트 만들기")).toBeInTheDocument();
        expect(screen.getByText("프로젝트 보기")).toBeInTheDocument();
        expect(screen.getByText("플랜 업그레이드")).toBeInTheDocument();
      });
    });
  });

  describe("최근 활동", () => {
    it("GIVEN 활동 있음 WHEN 통계 로드 THEN 최근 활동 목록이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
        expect(screen.getByText("Test Project 2")).toBeInTheDocument();
      });
    });

    it("GIVEN 완료된 분석 WHEN 활동 표시 THEN 취약점 수가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText(/분석 완료 · 5개 취약점 발견/)
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 실패한 분석 WHEN 활동 표시 THEN 실패 상태가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockStats }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("분석 실패")).toBeInTheDocument();
      });
    });

    it("GIVEN 활동 없음 WHEN 빈 배열 응답 THEN 빈 상태 메시지가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { ...mockStats, recentActivities: [] },
          }),
      });

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("아직 활동이 없습니다")).toBeInTheDocument();
      });
    });
  });

  describe("API 에러", () => {
    it("GIVEN API 실패 WHEN 통계 로드 THEN 기본값(0)이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      // WHEN
      render(<DashboardStats />);

      // THEN
      await waitFor(() => {
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
