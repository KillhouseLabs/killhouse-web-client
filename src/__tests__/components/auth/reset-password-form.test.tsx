/**
 * ResetPasswordForm Component Tests
 *
 * 비밀번호 재설정 폼 UI 및 인터랙션 테스트
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { renderWithLocale } from "../../test-utils";

// Mock next/navigation with token support
const mockPush = jest.fn();
let mockTokenValue: string | null = "valid-token-123";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === "token") return mockTokenValue;
      return null;
    }),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockTokenValue = "valid-token-123"; // Reset to valid token
  });

  describe("토큰 없음", () => {
    it("GIVEN 토큰 없이 접근 WHEN 렌더링 THEN 유효하지 않은 토큰 메시지 표시", () => {
      // GIVEN
      mockTokenValue = null;

      // WHEN
      renderWithLocale(<ResetPasswordForm />);

      // THEN
      expect(
        screen.getByText("토큰이 만료되었거나 유효하지 않습니다")
      ).toBeInTheDocument();
      expect(screen.getByText("비밀번호 재설정 다시 요청")).toBeInTheDocument();
    });
  });

  describe("렌더링", () => {
    it("GIVEN 유효한 토큰 WHEN 렌더링 THEN 모든 필수 요소 표시", () => {
      // GIVEN & WHEN
      renderWithLocale(<ResetPasswordForm />);

      // THEN
      expect(
        screen.getByRole("heading", { name: "비밀번호 재설정" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("새 비밀번호")).toBeInTheDocument();
      expect(screen.getByLabelText("비밀번호 확인")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "비밀번호 재설정" })
      ).toBeInTheDocument();
    });
  });

  describe("입력 검증", () => {
    it("GIVEN 비밀번호 불일치 WHEN 제출 THEN 에러 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      renderWithLocale(<ResetPasswordForm />);

      // WHEN
      await user.type(screen.getByLabelText("새 비밀번호"), "Password123");
      await user.type(
        screen.getByLabelText("비밀번호 확인"),
        "DifferentPassword123"
      );
      await user.click(screen.getByRole("button", { name: "비밀번호 재설정" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("비밀번호가 일치하지 않습니다")
        ).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("GIVEN 너무 짧은 비밀번호 WHEN 제출 THEN 에러 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      renderWithLocale(<ResetPasswordForm />);

      // WHEN
      await user.type(screen.getByLabelText("새 비밀번호"), "Short1");
      await user.type(screen.getByLabelText("비밀번호 확인"), "Short1");
      await user.click(screen.getByRole("button", { name: "비밀번호 재설정" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("비밀번호는 8자 이상이어야 합니다")
        ).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("GIVEN 약한 비밀번호 WHEN 제출 THEN 에러 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      renderWithLocale(<ResetPasswordForm />);

      // WHEN
      await user.type(screen.getByLabelText("새 비밀번호"), "weakpassword");
      await user.type(screen.getByLabelText("비밀번호 확인"), "weakpassword");
      await user.click(screen.getByRole("button", { name: "비밀번호 재설정" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다")
        ).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("재설정 성공", () => {
    it("GIVEN 유효한 비밀번호 WHEN 재설정 성공 THEN 성공 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
          }),
      });
      renderWithLocale(<ResetPasswordForm />);

      // WHEN
      await user.type(screen.getByLabelText("새 비밀번호"), "NewPassword123");
      await user.type(screen.getByLabelText("비밀번호 확인"), "NewPassword123");
      await user.click(screen.getByRole("button", { name: "비밀번호 재설정" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "valid-token-123",
            password: "NewPassword123",
            confirmPassword: "NewPassword123",
          }),
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText("비밀번호가 변경되었습니다")
        ).toBeInTheDocument();
      });
    });
  });

  describe("i18n", () => {
    it("GIVEN en locale WHEN 렌더링 THEN 영어로 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<ResetPasswordForm />, "en");

      // THEN
      expect(
        screen.getByRole("heading", { name: "Reset password" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reset password" })
      ).toBeInTheDocument();
    });

    it("GIVEN en locale WHEN 토큰 없음 THEN 영어 에러 메시지 표시", () => {
      // GIVEN
      mockTokenValue = null;

      // WHEN
      renderWithLocale(<ResetPasswordForm />, "en");

      // THEN
      expect(
        screen.getByText("The token has expired or is invalid")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Request password reset again")
      ).toBeInTheDocument();
    });
  });
});
