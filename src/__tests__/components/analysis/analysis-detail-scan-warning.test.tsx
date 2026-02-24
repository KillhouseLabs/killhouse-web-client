/**
 * AnalysisDetail Scan Warning Tests (Phase 1)
 *
 * 분석 진행 중 "스캔이 실행되지 않았습니다" 경고가 표시되지 않도록 수정
 */

import { render, screen } from "@testing-library/react";
import { AnalysisDetail } from "@/components/analysis/analysis-detail";
import { useAnalysisPolling } from "@/hooks/use-analysis-polling";

// Mock react-diff-viewer-continued (ESM module incompatible with Jest)
jest.mock("react-diff-viewer-continued", () => {
  return {
    __esModule: true,
    default: ({
      oldValue,
      newValue,
    }: {
      oldValue: string;
      newValue: string;
    }) => (
      <div data-testid="diff-viewer">
        <pre>{oldValue}</pre>
        <pre>{newValue}</pre>
      </div>
    ),
  };
});

// Mock react-markdown (ESM module incompatible with Jest)
jest.mock("react-markdown", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => <div>{children}</div>,
  };
});

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: () => {},
}));

// Mock useAnalysisPolling hook
jest.mock("@/hooks/use-analysis-polling", () => ({
  useAnalysisPolling: jest.fn().mockReturnValue({
    analysis: null,
    isTerminal: false,
    isLoading: false,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock router
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

interface Analysis {
  id: string;
  status: string;
  branch: string;
  commitHash: string | null;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  executiveSummary: string | null;
  stepResults: string | null;
  exploitSessionId: string | null;
  logs?: string | null;
  startedAt: Date;
  completedAt: Date | null;
  repository?: { id: string; name: string; provider: string } | null;
}

const mockAnalysisInProgressNoFindings: Analysis = {
  id: "analysis-scanning",
  status: "SCANNING",
  branch: "main",
  commitHash: null,
  vulnerabilitiesFound: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  infoCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
  startedAt: new Date("2024-02-24T10:00:00Z"),
  completedAt: null,
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

const mockAnalysisCompletedNoScan: Analysis = {
  id: "analysis-completed-no-scan",
  status: "COMPLETED",
  branch: "main",
  commitHash: "abc1234",
  vulnerabilitiesFound: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  infoCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
  startedAt: new Date("2024-02-24T10:00:00Z"),
  completedAt: new Date("2024-02-24T10:05:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

const mockAnalysisCompletedSuccessfulScanNoVulns: Analysis = {
  id: "analysis-completed-success",
  status: "COMPLETED",
  branch: "main",
  commitHash: "def5678",
  vulnerabilitiesFound: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  infoCount: 0,
  staticAnalysisReport: JSON.stringify({
    tool: "semgrep",
    findings: [],
    total: 0,
    step_result: { status: "success", findings_count: 0 },
  }),
  penetrationTestReport: JSON.stringify({
    tool: "nuclei",
    findings: [],
    total: 0,
    step_result: { status: "success", findings_count: 0 },
  }),
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
  startedAt: new Date("2024-02-24T10:00:00Z"),
  completedAt: new Date("2024-02-24T10:10:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

describe("AnalysisDetail - Scan Warning (Phase 1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("진행 중인 분석에서 경고 숨김", () => {
    it("GIVEN 분석 상태가 SCANNING WHEN 상세 페이지 렌더링 THEN 노란색 스캔 미실행 경고가 표시되지 않아야 한다", () => {
      // GIVEN - analysis in SCANNING status, 0 vulnerabilities
      const analysis = mockAnalysisInProgressNoFindings;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - yellow warning should NOT be shown
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 STATIC_ANALYSIS WHEN 상세 페이지 렌더링 THEN 노란색 스캔 미실행 경고가 표시되지 않아야 한다", () => {
      // GIVEN
      const analysis: Analysis = {
        ...mockAnalysisInProgressNoFindings,
        status: "STATIC_ANALYSIS",
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 BUILDING WHEN 상세 페이지 렌더링 THEN 노란색 스캔 미실행 경고가 표시되지 않아야 한다", () => {
      // GIVEN
      const analysis: Analysis = {
        ...mockAnalysisInProgressNoFindings,
        status: "BUILDING",
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 PENETRATION_TEST WHEN 상세 페이지 렌더링 THEN 노란색 스캔 미실행 경고가 표시되지 않아야 한다", () => {
      // GIVEN
      const analysis: Analysis = {
        ...mockAnalysisInProgressNoFindings,
        status: "PENETRATION_TEST",
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });
  });

  describe("완료된 분석에서 경고 표시", () => {
    it("GIVEN 분석 상태가 COMPLETED AND 성공한 스캔 없음 WHEN 상세 페이지 렌더링 THEN 노란색 스캔 미실행 경고가 표시되어야 한다", () => {
      // GIVEN - completed analysis with no scan reports
      const analysis = mockAnalysisCompletedNoScan;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - yellow warning should be shown
      expect(
        screen.getByText("스캔이 실행되지 않았습니다")
      ).toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 COMPLETED AND 성공한 스캔 AND 0개 취약점 WHEN 상세 페이지 렌더링 THEN 초록색 안전 메시지가 표시되어야 한다", () => {
      // GIVEN - completed analysis with successful scans but 0 vulnerabilities
      const analysis = mockAnalysisCompletedSuccessfulScanNoVulns;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - green success message should be shown
      expect(
        screen.getByText("취약점이 발견되지 않았습니다")
      ).toBeInTheDocument();
      // Yellow warning should NOT be shown
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 FAILED AND 성공한 스캔 없음 WHEN 상세 페이지 렌더링 THEN 실패 메시지가 표시되어야 한다", () => {
      // GIVEN
      const analysis: Analysis = {
        ...mockAnalysisCompletedNoScan,
        status: "FAILED",
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - FAILED status shows failure message instead of vulnerability section
      expect(screen.getByText("분석에 실패했습니다")).toBeInTheDocument();
      // Vulnerability section should not be shown
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 COMPLETED_WITH_ERRORS AND 성공한 스캔 없음 WHEN 상세 페이지 렌더링 THEN 노란색 스캔 미실행 경고가 표시되어야 한다", () => {
      // GIVEN
      const analysis: Analysis = {
        ...mockAnalysisCompletedNoScan,
        status: "COMPLETED_WITH_ERRORS",
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(
        screen.getByText("스캔이 실행되지 않았습니다")
      ).toBeInTheDocument();
    });

    it("GIVEN 분석 상태가 CANCELLED AND 성공한 스캔 없음 WHEN 상세 페이지 렌더링 THEN 취소 상태이므로 취약점 섹션이 표시되지 않아야 한다", () => {
      // GIVEN
      const analysis: Analysis = {
        ...mockAnalysisCompletedNoScan,
        status: "CANCELLED",
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - CANCELLED status doesn't show vulnerability section
      expect(
        screen.queryByText("스캔이 실행되지 않았습니다")
      ).not.toBeInTheDocument();
    });
  });

  describe("폴링 업데이트로 상태 변경", () => {
    it("GIVEN 초기 상태 SCANNING AND 폴링으로 COMPLETED로 변경됨 WHEN 업데이트 수신 THEN 경고가 표시되어야 한다", () => {
      // GIVEN - polledAnalysis returns COMPLETED status
      jest.mocked(useAnalysisPolling).mockReturnValue({
        analysis: {
          id: "analysis-scanning",
          status: "COMPLETED",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          completedAt: "2024-02-24T10:05:00.000Z",
          logs: null,
          staticAnalysisReport: null,
          penetrationTestReport: null,
          stepResults: null,
        },
        isTerminal: true,
        isLoading: false,
      });

      const analysis = mockAnalysisInProgressNoFindings;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - warning should be shown based on polled status
      expect(
        screen.getByText("스캔이 실행되지 않았습니다")
      ).toBeInTheDocument();
    });

    it("GIVEN 초기 DB 상태 COMPLETED (0 vulns, no scan) WHEN 페이지 로드 THEN 경고가 즉시 표시되어야 한다", () => {
      // GIVEN - This tests the edge case where analysis prop itself is already COMPLETED
      // from SSR/initial load (not from polling)
      const analysis = mockAnalysisCompletedNoScan;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - warning should be shown
      expect(
        screen.getByText("스캔이 실행되지 않았습니다")
      ).toBeInTheDocument();
    });
  });

  describe("종합 시나리오: 분석 생명주기 전체", () => {
    it("GIVEN 분석이 SCANNING → STATIC_ANALYSIS → BUILDING → COMPLETED 순으로 진행 WHEN 각 단계별 상태 THEN 경고는 COMPLETED 될 때만 표시되어야 한다", () => {
      // Test each intermediate status to ensure no warning is shown
      const intermediateStatuses = [
        "SCANNING",
        "STATIC_ANALYSIS",
        "BUILDING",
        "PENETRATION_TEST",
      ];

      intermediateStatuses.forEach((status) => {
        // Reset the mock before each render to ensure no polling data leaks
        jest.mocked(useAnalysisPolling).mockReturnValue({
          analysis: null,
          isTerminal: false,
          isLoading: false,
        });

        const { unmount } = render(
          <AnalysisDetail
            analysis={{
              ...mockAnalysisInProgressNoFindings,
              status,
            }}
            projectId="project-1"
            projectName="Test Project"
          />
        );

        // THEN - no warning during any intermediate status
        expect(
          screen.queryByText("스캔이 실행되지 않았습니다")
        ).not.toBeInTheDocument();

        unmount();
      });

      // Reset mock before final test
      jest.mocked(useAnalysisPolling).mockReturnValue({
        analysis: null,
        isTerminal: false,
        isLoading: false,
      });

      // Finally, test COMPLETED status
      render(
        <AnalysisDetail
          analysis={mockAnalysisCompletedNoScan}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - warning should only appear when COMPLETED
      expect(
        screen.getByText("스캔이 실행되지 않았습니다")
      ).toBeInTheDocument();
    });
  });
});
