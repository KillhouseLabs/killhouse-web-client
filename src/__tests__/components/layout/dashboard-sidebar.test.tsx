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

// Cookie store helper
let cookieStore: Record<string, string> = {};

beforeEach(() => {
  cookieStore = {};
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () =>
      Object.entries(cookieStore)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    set: (val: string) => {
      const [nameVal] = val.split(";");
      const [name, value] = nameVal.split("=");
      if (val.includes("expires=Thu, 01 Jan 1970")) {
        delete cookieStore[name.trim()];
      } else {
        cookieStore[name.trim()] = value?.trim() ?? "";
      }
    },
  });
});

describe("DashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("로그아웃 기능", () => {
    it("GIVEN 로그아웃 버튼 클릭 WHEN 로그아웃 실행 THEN signOut이 로그인 페이지로 리다이렉트되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      cookieStore["next-auth.session-token"] = "token123";
      cookieStore["next-auth.csrf-token"] = "csrf123";
      cookieStore["__Secure-next-auth.session-token"] = "secure-token123";
      cookieStore["authjs.session-token"] = "authjs-token123";
      cookieStore["other-cookie"] = "should-not-be-deleted";

      render(<DashboardHeader />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "로그아웃" }));

      // THEN
      await waitFor(() => {
        expect(cookieStore["next-auth.session-token"]).toBeUndefined();
        expect(cookieStore["next-auth.csrf-token"]).toBeUndefined();
        expect(cookieStore["__Secure-next-auth.session-token"]).toBeUndefined();
        expect(cookieStore["authjs.session-token"]).toBeUndefined();
        expect(cookieStore["other-cookie"]).toBe("should-not-be-deleted");
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: `${window.location.origin}/login`,
        });
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
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: `${window.location.origin}/login`,
        });
      });
    });
  });
});
