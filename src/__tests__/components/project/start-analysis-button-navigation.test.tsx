/**
 * StartAnalysisButton - Navigation Tests (Phase 2)
 *
 * 분석 시작 후 분석 상세 페이지로 자동 이동
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StartAnalysisButton } from "@/components/project/start-analysis-button";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock UpgradeModal component
jest.mock("@/components/subscription/upgrade-modal", () => ({
  UpgradeModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="upgrade-modal">
        <button onClick={onClose}>나중에</button>
      </div>
    );
  },
}));

describe("StartAnalysisButton - Navigation (Phase 2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("분석 시작 후 상세 페이지 이동", () => {
    it("GIVEN 분석 시작 성공 WHEN POST 응답 수신 THEN router.push가 분석 상세 페이지 경로로 호출되어야 한다", async () => {
      // GIVEN - subscription check returns success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              analysisThisMonth: { current: 5, limit: 100 },
            },
          }),
        })
        // POST analysis returns success with analysis ID
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: "new-analysis-id",
              status: "SCANNING",
              branch: "main",
            },
          }),
        });

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/projects/project-123/analyses/new-analysis-id"
        );
      });
    });

    it("GIVEN 분석 시작 성공 WHEN POST 응답에 analysis ID 포함 THEN /projects/{projectId}/analyses/{analysisId} 경로로 이동해야 한다", async () => {
      // GIVEN
      const projectId = "test-project-456";
      const analysisId = "analysis-abc-def";

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              analysisThisMonth: { current: 10, limit: -1 }, // unlimited
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: analysisId,
              status: "SCANNING",
              branch: "main",
              commitHash: "abc123",
            },
          }),
        });

      render(<StartAnalysisButton projectId={projectId} />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          `/projects/${projectId}/analyses/${analysisId}`
        );
      });
    });

    it("GIVEN 분석 시작 실패 WHEN POST 응답이 에러 THEN router.push가 호출되지 않아야 한다", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              analysisThisMonth: { current: 5, limit: 100 },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: "분석을 시작할 수 없습니다",
          }),
        });

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText("분석을 시작할 수 없습니다")
        ).toBeInTheDocument();
      });

      // router.push should NOT be called
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("GIVEN 구독 한도 초과 WHEN 업그레이드 모달 표시 THEN router.push가 호출되지 않아야 한다", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              analysisThisMonth: { current: 100, limit: 100 }, // limit exceeded
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({
            success: false,
            code: "LIMIT_EXCEEDED",
            error: "분석 한도를 초과했습니다",
            usage: { current: 100, limit: 100 },
          }),
        });

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN - upgrade modal should be shown
      await waitFor(() => {
        expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument();
      });

      // router.push should NOT be called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("onStart 콜백 호환성", () => {
    it("GIVEN onStart prop 제공됨 WHEN 분석 시작 성공 THEN router.push 전에 onStart가 호출되어야 한다", async () => {
      // GIVEN
      const onStart = jest.fn();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: {
              analysisThisMonth: { current: 5, limit: 100 },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: {
              id: "new-analysis-id",
              status: "SCANNING",
            },
          }),
        });

      render(<StartAnalysisButton projectId="project-123" onStart={onStart} />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN
      await waitFor(
        () => {
          expect(onStart).toHaveBeenCalled();
          expect(mockPush).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it("GIVEN onStart prop 없음 WHEN 분석 시작 성공 THEN router.push만 호출되어야 한다", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              analysisThisMonth: { current: 5, limit: 100 },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: "new-analysis-id",
              status: "SCANNING",
            },
          }),
        });

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/projects/project-123/analyses/new-analysis-id"
        );
      });
    });
  });

  describe("구독 체크 중 에러", () => {
    it("GIVEN 구독 정보 확인 실패 WHEN 버튼 클릭 THEN router.push가 호출되지 않아야 한다", async () => {
      // GIVEN
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: "Server error",
        }),
      });

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN - component shows hardcoded message when subscriptionResponse.ok is false
      await waitFor(
        () => {
          expect(
            screen.getByText("구독 정보를 확인할 수 없습니다")
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("GIVEN 네트워크 에러 WHEN 구독 체크 중 THEN router.push가 호출되지 않아야 한다", async () => {
      // GIVEN - Mock fetch to reject to simulate network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN - handleClick catch block shows generic error message
      await waitFor(
        () => {
          expect(screen.getByText("오류가 발생했습니다")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("분석 시작 중 에러", () => {
    it("GIVEN 네트워크 에러 WHEN 분석 POST 중 THEN router.push가 호출되지 않아야 한다", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              analysisThisMonth: { current: 5, limit: 100 },
            },
          }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      render(<StartAnalysisButton projectId="project-123" />);

      // WHEN
      fireEvent.click(screen.getByRole("button", { name: /분석 시작/ }));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("오류가 발생했습니다")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
