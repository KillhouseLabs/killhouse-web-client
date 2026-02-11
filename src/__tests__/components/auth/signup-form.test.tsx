/**
 * SignupForm Component Tests
 *
 * 회원가입 폼 UI 및 인터랙션 테스트
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { SignupForm } from "@/components/auth/signup-form";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("SignupForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("렌더링", () => {
    it("GIVEN 회원가입 페이지 접속 WHEN 컴포넌트 렌더링 THEN 모든 필수 요소가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<SignupForm />);

      // THEN
      expect(screen.getByText("회원가입")).toBeInTheDocument();
      expect(screen.getByLabelText("이름")).toBeInTheDocument();
      expect(screen.getByLabelText("이메일")).toBeInTheDocument();
      expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
      expect(screen.getByLabelText("비밀번호 확인")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "회원가입" })
      ).toBeInTheDocument();
    });

    it("GIVEN 회원가입 페이지 접속 WHEN 컴포넌트 렌더링 THEN 로그인 링크가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<SignupForm />);

      // THEN
      expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    });

    it("GIVEN 회원가입 페이지 접속 WHEN 컴포넌트 렌더링 THEN 이용약관 체크박스가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<SignupForm />);

      // THEN
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      expect(screen.getByText("이용약관")).toBeInTheDocument();
    });
  });

  describe("입력 검증", () => {
    it("GIVEN 비밀번호 불일치 WHEN 회원가입 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<SignupForm />);

      // WHEN
      await user.type(screen.getByLabelText("이름"), "Test User");
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "Password123");
      await user.type(screen.getByLabelText("비밀번호 확인"), "Different123");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "회원가입" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("비밀번호가 일치하지 않습니다")
        ).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("GIVEN 이용약관 미동의 WHEN 회원가입 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<SignupForm />);

      // WHEN
      await user.type(screen.getByLabelText("이름"), "Test User");
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "Password123");
      await user.type(screen.getByLabelText("비밀번호 확인"), "Password123");
      await user.click(screen.getByRole("button", { name: "회원가입" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("이용약관에 동의해주세요")).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("회원가입 시도", () => {
    it("GIVEN 유효한 입력 WHEN 회원가입 성공 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "user-1", email: "test@example.com" },
          }),
      });
      (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });
      render(<SignupForm />);

      // WHEN
      await user.type(screen.getByLabelText("이름"), "Test User");
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "Password123");
      await user.type(screen.getByLabelText("비밀번호 확인"), "Password123");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "회원가입" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "Password123",
          }),
        });
      });
    });

    it("GIVEN 회원가입 성공 WHEN 자동 로그인 성공 THEN 대시보드로 이동해야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: "user-1" },
          }),
      });
      (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });
      render(<SignupForm />);

      // WHEN
      await user.type(screen.getByLabelText("이름"), "Test User");
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "Password123");
      await user.type(screen.getByLabelText("비밀번호 확인"), "Password123");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "회원가입" }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("GIVEN 이미 등록된 이메일 WHEN 회원가입 시도 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "이미 등록된 이메일입니다",
          }),
      });
      render(<SignupForm />);

      // WHEN
      await user.type(screen.getByLabelText("이름"), "Test User");
      await user.type(screen.getByLabelText("이메일"), "existing@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "Password123");
      await user.type(screen.getByLabelText("비밀번호 확인"), "Password123");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "회원가입" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("이미 등록된 이메일입니다")
        ).toBeInTheDocument();
      });
    });
  });

  describe("소셜 로그인", () => {
    it("GIVEN Google 버튼 클릭 WHEN 소셜 로그인 시도 THEN signIn이 google provider로 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<SignupForm />);

      // WHEN
      await user.click(screen.getByText("Google로 계속하기"));

      // THEN
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });

    it("GIVEN GitHub 버튼 클릭 WHEN 소셜 로그인 시도 THEN signIn이 github provider로 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<SignupForm />);

      // WHEN
      await user.click(screen.getByText("GitHub로 계속하기"));

      // THEN
      expect(signIn).toHaveBeenCalledWith("github", {
        callbackUrl: "/dashboard",
      });
    });
  });
});
