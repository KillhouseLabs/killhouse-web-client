/**
 * NewProjectButton Component Tests
 *
 * 새 프로젝트 버튼 (구독 권한 체크) 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewProjectButton } from "@/components/project/new-project-button";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe("NewProjectButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("버튼 렌더링", () => {
    it("GIVEN 컴포넌트 렌더링 WHEN 초기 상태 THEN 새 프로젝트 버튼이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<NewProjectButton />);

      // THEN
      expect(
        screen.getByRole("button", { name: /새 프로젝트/ })
      ).toBeInTheDocument();
    });
  });

  describe("권한 확인 후 이동", () => {
    it("GIVEN 한도 내 WHEN 버튼 클릭 THEN /projects/new로 이동해야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              projects: { current: 1, limit: 3 },
              analysisThisMonth: { current: 5, limit: 10 },
            },
          }),
      });

      render(<NewProjectButton />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /새 프로젝트/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new");
      });
    });

    it("GIVEN 무제한 플랜 WHEN 버튼 클릭 THEN /projects/new로 이동해야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              projects: { current: 50, limit: -1 },
              analysisThisMonth: { current: 100, limit: -1 },
            },
          }),
      });

      render(<NewProjectButton />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /새 프로젝트/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new");
      });
    });
  });

  describe("한도 초과 시 모달", () => {
    it("GIVEN 한도 초과 WHEN 버튼 클릭 THEN 업그레이드 모달이 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              projects: { current: 3, limit: 3 },
              analysisThisMonth: { current: 5, limit: 10 },
            },
          }),
      });

      render(<NewProjectButton />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /새 프로젝트/ }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("프로젝트 생성 한도 초과")).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("API 오류 처리", () => {
    it("GIVEN API 오류 WHEN 버튼 클릭 THEN /projects/new로 이동해야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "인증 오류",
          }),
      });

      render(<NewProjectButton />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /새 프로젝트/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new");
      });
    });

    it("GIVEN 네트워크 오류 WHEN 버튼 클릭 THEN /projects/new로 이동해야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<NewProjectButton />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /새 프로젝트/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/projects/new");
      });
    });
  });

  describe("로딩 상태", () => {
    it("GIVEN API 호출 중 WHEN 버튼 클릭 THEN 로딩 스피너가 표시되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<NewProjectButton />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /새 프로젝트/ }));

      // THEN
      await waitFor(() => {
        expect(screen.getByRole("button")).toBeDisabled();
      });
    });
  });
});
