/**
 * LoginForm Component Tests
 *
 * 로그인 폼 UI 및 인터랙션 테스트
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { LoginForm } from "@/components/auth/login-form";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("렌더링", () => {
    it("GIVEN 로그인 페이지 접속 WHEN 컴포넌트 렌더링 THEN 모든 필수 요소가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<LoginForm />);

      // THEN
      expect(screen.getByText("로그인")).toBeInTheDocument();
      expect(screen.getByLabelText("이메일")).toBeInTheDocument();
      expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
      expect(screen.getByText("Google로 계속하기")).toBeInTheDocument();
      expect(screen.getByText("GitHub로 계속하기")).toBeInTheDocument();
    });

    it("GIVEN 로그인 페이지 접속 WHEN 컴포넌트 렌더링 THEN 회원가입 링크가 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<LoginForm />);

      // THEN
      expect(screen.getByText("회원가입")).toBeInTheDocument();
      expect(screen.getByText("비밀번호 찾기")).toBeInTheDocument();
    });
  });

  describe("입력 검증", () => {
    it("GIVEN 빈 폼 WHEN 로그인 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<LoginForm />);

      // WHEN
      await user.click(screen.getByRole("button", { name: "로그인" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("이메일과 비밀번호를 입력하세요")
        ).toBeInTheDocument();
      });
      expect(signIn).not.toHaveBeenCalled();
    });

    it("GIVEN 이메일만 입력 WHEN 로그인 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<LoginForm />);

      // WHEN
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.click(screen.getByRole("button", { name: "로그인" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("이메일과 비밀번호를 입력하세요")
        ).toBeInTheDocument();
      });
      expect(signIn).not.toHaveBeenCalled();
    });

    it("GIVEN 잘못된 이메일 형식 WHEN 로그인 버튼 클릭 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<LoginForm />);

      // WHEN
      await user.type(screen.getByLabelText("이메일"), "invalid-email");
      await user.type(screen.getByLabelText("비밀번호"), "password123");
      await user.click(screen.getByRole("button", { name: "로그인" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("올바른 이메일 주소를 입력하세요")
        ).toBeInTheDocument();
      });
      expect(signIn).not.toHaveBeenCalled();
    });
  });

  describe("로그인 시도", () => {
    it("GIVEN 유효한 입력 WHEN 로그인 버튼 클릭 THEN signIn이 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });
      render(<LoginForm />);

      // WHEN
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "password123");
      await user.click(screen.getByRole("button", { name: "로그인" }));

      // THEN
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com",
          password: "password123",
          redirect: false,
        });
      });
    });

    it("GIVEN 로그인 실패 WHEN signIn 에러 반환 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({
        ok: false,
        error: "CredentialsSignin",
      });
      render(<LoginForm />);

      // WHEN
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "wrongpassword");
      await user.click(screen.getByRole("button", { name: "로그인" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("이메일 또는 비밀번호가 올바르지 않습니다")
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 로그인 진행 중 WHEN 로딩 상태 THEN 버튼이 비활성화되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (signIn as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<LoginForm />);

      // WHEN
      await user.type(screen.getByLabelText("이메일"), "test@example.com");
      await user.type(screen.getByLabelText("비밀번호"), "password123");
      await user.click(screen.getByRole("button", { name: "로그인" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("로그인 중...")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "로그인 중..." })).toBeDisabled();
    });
  });

  describe("소셜 로그인", () => {
    it("GIVEN Google 버튼 클릭 WHEN 소셜 로그인 시도 THEN signIn이 google provider로 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<LoginForm />);

      // WHEN
      await user.click(screen.getByText("Google로 계속하기"));

      // THEN
      expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/dashboard" });
    });

    it("GIVEN GitHub 버튼 클릭 WHEN 소셜 로그인 시도 THEN signIn이 github provider로 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<LoginForm />);

      // WHEN
      await user.click(screen.getByText("GitHub로 계속하기"));

      // THEN
      expect(signIn).toHaveBeenCalledWith("github", { callbackUrl: "/dashboard" });
    });
  });
});
