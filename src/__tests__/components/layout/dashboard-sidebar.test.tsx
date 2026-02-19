/**
 * DashboardHeader Component Tests
 *
 * 대시보드 헤더 로그아웃 기능 테스트
 */

// Mock next-themes before any imports
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: jest.fn(),
  }),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";

// Mock next-auth/react (already mocked in jest.setup.js)
import { signOut } from "next-auth/react";
const mockSignOut = signOut as jest.Mock;

describe("DashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("로그아웃 기능", () => {
    it("GIVEN 로그아웃 버튼 클릭 WHEN 로그아웃 실행 THEN signOut이 랜딩페이지로 리다이렉트되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<DashboardHeader />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "로그아웃" }));

      // THEN
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
      });
    });
  });
});
