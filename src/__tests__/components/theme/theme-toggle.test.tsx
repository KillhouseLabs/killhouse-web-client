/**
 * ThemeToggle & ThemeProvider Tests
 *
 * 다크/라이트 모드 전환 컴포넌트 테스트
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Mock next-themes
const mockSetTheme = jest.fn();
let mockTheme = "dark";
let mockResolvedTheme = "dark";

jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTheme: () => ({
    theme: mockTheme,
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = "dark";
    mockResolvedTheme = "dark";
  });

  describe("렌더링", () => {
    it("GIVEN 다크 모드 WHEN 테마 토글 렌더링 THEN 라이트 모드 전환 버튼이 표시되어야 한다", () => {
      // GIVEN
      mockResolvedTheme = "dark";

      // WHEN
      render(<ThemeToggle />);

      // THEN
      const button = screen.getByRole("button", { name: "라이트 모드로 전환" });
      expect(button).toBeInTheDocument();
    });

    it("GIVEN 라이트 모드 WHEN 테마 토글 렌더링 THEN 다크 모드 전환 버튼이 표시되어야 한다", () => {
      // GIVEN
      mockResolvedTheme = "light";

      // WHEN
      render(<ThemeToggle />);

      // THEN
      const button = screen.getByRole("button", { name: "다크 모드로 전환" });
      expect(button).toBeInTheDocument();
    });
  });

  describe("테마 전환", () => {
    it("GIVEN 다크 모드 WHEN 토글 클릭 THEN setTheme('light')가 호출되어야 한다", () => {
      // GIVEN
      mockResolvedTheme = "dark";
      render(<ThemeToggle />);

      // WHEN
      const button = screen.getByRole("button", { name: "라이트 모드로 전환" });
      fireEvent.click(button);

      // THEN
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("GIVEN 라이트 모드 WHEN 토글 클릭 THEN setTheme('dark')가 호출되어야 한다", () => {
      // GIVEN
      mockResolvedTheme = "light";
      render(<ThemeToggle />);

      // WHEN
      const button = screen.getByRole("button", { name: "다크 모드로 전환" });
      fireEvent.click(button);

      // THEN
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("아이콘 표시", () => {
    it("GIVEN 다크 모드 WHEN 렌더링 THEN sun 아이콘이 표시되어야 한다", () => {
      // GIVEN
      mockResolvedTheme = "dark";

      // WHEN
      render(<ThemeToggle />);

      // THEN
      expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    });

    it("GIVEN 라이트 모드 WHEN 렌더링 THEN moon 아이콘이 표시되어야 한다", () => {
      // GIVEN
      mockResolvedTheme = "light";

      // WHEN
      render(<ThemeToggle />);

      // THEN
      expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
    });
  });
});
