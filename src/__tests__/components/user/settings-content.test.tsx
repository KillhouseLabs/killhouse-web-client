import { screen, waitFor } from "@testing-library/react";
import { renderWithLocale } from "@/__tests__/test-utils";
import { SettingsContent } from "@/components/user/settings-content";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: null,
      },
    },
  })),
}));

// Mock DeleteAccountButton component — capture props
jest.mock("@/components/user/delete-account-button", () => ({
  DeleteAccountButton: ({
    hasActiveSubscription,
  }: {
    hasActiveSubscription?: boolean;
  }) => (
    <div
      data-testid="delete-account-button"
      data-active-subscription={String(!!hasActiveSubscription)}
    >
      DeleteAccountButton
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe("SettingsContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "CANCELLED", planId: "free" }),
    });
  });

  describe("영어 로케일 렌더링", () => {
    it("GIVEN 영어 로케일 WHEN 컴포넌트 렌더링 THEN 페이지 제목이 'Settings'로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(
        screen.getByRole("heading", { name: "Settings" })
      ).toBeInTheDocument();
    });

    it("GIVEN 영어 로케일 WHEN 컴포넌트 렌더링 THEN 섹션 제목들이 영어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(
        screen.getByRole("heading", { name: "Profile" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Security" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Account Management" })
      ).toBeInTheDocument();
    });

    it("GIVEN 영어 로케일 WHEN 프로필 섹션 렌더링 THEN 프로필 레이블들이 영어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Email cannot be changed")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Save changes" })
      ).toBeInTheDocument();
    });

    it("GIVEN 영어 로케일 WHEN 보안 섹션 렌더링 THEN 비밀번호 레이블들이 영어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(screen.getByText("Change Password")).toBeInTheDocument();
      expect(screen.getByText("Current password")).toBeInTheDocument();
      expect(screen.getByText("New password")).toBeInTheDocument();
      expect(screen.getByText("Confirm new password")).toBeInTheDocument();
    });

    it("GIVEN 영어 로케일 WHEN 계정 관리 섹션 렌더링 THEN 계정 삭제 설명이 영어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(
        screen.getByText(
          "Deleting your account will permanently remove all data and cannot be undone."
        )
      ).toBeInTheDocument();
    });
  });

  describe("한국어 로케일 렌더링", () => {
    it("GIVEN 한국어 로케일 WHEN 컴포넌트 렌더링 THEN 페이지 제목이 '설정'으로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "ko");

      expect(screen.getByRole("heading", { name: "설정" })).toBeInTheDocument();
    });

    it("GIVEN 한국어 로케일 WHEN 컴포넌트 렌더링 THEN 섹션 제목들이 한국어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "ko");

      expect(
        screen.getByRole("heading", { name: "프로필" })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "보안" })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "계정 관리" })
      ).toBeInTheDocument();
    });

    it("GIVEN 한국어 로케일 WHEN 프로필 섹션 렌더링 THEN 프로필 레이블들이 한국어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "ko");

      expect(screen.getByText("이름")).toBeInTheDocument();
      expect(screen.getByText("이메일")).toBeInTheDocument();
      expect(
        screen.getByText("이메일은 변경할 수 없습니다")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "변경사항 저장" })
      ).toBeInTheDocument();
    });

    it("GIVEN 한국어 로케일 WHEN 보안 섹션 렌더링 THEN 비밀번호 레이블들이 한국어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "ko");

      expect(screen.getByText("비밀번호 변경")).toBeInTheDocument();
      expect(screen.getByText("현재 비밀번호")).toBeInTheDocument();
      expect(screen.getByText("새 비밀번호")).toBeInTheDocument();
      expect(screen.getByText("새 비밀번호 확인")).toBeInTheDocument();
    });

    it("GIVEN 한국어 로케일 WHEN 계정 관리 섹션 렌더링 THEN 계정 삭제 설명이 한국어로 표시된다", () => {
      renderWithLocale(<SettingsContent />, "ko");

      expect(
        screen.getByText(
          "계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다."
        )
      ).toBeInTheDocument();
    });
  });

  describe("세션 데이터 렌더링", () => {
    it("GIVEN 사용자 세션 WHEN 컴포넌트 렌더링 THEN 사용자 정보가 표시된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });
  });

  describe("하위 컴포넌트 렌더링", () => {
    it("GIVEN 계정 관리 섹션 WHEN 컴포넌트 렌더링 THEN DeleteAccountButton이 렌더링된다", () => {
      renderWithLocale(<SettingsContent />, "en");

      expect(screen.getByTestId("delete-account-button")).toBeInTheDocument();
    });
  });

  describe("구독 상태 전달", () => {
    it("GIVEN 활성 구독 WHEN 컴포넌트 렌더링 THEN DeleteAccountButton에 hasActiveSubscription=true 전달", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "ACTIVE", planId: "pro" }),
      });

      renderWithLocale(<SettingsContent />, "en");

      await waitFor(() => {
        expect(screen.getByTestId("delete-account-button")).toHaveAttribute(
          "data-active-subscription",
          "true"
        );
      });
    });

    it("GIVEN 비활성 구독 WHEN 컴포넌트 렌더링 THEN DeleteAccountButton에 hasActiveSubscription=false 전달", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "CANCELLED", planId: "free" }),
      });

      renderWithLocale(<SettingsContent />, "en");

      await waitFor(() => {
        expect(screen.getByTestId("delete-account-button")).toHaveAttribute(
          "data-active-subscription",
          "false"
        );
      });
    });

    it("GIVEN API 실패 WHEN 컴포넌트 렌더링 THEN DeleteAccountButton에 hasActiveSubscription=false 전달", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      renderWithLocale(<SettingsContent />, "en");

      await waitFor(() => {
        expect(screen.getByTestId("delete-account-button")).toHaveAttribute(
          "data-active-subscription",
          "false"
        );
      });
    });
  });
});
