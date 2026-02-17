/**
 * AnalysisDetail Component Tests
 *
 * 분석 상세 보기 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalysisDetail } from "@/components/analysis/analysis-detail";

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
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  startedAt: Date;
  completedAt: Date | null;
  repository?: { id: string; name: string; provider: string } | null;
}

const mockAnalysisWithVulnerabilities: Analysis = {
  id: "analysis-1",
  status: "COMPLETED",
  branch: "main",
  commitHash: "abc1234",
  vulnerabilitiesFound: 10,
  criticalCount: 2,
  highCount: 3,
  mediumCount: 4,
  lowCount: 1,
  staticAnalysisReport: JSON.stringify({
    tool: "semgrep",
    findings: [
      {
        id: "finding-1",
        severity: "CRITICAL",
        file: "src/app.ts",
        line: 42,
        rule_id: "javascript.express.security.audit.xss",
        message: "Potential XSS vulnerability",
      },
      {
        id: "finding-2",
        severity: "HIGH",
        file: "src/auth.ts",
        line: 15,
        rule_id: "javascript.jwt.security.jwt-hardcode",
        message: "Hardcoded JWT secret",
      },
    ],
    total: 2,
    summary: "SAST scan completed",
  }),
  penetrationTestReport: JSON.stringify({
    tool: "nuclei",
    findings: [
      {
        id: "finding-3",
        severity: "MEDIUM",
        url: "https://example.com/api",
        template_id: "http-missing-security-headers",
        message: "Missing security headers",
      },
    ],
    total: 1,
    summary: "DAST scan completed",
  }),
  startedAt: new Date("2024-02-17T10:00:00Z"),
  completedAt: new Date("2024-02-17T10:15:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

const mockAnalysisWithoutVulnerabilities: Analysis = {
  id: "analysis-2",
  status: "COMPLETED",
  branch: "main",
  commitHash: "def5678",
  vulnerabilitiesFound: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  startedAt: new Date("2024-02-17T11:00:00Z"),
  completedAt: new Date("2024-02-17T11:10:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

const mockAnalysisInProgress: Analysis = {
  id: "analysis-3",
  status: "SCANNING",
  branch: "develop",
  commitHash: null,
  vulnerabilitiesFound: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  startedAt: new Date("2024-02-17T12:00:00Z"),
  completedAt: null,
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

const mockAnalysisFailed: Analysis = {
  id: "analysis-4",
  status: "FAILED",
  branch: "feature/test",
  commitHash: "ghi9012",
  vulnerabilitiesFound: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  startedAt: new Date("2024-02-17T13:00:00Z"),
  completedAt: new Date("2024-02-17T13:05:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

describe("AnalysisDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("완료된 분석 - 취약점 있음", () => {
    it("GIVEN 취약점이 있는 완료된 분석 WHEN 컴포넌트 렌더링 THEN 취약점 요약 카드가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("Critical")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Low")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // Critical count
      expect(screen.getByText("3")).toBeInTheDocument(); // High count
      expect(screen.getByText("4")).toBeInTheDocument(); // Medium count
      expect(screen.getByText("1")).toBeInTheDocument(); // Low count
    });

    it("GIVEN 취약점이 있는 완료된 분석 WHEN 컴포넌트 렌더링 THEN SAST 분석 결과 테이블이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

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
        screen.getByText("SAST 분석 결과 (정적 분석) (2개)")
      ).toBeInTheDocument();
      expect(screen.getByText("src/app.ts")).toBeInTheDocument();
      expect(screen.getByText("src/auth.ts")).toBeInTheDocument();
      expect(
        screen.getByText("Potential XSS vulnerability")
      ).toBeInTheDocument();
      expect(screen.getByText("Hardcoded JWT secret")).toBeInTheDocument();
    });

    it("GIVEN 취약점이 있는 완료된 분석 WHEN 컴포넌트 렌더링 THEN DAST 분석 결과 테이블이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

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
        screen.getByText("DAST 분석 결과 (침투 테스트) (1개)")
      ).toBeInTheDocument();
      expect(screen.getByText("https://example.com/api")).toBeInTheDocument();
      expect(
        screen.getByText("http-missing-security-headers")
      ).toBeInTheDocument();
      expect(screen.getByText("Missing security headers")).toBeInTheDocument();
    });

    it("GIVEN 취약점이 있는 완료된 분석 WHEN 컴포넌트 렌더링 THEN 재실행 버튼이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("재실행")).toBeInTheDocument();
    });
  });

  describe("완료된 분석 - 취약점 없음", () => {
    it("GIVEN 취약점이 없는 완료된 분석 WHEN 컴포넌트 렌더링 THEN 안전 메시지가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithoutVulnerabilities;

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
        screen.getByText("취약점이 발견되지 않았습니다")
      ).toBeInTheDocument();
      expect(screen.getByText("안전한 코드베이스입니다.")).toBeInTheDocument();
    });

    it("GIVEN 취약점이 없는 완료된 분석 WHEN 컴포넌트 렌더링 THEN 취약점 요약 카드가 표시되지 않아야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithoutVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.queryByText("Critical")).not.toBeInTheDocument();
      expect(screen.queryByText("High")).not.toBeInTheDocument();
      expect(screen.queryByText("Medium")).not.toBeInTheDocument();
      expect(screen.queryByText("Low")).not.toBeInTheDocument();
    });

    it("GIVEN 취약점이 없는 완료된 분석 WHEN 컴포넌트 렌더링 THEN 재실행 버튼이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithoutVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("재실행")).toBeInTheDocument();
    });
  });

  describe("진행 중인 분석", () => {
    it("GIVEN 진행 중인 분석 WHEN 컴포넌트 렌더링 THEN 진행 중 메시지가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisInProgress;

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
        screen.getByText(
          "분석이 진행 중입니다. 완료되면 자동으로 업데이트됩니다."
        )
      ).toBeInTheDocument();
    });

    it("GIVEN 진행 중인 분석 WHEN 컴포넌트 렌더링 THEN 취소 버튼이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisInProgress;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("취소")).toBeInTheDocument();
    });

    it("GIVEN 진행 중인 분석 WHEN 컴포넌트 렌더링 THEN 재실행 버튼이 표시되지 않아야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisInProgress;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.queryByText("재실행")).not.toBeInTheDocument();
    });

    it("GIVEN 진행 중인 분석 WHEN 취소 버튼 클릭 THEN 취소 확인 모달이 표시되어야 한다", async () => {
      // GIVEN
      const analysis = mockAnalysisInProgress;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );
      const cancelButton = screen.getByText("취소");
      fireEvent.click(cancelButton);

      // THEN
      await waitFor(() => {
        expect(
          screen.getByText(
            "진행 중인 분석을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          )
        ).toBeInTheDocument();
      });
    });

    it("GIVEN 취소 확인 모달 WHEN 분석 취소 버튼 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      const analysis = mockAnalysisInProgress;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );
      const cancelButton = screen.getByText("취소");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "진행 중인 분석을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          )
        ).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText("분석 취소");
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/project-1/analyses/analysis-3",
          expect.objectContaining({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
          })
        );
      });
    });
  });

  describe("실패한 분석", () => {
    it("GIVEN 실패한 분석 WHEN 컴포넌트 렌더링 THEN 실패 메시지가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisFailed;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("분석에 실패했습니다")).toBeInTheDocument();
      expect(
        screen.getByText("잠시 후 다시 시도해주세요.")
      ).toBeInTheDocument();
    });

    it("GIVEN 실패한 분석 WHEN 컴포넌트 렌더링 THEN 재실행 버튼이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisFailed;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("재실행")).toBeInTheDocument();
    });

    it("GIVEN 실패한 분석 WHEN 재실행 버튼 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { id: "analysis-5" } }),
      });
      const analysis = mockAnalysisFailed;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );
      const rerunButton = screen.getByText("재실행");
      fireEvent.click(rerunButton);

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/project-1/analyses",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              repositoryId: "repo-1",
              branch: "feature/test",
            }),
          })
        );
      });
    });

    it("GIVEN 실패한 분석 WHEN 재실행 성공 THEN 새 분석 페이지로 이동해야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { id: "analysis-5" } }),
      });
      const analysis = mockAnalysisFailed;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );
      const rerunButton = screen.getByText("재실행");
      fireEvent.click(rerunButton);

      // THEN
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/projects/project-1/analyses/analysis-5"
        );
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("파이프라인 시각화", () => {
    it("GIVEN 모든 분석 상태 WHEN 컴포넌트 렌더링 THEN 파이프라인이 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("분석 진행 상태")).toBeInTheDocument();
    });
  });

  describe("헤더 정보", () => {
    it("GIVEN 분석 WHEN 컴포넌트 렌더링 THEN 프로젝트 이름과 브랜치가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
      expect(screen.getByText(/main/)).toBeInTheDocument();
    });

    it("GIVEN 커밋 해시가 있는 분석 WHEN 컴포넌트 렌더링 THEN 짧은 커밋 해시가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText(/abc1234/)).toBeInTheDocument();
    });

    it("GIVEN 완료된 분석 WHEN 컴포넌트 렌더링 THEN 완료 상태 배지가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("완료")).toBeInTheDocument();
    });

    it("GIVEN 실패한 분석 WHEN 컴포넌트 렌더링 THEN 실패 상태 배지가 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisFailed;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      const failedBadges = screen.getAllByText("실패");
      expect(failedBadges.length).toBeGreaterThanOrEqual(1);
    });
  });
});
