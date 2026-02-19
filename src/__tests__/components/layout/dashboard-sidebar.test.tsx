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
  let cookieStore: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    cookieStore = {};

    // Mock document.cookie getter and setter
    Object.defineProperty(document, "cookie", {
      get: jest.fn(() => {
        return Object.entries(cookieStore)
          .map(([name, value]) => `${name}=${value}`)
          .join("; ");
      }),
      set: jest.fn((cookieString: string) => {
        const [nameValue] = cookieString.split(";");
        const [name, value] = nameValue.split("=");
        const trimmedName = name.trim();

        // If setting to expire (empty value or expires in the past), delete the cookie
        if (
          !value ||
          value === "" ||
          cookieString.includes("expires=Thu, 01 Jan 1970")
        ) {
          delete cookieStore[trimmedName];
        } else {
          cookieStore[trimmedName] = value;
        }
      }),
      configurable: true,
    });
  });

  describe("로그아웃 기능", () => {
    it("GIVEN 로그아웃 버튼 클릭 WHEN 로그아웃 실행 THEN next-auth 쿠키가 삭제되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      cookieStore["next-auth.session-token"] = "token123";
      cookieStore["next-auth.csrf-token"] = "csrf123";
      cookieStore["__Secure-next-auth.session-token"] = "secure-token123";
      cookieStore["other-cookie"] = "should-not-be-deleted";

      render(<DashboardHeader />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "로그아웃" }));

      // THEN
      await waitFor(() => {
        expect(cookieStore["next-auth.session-token"]).toBeUndefined();
        expect(cookieStore["next-auth.csrf-token"]).toBeUndefined();
        expect(cookieStore["__Secure-next-auth.session-token"]).toBeUndefined();
        expect(cookieStore["other-cookie"]).toBe("should-not-be-deleted");
      });
    });

    it("GIVEN 로그아웃 버튼 클릭 WHEN 로그아웃 실행 THEN signOut이 /login으로 리다이렉트되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<DashboardHeader />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "로그아웃" }));

      // THEN
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
      });
    });

    it("GIVEN next-auth 쿠키가 없는 상태 WHEN 로그아웃 실행 THEN 에러 없이 signOut이 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      cookieStore = {}; // No cookies
      render(<DashboardHeader />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "로그아웃" }));

      // THEN
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
      });
    });
  });
});
