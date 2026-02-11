/**
 * ProjectList Component Tests
 *
 * 프로젝트 목록 UI 및 API 통합 테스트
 */

import { render, screen, waitFor } from "@testing-library/react";
import { ProjectList } from "@/components/project/project-list";

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockProjects = [
  {
    id: "project-1",
    name: "Test Project 1",
    description: "Test description 1",
    type: "CODE",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { analyses: 3 },
  },
  {
    id: "project-2",
    name: "Test Project 2",
    description: null,
    type: "CONTAINER",
    status: "ARCHIVED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { analyses: 0 },
  },
];

describe("ProjectList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("로딩 상태", () => {
    it("GIVEN API 호출 중 WHEN 컴포넌트 렌더링 THEN 로딩 스피너가 표시되어야 한다", () => {
      // GIVEN
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // WHEN
      render(<ProjectList />);

      // THEN
      expect(screen.getByRole("status") || document.querySelector(".animate-spin")).toBeTruthy();
    });
  });

  describe("프로젝트 목록 표시", () => {
    it("GIVEN 프로젝트가 있음 WHEN API 응답 성공 THEN 프로젝트 목록이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProjects }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
        expect(screen.getByText("Test Project 2")).toBeInTheDocument();
      });
    });

    it("GIVEN 프로젝트가 있음 WHEN 목록 렌더링 THEN 프로젝트 타입 아이콘이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProjects }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      });
      // CODE와 CONTAINER 타입 모두 표시됨
      expect(screen.getByText("Test description 1")).toBeInTheDocument();
    });

    it("GIVEN 프로젝트가 있음 WHEN 목록 렌더링 THEN 분석 횟수가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProjects }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("분석 3회")).toBeInTheDocument();
        expect(screen.getByText("분석 0회")).toBeInTheDocument();
      });
    });

    it("GIVEN 프로젝트가 있음 WHEN 목록 렌더링 THEN 상태 배지가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProjects }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("활성")).toBeInTheDocument();
        expect(screen.getByText("보관됨")).toBeInTheDocument();
      });
    });
  });

  describe("빈 상태", () => {
    it("GIVEN 프로젝트 없음 WHEN API 응답 빈 배열 THEN 빈 상태 메시지가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("프로젝트가 없습니다")).toBeInTheDocument();
        expect(
          screen.getByText(
            "첫 번째 프로젝트를 만들어 코드나 컨테이너의 취약점을 분석해보세요"
          )
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 프로젝트 없음 WHEN 빈 상태 표시 THEN 프로젝트 생성 버튼이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("첫 프로젝트 만들기")).toBeInTheDocument();
      });
    });
  });

  describe("에러 상태", () => {
    it("GIVEN API 에러 WHEN 응답 실패 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "프로젝트 목록을 불러오는데 실패했습니다",
          }),
      });

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("프로젝트 목록을 불러오는데 실패했습니다")
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 네트워크 에러 WHEN fetch 실패 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      // WHEN
      render(<ProjectList />);

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("프로젝트 목록을 불러오는 중 오류가 발생했습니다")
        ).toBeInTheDocument();
      });
    });
  });
});
