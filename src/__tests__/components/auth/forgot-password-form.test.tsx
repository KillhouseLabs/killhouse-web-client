/**
 * ForgotPasswordForm Component Tests
 *
 * 비밀번호 찾기 폼 UI 및 인터랙션 테스트
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { renderWithLocale } from "../../test-utils";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("렌더링", () => {
    it("GIVEN 비밀번호 찾기 페이지 접속 WHEN 렌더링 THEN 모든 필수 요소가 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<ForgotPasswordForm />);

      // THEN
      expect(
        screen.getByRole("heading", { name: "비밀번호 찾기" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("이메일")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "비밀번호 재설정 요청" })
      ).toBeInTheDocument();
      expect(screen.getByText("로그인")).toBeInTheDocument();
    });
  });

  describe("입력 검증", () => {
    it("GIVEN 빈 이메일 WHEN 제출 THEN 에러 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      renderWithLocale(<ForgotPasswordForm />);

      // WHEN - HTML5 required validation을 우회
      const emailInput = screen.getByLabelText("이메일");
      emailInput.removeAttribute("required");

      await user.click(
        screen.getByRole("button", { name: "비밀번호 재설정 요청" })
      );

      // THEN
      await waitFor(() => {
        expect(screen.getByText("이메일을 입력하세요")).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("GIVEN 잘못된 이메일 WHEN 제출 THEN 에러 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      renderWithLocale(<ForgotPasswordForm />);

      // WHEN - HTML5 email validation을 우회
      const emailInput = screen.getByLabelText("이메일");
      emailInput.removeAttribute("required");
      emailInput.setAttribute("type", "text");

      await user.type(emailInput, "invalid-email");
      await user.click(
        screen.getByRole("button", { name: "비밀번호 재설정 요청" })
      );

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("올바른 이메일 주소를 입력하세요")
        ).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("요청 성공", () => {
    it("GIVEN 유효한 이메일 WHEN 요청 성공 THEN 성공 메시지 표시", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
          }),
      });
      renderWithLocale(<ForgotPasswordForm />);

      // WHEN
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.click(
        screen.getByRole("button", { name: "비밀번호 재설정 요청" })
      );

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText("이메일을 확인해주세요")).toBeInTheDocument();
      });
    });
  });

  describe("i18n", () => {
    it("GIVEN en locale WHEN 렌더링 THEN 영어로 표시되어야 한다", () => {
      // GIVEN & WHEN
      renderWithLocale(<ForgotPasswordForm />, "en");

      // THEN
      expect(
        screen.getByRole("heading", { name: "Forgot password" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Request password reset" })
      ).toBeInTheDocument();
    });
  });
});
