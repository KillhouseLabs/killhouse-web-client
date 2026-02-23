/**
 * AnalysisDetail Component Tests
 *
 * 분석 상세 보기 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  infoCount: 0,
  staticAnalysisReport: JSON.stringify({
    tool: "semgrep",
    findings: [
      {
        id: "finding-1",
        severity: "CRITICAL",
        file_path: "src/app.ts",
        line: 42,
        title: "javascript.express.security.audit.xss",
        description: "Potential XSS vulnerability",
        cwe: "CWE-79: Cross-site Scripting",
        reference: "https://owasp.org/www-community/attacks/xss/",
      },
      {
        id: "finding-2",
        severity: "HIGH",
        file_path: "src/auth.ts",
        line: 15,
        title: "javascript.jwt.security.jwt-hardcode",
        description: "Hardcoded JWT secret",
        cwe: "CWE-798: Use of Hard-coded Credentials",
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
        description: "Missing security headers",
      },
    ],
    total: 1,
    summary: "DAST scan completed",
  }),
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
  startedAt: new Date("2024-02-17T10:00:00Z"),
  completedAt: new Date("2024-02-17T10:15:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

const mockAnalysisWithOldFields: Analysis = {
  id: "analysis-old",
  status: "COMPLETED",
  branch: "main",
  commitHash: "old1234",
  vulnerabilitiesFound: 1,
  criticalCount: 0,
  highCount: 1,
  mediumCount: 0,
  lowCount: 0,
  infoCount: 0,
  staticAnalysisReport: JSON.stringify({
    tool: "semgrep",
    findings: [
      {
        id: "finding-old",
        severity: "HIGH",
        file: "src/legacy.ts",
        line: 10,
        rule_id: "old-style.rule",
        message: "Old format finding message",
      },
    ],
    total: 1,
  }),
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
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
  infoCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
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
  infoCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
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
  infoCount: 0,
  staticAnalysisReport: null,
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
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
      // shortRuleName extracts last segment from dotted rule name
      expect(screen.getByText("xss")).toBeInTheDocument();
      expect(screen.getByText("jwt-hardcode")).toBeInTheDocument();
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
    it("GIVEN 리포트가 없는 완료된 분석 WHEN 컴포넌트 렌더링 THEN 스캔 미실행 메시지가 표시되어야 한다", () => {
      // GIVEN - reports are null, so no scan actually ran
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
        screen.getByText("스캔이 실행되지 않았습니다")
      ).toBeInTheDocument();
    });

    it("GIVEN 성공한 스캔에서 취약점이 없는 분석 WHEN 컴포넌트 렌더링 THEN 안전 메시지가 표시되어야 한다", () => {
      // GIVEN - reports exist with step_result success, but 0 findings
      const analysis: Analysis = {
        ...mockAnalysisWithoutVulnerabilities,
        staticAnalysisReport: JSON.stringify({
          tool: "semgrep",
          findings: [],
          total: 0,
          step_result: { status: "success", findings_count: 0 },
        }),
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
        screen.getByText("취약점이 발견되지 않았습니다")
      ).toBeInTheDocument();
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

  describe("구 데이터 호환성", () => {
    it("GIVEN 구 필드명(file, rule_id, message)으로 된 데이터 WHEN 컴포넌트 렌더링 THEN 정상적으로 표시되어야 한다", () => {
      // GIVEN
      const analysis = mockAnalysisWithOldFields;

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN
      expect(screen.getByText("src/legacy.ts")).toBeInTheDocument();
      expect(screen.getByText("rule")).toBeInTheDocument(); // shortRuleName of "old-style.rule"
      expect(
        screen.getByText("Old format finding message")
      ).toBeInTheDocument();
    });
  });

  describe("상세 모달", () => {
    it("GIVEN 취약점 테이블 WHEN 행 클릭 THEN 취약점 상세 모달이 표시되어야 한다", async () => {
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
      const row = screen.getByText("src/app.ts").closest("tr");
      fireEvent.click(row!);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("취약점 상세")).toBeInTheDocument();
        expect(
          screen.getByText("javascript.express.security.audit.xss")
        ).toBeInTheDocument();
        expect(
          screen.getByText("CWE-79: Cross-site Scripting")
        ).toBeInTheDocument();
        expect(screen.getByText("코드 수정 제안 보기")).toBeInTheDocument();
      });
    });

    it("GIVEN 열린 상세 모달 WHEN 닫기 버튼 클릭 THEN 모달이 사라져야 한다", async () => {
      // GIVEN
      const analysis = mockAnalysisWithVulnerabilities;
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );
      const row = screen.getByText("src/app.ts").closest("tr");
      fireEvent.click(row!);

      await waitFor(() => {
        expect(screen.getByText("취약점 상세")).toBeInTheDocument();
      });

      // WHEN
      const closeButton = screen.getByLabelText("닫기");
      fireEvent.click(closeButton);

      // THEN
      await waitFor(() => {
        expect(screen.queryByText("취약점 상세")).not.toBeInTheDocument();
      });
    });

    it("GIVEN SAST finding의 수정 결과가 캐시됨 WHEN 모달을 닫고 같은 finding을 다시 클릭 THEN 코드 diff가 즉시 표시되어야 한다", async () => {
      // GIVEN
      const mockCodeFixResult = {
        originalCode: "const secret = 'hardcoded';",
        fixedCode: "const secret = process.env.SECRET;",
        unifiedDiff:
          "--- a/src/app.ts\n+++ b/src/app.ts\n-const secret = 'hardcoded';\n+const secret = process.env.SECRET;",
        explanation: "환경변수를 사용하세요",
        filePath: "src/app.ts",
        startLine: 42,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockCodeFixResult }),
      });

      const analysis = mockAnalysisWithVulnerabilities;
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // 첫 번째: finding 클릭 → 수정 제안 요청 → 결과 수신
      const row = screen.getByText("src/app.ts").closest("tr");
      fireEvent.click(row!);
      await waitFor(() => {
        expect(screen.getByText("코드 수정 제안 보기")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("코드 수정 제안 보기"));
      await waitFor(() => {
        expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
      });

      // 모달 닫기
      const closeButton = screen.getByLabelText("닫기");
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByText("취약점 상세")).not.toBeInTheDocument();
      });

      // WHEN: 같은 finding 다시 클릭
      const row2 = screen.getByText("src/app.ts").closest("tr");
      fireEvent.click(row2!);

      // THEN: diff가 즉시 표시됨 (API 재호출 없음)
      await waitFor(() => {
        expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
      });
      // fetch는 최초 1회만 호출되어야 함
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("GIVEN DAST finding의 수정 결과가 캐시됨 WHEN 모달을 닫고 같은 finding을 다시 클릭 THEN 수정 제안 텍스트가 즉시 표시되어야 한다", async () => {
      // GIVEN
      const mockFixSuggestion = {
        explanation: "보안 헤더가 누락되어 있습니다",
        suggestion: "X-Content-Type-Options 헤더를 추가하세요",
        exampleCode: 'response.setHeader("X-Content-Type-Options", "nosniff");',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockFixSuggestion }),
      });

      const analysis = mockAnalysisWithVulnerabilities;
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // 첫 번째: DAST finding 클릭 → 수정 제안 요청 → 결과 수신
      const row = screen.getByText("https://example.com/api").closest("tr");
      fireEvent.click(row!);
      await waitFor(() => {
        expect(screen.getByText("AI 수정 제안 받기")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("AI 수정 제안 받기"));
      await waitFor(() => {
        expect(
          screen.getByText("보안 헤더가 누락되어 있습니다")
        ).toBeInTheDocument();
      });

      // 모달 닫기
      const closeButton = screen.getByLabelText("닫기");
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByText("취약점 상세")).not.toBeInTheDocument();
      });

      // WHEN: 같은 finding 다시 클릭
      const row2 = screen.getByText("https://example.com/api").closest("tr");
      fireEvent.click(row2!);

      // THEN: 수정 제안이 즉시 표시됨 (API 재호출 없음)
      await waitFor(() => {
        expect(
          screen.getByText("보안 헤더가 누락되어 있습니다")
        ).toBeInTheDocument();
        expect(
          screen.getByText("X-Content-Type-Options 헤더를 추가하세요")
        ).toBeInTheDocument();
      });
      // fetch는 최초 1회만 호출되어야 함
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("GIVEN finding A의 수정 결과가 캐시됨 WHEN finding B를 클릭 THEN 코드 수정 제안 보기 버튼이 표시되어야 한다", async () => {
      // GIVEN: finding A (src/app.ts) 수정 결과 캐시
      const mockCodeFixResult = {
        originalCode: "const secret = 'hardcoded';",
        fixedCode: "const secret = process.env.SECRET;",
        unifiedDiff: "--- a/src/app.ts\n+++ b/src/app.ts",
        explanation: "환경변수를 사용하세요",
        filePath: "src/app.ts",
        startLine: 42,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockCodeFixResult }),
      });

      const analysis = mockAnalysisWithVulnerabilities;
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // finding A 클릭 → 수정 제안 받기 → 닫기
      const rowA = screen.getByText("src/app.ts").closest("tr");
      fireEvent.click(rowA!);
      await waitFor(() => {
        expect(screen.getByText("코드 수정 제안 보기")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("코드 수정 제안 보기"));
      await waitFor(() => {
        expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("닫기"));
      await waitFor(() => {
        expect(screen.queryByText("취약점 상세")).not.toBeInTheDocument();
      });

      // WHEN: finding B (src/auth.ts) 클릭
      const rowB = screen.getByText("src/auth.ts").closest("tr");
      fireEvent.click(rowB!);

      // THEN: 캐시 미적용 - 수정 제안 버튼이 표시됨
      await waitFor(() => {
        expect(screen.getByText("코드 수정 제안 보기")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("diff-viewer")).not.toBeInTheDocument();
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

  describe("결과 영속화 (Phase 7)", () => {
    it("GIVEN DB에 로그가 저장된 완료된 분석 WHEN 페이지 로드 THEN 분석 로그가 표시되어야 한다", () => {
      // GIVEN - server-loaded analysis with logs (simulating page revisit)
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
          message: "클론 완료 (branch: main)",
        },
        {
          timestamp: "2024-01-01T00:00:10Z",
          step: "정적 분석",
          level: "info",
          message: "Semgrep 정적 분석 시작...",
        },
      ]);
      const analysis: Analysis = {
        ...mockAnalysisWithVulnerabilities,
        logs: logsData,
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - AnalysisLiveLog should render the persisted logs
      expect(screen.getByText("분석 로그")).toBeInTheDocument();
      expect(screen.getByText(/저장소 클론 시작/)).toBeInTheDocument();
    });

    it("GIVEN DB에 로그가 없는 완료된 분석 WHEN 페이지 로드 THEN 분석 로그 섹션이 표시되지 않아야 한다", () => {
      // GIVEN - no logs (old analysis before Phase 4)
      const analysis: Analysis = {
        ...mockAnalysisWithVulnerabilities,
      };

      // WHEN
      render(
        <AnalysisDetail
          analysis={analysis}
          projectId="project-1"
          projectName="Test Project"
        />
      );

      // THEN - AnalysisLiveLog returns null when no logs
      expect(screen.queryByText("분석 로그")).not.toBeInTheDocument();
    });

    it("GIVEN 폴링이 logs를 반환하는 진행 중인 분석 WHEN 폴링 업데이트 수신 THEN 폴링 로그가 우선 표시되어야 한다", () => {
      // GIVEN - mock polling to return logs
      const polledLogs = JSON.stringify([
        {
          timestamp: "2024-01-01T00:00:00Z",
          step: "클론",
          level: "info",
          message: "폴링에서 받은 최신 로그",
        },
      ]);

      jest.mocked(useAnalysisPolling).mockReturnValue({
        analysis: {
          id: "analysis-3",
          status: "STATIC_ANALYSIS",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          completedAt: null,
          logs: polledLogs,
          staticAnalysisReport: null,
          penetrationTestReport: null,
          stepResults: null,
        },
        isTerminal: false,
        isLoading: false,
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

      // THEN - polled logs should be displayed
      expect(screen.getByText("분석 로그")).toBeInTheDocument();
      expect(screen.getByText(/폴링에서 받은 최신 로그/)).toBeInTheDocument();
    });

    it("GIVEN 폴링이 중간 SAST 결과를 반환하는 진행 중인 분석 WHEN 폴링 업데이트 수신 THEN SAST 결과가 즉시 표시되어야 한다", () => {
      // GIVEN
      const sastReport = JSON.stringify({
        tool: "semgrep",
        findings: [
          {
            id: "interim-1",
            severity: "HIGH",
            file_path: "src/interim.ts",
            line: 10,
            title: "interim.security.issue",
            description: "Interim finding during analysis",
          },
        ],
        total: 1,
      });

      jest.mocked(useAnalysisPolling).mockReturnValue({
        analysis: {
          id: "analysis-3",
          status: "BUILDING",
          vulnerabilitiesFound: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          completedAt: null,
          logs: null,
          staticAnalysisReport: sastReport,
          penetrationTestReport: null,
          stepResults: null,
        },
        isTerminal: false,
        isLoading: false,
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

      // THEN - intermediate SAST results should be shown
      expect(screen.getByText("src/interim.ts")).toBeInTheDocument();
      expect(
        screen.getByText("Interim finding during analysis")
      ).toBeInTheDocument();
    });
  });
});
