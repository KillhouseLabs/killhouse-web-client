import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalysisDetail } from "@/components/analysis/analysis-detail";

// Mock ESM modules
jest.mock("react-diff-viewer-continued", () => ({
  __esModule: true,
  default: ({ oldValue, newValue }: { oldValue: string; newValue: string }) => (
    <div data-testid="diff-viewer">
      <pre>{oldValue}</pre>
      <pre>{newValue}</pre>
    </div>
  ),
}));

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: () => {},
}));

jest.mock("@/hooks/use-analysis-polling", () => ({
  useAnalysisPolling: jest.fn().mockReturnValue({
    analysis: null,
    isTerminal: false,
    isLoading: false,
  }),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

global.fetch = jest.fn();

const mockScrollIntoView = jest.fn();

// Analysis with findings so clicking opens FindingDetailModal
const mockAnalysisWithFindings = {
  id: "analysis-1",
  status: "COMPLETED",
  branch: "main",
  commitHash: "abc1234",
  vulnerabilitiesFound: 1,
  criticalCount: 1,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  infoCount: 0,
  staticAnalysisReport: JSON.stringify({
    tool: "semgrep",
    findings: [
      {
        id: "finding-1",
        severity: "CRITICAL",
        title: "SQL Injection",
        description: "SQL injection vulnerability",
        file_path: "src/app.ts",
        line: 42,
      },
    ],
    total: 1,
    step_result: { status: "success", findings_count: 1 },
  }),
  penetrationTestReport: null,
  executiveSummary: null,
  stepResults: null,
  exploitSessionId: null,
  startedAt: new Date("2024-02-24T10:00:00Z"),
  completedAt: new Date("2024-02-24T10:10:00Z"),
  repository: { id: "repo-1", name: "test-repo", provider: "GITHUB" },
};

describe("AnalysisDetail - AI Chat Auto-scroll (Phase 3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;
  });

  it("GIVEN AI 채팅 열림 WHEN 프리셋 질문 클릭 후 응답 수신 THEN 채팅 컨테이너가 자동으로 스크롤 되어야 한다", async () => {
    // Mock AI chat API
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { answer: "이 취약점은 심각한 영향을 미칩니다." },
      }),
    });

    render(
      <AnalysisDetail
        analysis={mockAnalysisWithFindings}
        projectId="project-1"
        projectName="Test Project"
      />
    );

    // Click on the finding row to open modal
    const findingRow = screen.getByText("SQL Injection").closest("tr");
    fireEvent.click(findingRow!);

    // Click "AI에게 질문하기" button
    const aiButton = await screen.findByText("AI에게 질문하기");
    fireEvent.click(aiButton);

    // Reset scrollIntoView mock before chat interaction
    mockScrollIntoView.mockClear();

    // Click a preset question
    const presetQuestion =
      screen.getByText("이 취약점의 영향도를 분석해주세요");
    fireEvent.click(presetQuestion);

    // Wait for AI response
    await waitFor(() => {
      expect(
        screen.getByText("이 취약점은 심각한 영향을 미칩니다.")
      ).toBeInTheDocument();
    });

    // scrollIntoView should have been called (at least once for user message, once for AI response)
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it("GIVEN AI 채팅 열림 WHEN 사용자가 직접 질문 입력 후 전송 THEN 스크롤이 하단으로 이동해야 한다", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { answer: "공격 시나리오를 설명드리겠습니다." },
      }),
    });

    render(
      <AnalysisDetail
        analysis={mockAnalysisWithFindings}
        projectId="project-1"
        projectName="Test Project"
      />
    );

    // Open finding modal
    const findingRow = screen.getByText("SQL Injection").closest("tr");
    fireEvent.click(findingRow!);

    // Open AI chat
    const aiButton = await screen.findByText("AI에게 질문하기");
    fireEvent.click(aiButton);

    mockScrollIntoView.mockClear();

    // Type and submit a question
    const input = screen.getByPlaceholderText("취약점에 대해 질문하세요...");
    fireEvent.change(input, { target: { value: "자세히 설명해주세요" } });
    fireEvent.click(screen.getByText("전송"));

    await waitFor(() => {
      expect(
        screen.getByText("공격 시나리오를 설명드리겠습니다.")
      ).toBeInTheDocument();
    });

    expect(mockScrollIntoView).toHaveBeenCalled();
  });
});
