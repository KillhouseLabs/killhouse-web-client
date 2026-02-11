/**
 * DeleteAccountButton Component Tests
 *
 * 계정 삭제 버튼 UI 및 인터랙션 테스트
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountButton } from "@/components/user/delete-account-button";

// Mock next-auth/react
const mockSignOut = jest.fn();
jest.mock("next-auth/react", () => ({
  signOut: mockSignOut,
}));

// Mock fetch
global.fetch = jest.fn();

describe("DeleteAccountButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("렌더링", () => {
    it("GIVEN 마이페이지 접속 WHEN 컴포넌트 렌더링 THEN 계정 삭제 버튼이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<DeleteAccountButton />);

      // THEN
      expect(screen.getByText("계정 삭제")).toBeInTheDocument();
    });
  });

  describe("1단계 확인", () => {
    it("GIVEN 초기 상태 WHEN 계정 삭제 버튼 클릭 THEN 첫 번째 확인 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<DeleteAccountButton />);

      // WHEN
      await user.click(screen.getByText("계정 삭제"));

      // THEN
      expect(
        screen.getByText("정말로 계정을 삭제하시겠습니까?")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "네, 삭제합니다" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "취소" })
      ).toBeInTheDocument();
    });

    it("GIVEN 1단계 확인 상태 WHEN 취소 버튼 클릭 THEN 초기 상태로 돌아가야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));

      // WHEN
      await user.click(screen.getByRole("button", { name: "취소" }));

      // THEN
      expect(
        screen.queryByText("정말로 계정을 삭제하시겠습니까?")
      ).not.toBeInTheDocument();
      expect(screen.getByText("계정 삭제")).toBeInTheDocument();
    });
  });

  describe("2단계 확인", () => {
    it("GIVEN 1단계 확인 상태 WHEN '네, 삭제합니다' 클릭 THEN 두 번째 확인 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));

      // WHEN
      await user.click(screen.getByRole("button", { name: "네, 삭제합니다" }));

      // THEN
      expect(
        screen.getByText("마지막 확인입니다. 이 작업은 되돌릴 수 없습니다.")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "계정 영구 삭제" })
      ).toBeInTheDocument();
    });

    it("GIVEN 2단계 확인 상태 WHEN 취소 버튼 클릭 THEN 초기 상태로 돌아가야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));
      await user.click(screen.getByRole("button", { name: "네, 삭제합니다" }));

      // WHEN
      await user.click(screen.getByRole("button", { name: "취소" }));

      // THEN
      expect(
        screen.queryByText("마지막 확인입니다")
      ).not.toBeInTheDocument();
      expect(screen.getByText("계정 삭제")).toBeInTheDocument();
    });
  });

  describe("계정 삭제 실행", () => {
    it("GIVEN 2단계 확인 상태 WHEN '계정 영구 삭제' 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));
      await user.click(screen.getByRole("button", { name: "네, 삭제합니다" }));

      // WHEN
      await user.click(screen.getByRole("button", { name: "계정 영구 삭제" }));

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/user/delete", {
          method: "DELETE",
        });
      });
    });

    it("GIVEN 삭제 성공 WHEN API 응답 성공 THEN signOut이 호출되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));
      await user.click(screen.getByRole("button", { name: "네, 삭제합니다" }));

      // WHEN
      await user.click(screen.getByRole("button", { name: "계정 영구 삭제" }));

      // THEN
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
      });
    });

    it("GIVEN 삭제 실패 WHEN API 에러 THEN 에러 메시지가 표시되어야 한다", async () => {
      // GIVEN
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "계정 삭제 중 오류가 발생했습니다",
          }),
      });
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));
      await user.click(screen.getByRole("button", { name: "네, 삭제합니다" }));

      // WHEN
      await user.click(screen.getByRole("button", { name: "계정 영구 삭제" }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("계정 삭제 중 오류가 발생했습니다")
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 삭제 진행 중 WHEN 로딩 상태 THEN 버튼이 비활성화되어야 한다", async () => {
      // GIVEN
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
      render(<DeleteAccountButton />);
      await user.click(screen.getByText("계정 삭제"));
      await user.click(screen.getByRole("button", { name: "네, 삭제합니다" }));

      // WHEN
      await user.click(screen.getByRole("button", { name: "계정 영구 삭제" }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("삭제 중...")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "삭제 중..." })).toBeDisabled();
    });
  });
});
