/**
 * DeleteAccountButton Component Tests
 *
 * 계정 삭제 버튼 UI, 인터랙션, 구독 가드 테스트
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithLocale } from "@/__tests__/test-utils";
import { DeleteAccountButton } from "@/components/user/delete-account-button";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

import { signOut } from "next-auth/react";
const mockSignOut = signOut as jest.Mock;

// Mock fetch
global.fetch = jest.fn();

describe("DeleteAccountButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("렌더링 (한국어)", () => {
    it("GIVEN 구독 없음 WHEN 컴포넌트 렌더링 THEN 계정 삭제 버튼이 표시되어야 한다", () => {
      renderWithLocale(<DeleteAccountButton />, "ko");

      expect(screen.getByText("계정 삭제")).toBeInTheDocument();
    });

    it("GIVEN 영어 로케일 WHEN 컴포넌트 렌더링 THEN 영어 삭제 버튼이 표시되어야 한다", () => {
      renderWithLocale(<DeleteAccountButton />, "en");

      expect(screen.getByText("Delete account")).toBeInTheDocument();
    });
  });

  describe("구독 가드", () => {
    it("GIVEN 활성 구독 WHEN 컴포넌트 렌더링 THEN 삭제 버튼 비활성화 + 구독 취소 안내", () => {
      renderWithLocale(
        <DeleteAccountButton hasActiveSubscription={true} />,
        "ko"
      );

      expect(
        screen.getByText("계정을 삭제하려면 먼저 구독을 취소해야 합니다.")
      ).toBeInTheDocument();
      expect(screen.getByText("구독 관리로 이동")).toBeInTheDocument();
      expect(screen.queryByText("계정 삭제")).not.toBeInTheDocument();
    });

    it("GIVEN 활성 구독 + 영어 WHEN 컴포넌트 렌더링 THEN 영어 안내 표시", () => {
      renderWithLocale(
        <DeleteAccountButton hasActiveSubscription={true} />,
        "en"
      );

      expect(
        screen.getByText(
          "You must cancel your subscription before deleting your account."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Go to Subscription")).toBeInTheDocument();
    });

    it("GIVEN 비활성 구독 WHEN 컴포넌트 렌더링 THEN 삭제 버튼 활성화", () => {
      renderWithLocale(
        <DeleteAccountButton hasActiveSubscription={false} />,
        "ko"
      );

      expect(screen.getByText("계정 삭제")).toBeInTheDocument();
    });
  });

  describe("확인 단계", () => {
    it("GIVEN 초기 상태 WHEN 계정 삭제 버튼 클릭 THEN 확인 버튼들이 표시되어야 한다", async () => {
      const user = userEvent.setup();
      renderWithLocale(<DeleteAccountButton />, "ko");

      await user.click(screen.getByText("계정 삭제"));

      expect(
        screen.getByRole("button", { name: "정말 삭제합니다" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    });

    it("GIVEN 확인 상태 WHEN 취소 버튼 클릭 THEN 초기 상태로 돌아가야 한다", async () => {
      const user = userEvent.setup();
      renderWithLocale(<DeleteAccountButton />, "ko");
      await user.click(screen.getByText("계정 삭제"));

      await user.click(screen.getByRole("button", { name: "취소" }));

      expect(
        screen.queryByRole("button", { name: "정말 삭제합니다" })
      ).not.toBeInTheDocument();
      expect(screen.getByText("계정 삭제")).toBeInTheDocument();
    });
  });

  describe("계정 삭제 실행", () => {
    it("GIVEN 확인 상태 WHEN '정말 삭제합니다' 클릭 THEN API가 호출되어야 한다", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      renderWithLocale(<DeleteAccountButton />, "ko");
      await user.click(screen.getByText("계정 삭제"));

      await user.click(screen.getByRole("button", { name: "정말 삭제합니다" }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/user/delete", {
          method: "DELETE",
        });
      });
    });

    it("GIVEN 삭제 성공 WHEN API 응답 성공 THEN signOut이 호출되어야 한다", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      renderWithLocale(<DeleteAccountButton />, "ko");
      await user.click(screen.getByText("계정 삭제"));

      await user.click(screen.getByRole("button", { name: "정말 삭제합니다" }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
      });
    });

    it("GIVEN 삭제 실패 WHEN API 에러 THEN 에러 메시지가 표시되어야 한다", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "계정 삭제에 실패했습니다",
          }),
      });
      renderWithLocale(<DeleteAccountButton />, "ko");
      await user.click(screen.getByText("계정 삭제"));

      await user.click(screen.getByRole("button", { name: "정말 삭제합니다" }));

      await waitFor(() => {
        expect(
          screen.getByText("계정 삭제에 실패했습니다")
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 삭제 진행 중 WHEN 로딩 상태 THEN 버튼이 비활성화되어야 한다", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              1000
            )
          )
      );
      renderWithLocale(<DeleteAccountButton />, "ko");
      await user.click(screen.getByText("계정 삭제"));

      await user.click(screen.getByRole("button", { name: "정말 삭제합니다" }));

      await waitFor(() => {
        expect(screen.getByText("삭제 중...")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "삭제 중..." })).toBeDisabled();
    });
  });
});
