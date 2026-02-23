import { renderHook, waitFor } from "@testing-library/react";
import { useAnalysisPolling } from "@/hooks/use-analysis-polling";

describe("useAnalysisPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("Given enabled=true와 유효한 ID가 주어졌을 때", () => {
    it("When 훅이 마운트되면 Then 즉시 fetch를 호출해야 한다", async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // When
      renderHook(() => useAnalysisPolling("project-1", "analysis-1", true));

      // Then
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/project-1/analyses/analysis-1",
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it("When 3초가 경과하면 Then 다시 fetch를 호출해야 한다", async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useAnalysisPolling("project-1", "analysis-1", true));

      // Wait for initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // When
      jest.advanceTimersByTime(3000);

      // Then
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it("When 여러 번 폴링하면 Then 3초 간격으로 계속 fetch해야 한다", async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useAnalysisPolling("project-1", "analysis-1", true));

      // Wait for initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // When - advance 9 seconds (3 more intervals)
      jest.advanceTimersByTime(9000);

      // Then
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe("Given 분석 상태가 터미널 상태로 변경될 때", () => {
    it("When status가 COMPLETED가 되면 Then isTerminal=true이고 폴링을 중단해야 한다", async () => {
      // Given
      const inProgressResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      const completedResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "COMPLETED",
          vulnerabilitiesFound: 5,
          criticalCount: 1,
          highCount: 2,
          mediumCount: 1,
          lowCount: 1,
          completedAt: "2024-01-01T00:00:00Z",
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => inProgressResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => completedResponse,
        });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.analysis?.status).toBe("IN_PROGRESS");
        expect(result.current.isTerminal).toBe(false);
      });

      // Advance to second fetch
      jest.advanceTimersByTime(3000);

      // Then
      await waitFor(() => {
        expect(result.current.analysis?.status).toBe("COMPLETED");
        expect(result.current.isTerminal).toBe(true);
      });

      // Verify polling stopped
      const fetchCallsBeforeAdvance = (global.fetch as jest.Mock).mock.calls
        .length;
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(
          fetchCallsBeforeAdvance
        );
      });
    });

    it("When status가 FAILED가 되면 Then isTerminal=true이고 폴링을 중단해야 한다", async () => {
      // Given
      const failedResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "FAILED",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: "2024-01-01T00:00:00Z",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => failedResponse,
      });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then
      await waitFor(() => {
        expect(result.current.analysis?.status).toBe("FAILED");
        expect(result.current.isTerminal).toBe(true);
      });

      // Verify polling stopped
      expect(global.fetch).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it("When status가 CANCELLED가 되면 Then isTerminal=true이고 폴링을 중단해야 한다", async () => {
      // Given
      const cancelledResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "CANCELLED",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => cancelledResponse,
      });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then
      await waitFor(() => {
        expect(result.current.analysis?.status).toBe("CANCELLED");
        expect(result.current.isTerminal).toBe(true);
      });

      // Verify polling stopped
      expect(global.fetch).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Given enabled=false일 때", () => {
    it("When 훅이 마운트되면 Then fetch를 호출하지 않아야 한다", async () => {
      // Given & When
      renderHook(() => useAnalysisPolling("project-1", "analysis-1", false));

      // Then
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance time and verify no polling
      jest.advanceTimersByTime(3000);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("When enabled가 true로 변경되면 Then 폴링을 시작해야 한다", async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { rerender } = renderHook(
        ({ enabled }) => useAnalysisPolling("project-1", "analysis-1", enabled),
        { initialProps: { enabled: false } }
      );

      expect(global.fetch).not.toHaveBeenCalled();

      // When
      rerender({ enabled: true });

      // Then
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Given analysisId=null일 때", () => {
    it("When 훅이 마운트되면 Then fetch를 호출하지 않아야 한다", async () => {
      // Given & When
      renderHook(() => useAnalysisPolling("project-1", null, true));

      // Then
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance time and verify no polling
      jest.advanceTimersByTime(3000);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("When analysisId가 유효한 값으로 변경되면 Then 폴링을 시작해야 한다", async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { rerender } = renderHook(
        ({ analysisId }: { analysisId: string | null }) =>
          useAnalysisPolling("project-1", analysisId, true),
        { initialProps: { analysisId: null as string | null } }
      );

      expect(global.fetch).not.toHaveBeenCalled();

      // When
      rerender({ analysisId: "analysis-1" });

      // Then
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it("When analysisId가 변경되면 Then 상태를 리셋해야 한다", async () => {
      // Given
      const mockResponse1 = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      const mockResponse2 = {
        success: true,
        data: {
          id: "analysis-2",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockResponse2,
        });

      const { result, rerender } = renderHook(
        ({ analysisId }) => useAnalysisPolling("project-1", analysisId, true),
        { initialProps: { analysisId: "analysis-1" } }
      );

      await waitFor(() => {
        expect(result.current.analysis?.id).toBe("analysis-1");
      });

      // When - change analysisId
      rerender({ analysisId: "analysis-2" });

      // Then - state should be reset to null first
      await waitFor(() => {
        expect(result.current.analysis).toBeNull();
        expect(result.current.isTerminal).toBe(false);
      });

      // And polling should restart with new analysis
      await waitFor(() => {
        expect(result.current.analysis?.id).toBe("analysis-2");
        expect(result.current.analysis?.status).toBe("IN_PROGRESS");
      });
    });
  });

  describe("Given fetch 실패 시나리오", () => {
    it("When fetch가 실패하면 Then 크래시하지 않고 다음 인터벌에 재시도해야 한다", async () => {
      // Given
      const mockSuccessResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Wait for initial fetch to fail
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Analysis should remain null
      expect(result.current.analysis).toBeNull();

      // Advance to next interval
      jest.advanceTimersByTime(3000);

      // Then - should retry and succeed
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.current.analysis?.status).toBe("IN_PROGRESS");
      });
    });

    it("When response.ok가 false이면 Then 분석 데이터를 업데이트하지 않고 재시도해야 한다", async () => {
      // Given
      const mockSuccessResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Analysis should remain null
      expect(result.current.analysis).toBeNull();

      // Advance to next interval
      jest.advanceTimersByTime(3000);

      // Then - should retry and succeed
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.current.analysis?.status).toBe("IN_PROGRESS");
      });
    });

    it("When success=false 응답이 오면 Then 분석 데이터를 업데이트하지 않고 재시도해야 한다", async () => {
      // Given
      const mockFailureResponse = {
        success: false,
        error: "Analysis not found",
      };

      const mockSuccessResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFailureResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Analysis should remain null
      expect(result.current.analysis).toBeNull();

      // Advance to next interval
      jest.advanceTimersByTime(3000);

      // Then - should retry and succeed
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.current.analysis?.status).toBe("IN_PROGRESS");
      });
    });
  });

  describe("Given isLoading 상태 관리", () => {
    it("When fetch가 진행 중이면 Then isLoading=true여야 한다", async () => {
      // Given
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then - should be loading during fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Complete the fetch
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: "analysis-1",
            status: "IN_PROGRESS",
            vulnerabilitiesFound: 0,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            completedAt: null,
          },
        }),
      });

      // Should stop loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("When fetch가 실패해도 Then isLoading=false가 되어야 한다", async () => {
      // Given
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Given 컴포넌트 언마운트 시", () => {
    it("When 훅이 언마운트되면 Then 폴링 인터벌을 정리해야 한다", async () => {
      // Given
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "IN_PROGRESS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { unmount } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // When
      unmount();

      // Advance time
      jest.advanceTimersByTime(3000);

      // Then - no additional fetch should happen
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Given 폴링 응답에 logs/reports 필드가 포함될 때", () => {
    it("When 폴링 응답에 logs가 있으면 Then analysis.logs가 노출되어야 한다", async () => {
      // Given
      const logsData = JSON.stringify([
        {
          timestamp: "2024-01-01T00:00:00Z",
          step: "클론",
          level: "info",
          message: "저장소 클론 시작...",
        },
        {
          timestamp: "2024-01-01T00:00:05Z",
          step: "클론",
          level: "info",
          message: "클론 완료",
        },
      ]);
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "STATIC_ANALYSIS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
          logs: logsData,
          staticAnalysisReport: null,
          penetrationTestReport: null,
          stepResults: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then
      await waitFor(() => {
        expect(result.current.analysis?.logs).toBe(logsData);
      });
    });

    it("When 폴링 응답에 staticAnalysisReport가 있으면 Then analysis.staticAnalysisReport가 노출되어야 한다", async () => {
      // Given
      const sastReport = JSON.stringify({
        tool: "semgrep",
        findings: [],
        total: 0,
      });
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "BUILDING",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
          logs: null,
          staticAnalysisReport: sastReport,
          penetrationTestReport: null,
          stepResults: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then
      await waitFor(() => {
        expect(result.current.analysis?.staticAnalysisReport).toBe(sastReport);
      });
    });

    it("When 폴링 응답에 penetrationTestReport가 있으면 Then analysis.penetrationTestReport가 노출되어야 한다", async () => {
      // Given
      const dastReport = JSON.stringify({
        tool: "nuclei",
        findings: [],
        total: 0,
      });
      const mockResponse = {
        success: true,
        data: {
          id: "analysis-1",
          status: "EXPLOIT_VERIFICATION",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          completedAt: null,
          logs: null,
          staticAnalysisReport: null,
          penetrationTestReport: dastReport,
          stepResults: null,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // When
      const { result } = renderHook(() =>
        useAnalysisPolling("project-1", "analysis-1", true)
      );

      // Then
      await waitFor(() => {
        expect(result.current.analysis?.penetrationTestReport).toBe(dastReport);
      });
    });
  });
});
