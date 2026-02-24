import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalysisLiveLog } from "@/components/analysis/analysis-live-log";

describe("AnalysisLiveLog - Raw Output Display", () => {
  describe("Terminal-style output rendering", () => {
    it("GIVEN log entry with rawOutput WHEN rendered THEN displays raw output content", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "Build output",
          rawOutput: "$ npm run build\nBuilding...\nDone!",
        },
      ]);

      render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

      expect(screen.getByText(/npm run build/)).toBeInTheDocument();
      expect(screen.getByText(/Done!/)).toBeInTheDocument();
    });

    it("GIVEN rawOutput WHEN rendered THEN displays in terminal-style block with dark background", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "Output",
          rawOutput: "terminal content here",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="BUILDING" />
      );

      const terminalBlock = container.querySelector(
        '[data-testid="raw-output"]'
      );
      expect(terminalBlock).toBeInTheDocument();
    });

    it("GIVEN rawOutput WHEN rendered THEN preserves whitespace formatting", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "분석",
          level: "info",
          message: "Output",
          rawOutput: "Line 1\n  Indented\n    More indented",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="ANALYZING" />
      );

      const terminalOutput = container.querySelector(
        '[class*="whitespace-pre"]'
      );
      expect(terminalOutput).toBeInTheDocument();
    });

    it("GIVEN log entry without rawOutput WHEN rendered THEN displays only message (no terminal block)", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "초기화",
          level: "info",
          message: "Initializing...",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="INITIALIZING" />
      );

      expect(screen.getByText("Initializing...")).toBeInTheDocument();
      expect(
        container.querySelector('[data-testid="raw-output"]')
      ).not.toBeInTheDocument();
    });

    it("GIVEN log entries mixing normal and rawOutput WHEN rendered THEN renders both message and terminal block", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "Starting build",
        },
        {
          timestamp: "2024-01-01T12:00:05Z",
          step: "빌드",
          level: "info",
          message: "Build command",
          rawOutput: "$ npm run build\nSuccess!",
        },
        {
          timestamp: "2024-01-01T12:00:10Z",
          step: "빌드",
          level: "success",
          message: "Build completed",
        },
      ]);

      render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

      expect(screen.getByText("Starting build")).toBeInTheDocument();
      expect(screen.getByText("Build command")).toBeInTheDocument();
      expect(screen.getByText("Build completed")).toBeInTheDocument();
      expect(screen.getByText(/npm run build/)).toBeInTheDocument();
    });
  });

  describe("ANSI color rendering", () => {
    it("GIVEN rawOutput with ANSI red color code WHEN rendered THEN strips ANSI codes and shows text", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "error",
          message: "Test failed",
          rawOutput: "\x1b[31mError: assertion failed\x1b[0m",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="TESTING" />
      );

      expect(container.textContent).toContain("Error: assertion failed");
    });

    it("GIVEN rawOutput with ANSI green color code WHEN rendered THEN applies green styling", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "success",
          message: "Test passed",
          rawOutput: "\x1b[32m✓ All tests passed\x1b[0m",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="TESTING" />
      );

      expect(container.textContent).toContain("All tests passed");
      // Should have inline color style
      const greenElement = container.querySelector('[style*="color"]');
      expect(greenElement).toBeInTheDocument();
    });

    it("GIVEN rawOutput with ANSI bold code WHEN rendered THEN applies bold styling", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "Output",
          rawOutput: "\x1b[1mBold text\x1b[0m",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="BUILDING" />
      );

      expect(container.textContent).toContain("Bold text");
      const boldElement = container.querySelector('[style*="font-weight"]');
      expect(boldElement).toBeInTheDocument();
    });

    it("GIVEN rawOutput with multiple ANSI colors WHEN rendered THEN applies multiple color styles", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "info",
          message: "Results",
          rawOutput:
            "\x1b[32mPassed: 5\x1b[0m\n\x1b[31mFailed: 2\x1b[0m\n\x1b[33mSkipped: 1\x1b[0m",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="TESTING" />
      );

      expect(container.textContent).toContain("Passed: 5");
      expect(container.textContent).toContain("Failed: 2");
      expect(container.textContent).toContain("Skipped: 1");

      const coloredElements = container.querySelectorAll('[style*="color"]');
      expect(coloredElements.length).toBeGreaterThanOrEqual(3);
    });

    it("GIVEN rawOutput with no ANSI codes WHEN rendered THEN still displays in terminal style", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "로그",
          level: "info",
          message: "Plain log",
          rawOutput: "This is plain terminal output",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="LOGGING" />
      );

      expect(
        screen.getByText(/This is plain terminal output/)
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-testid="raw-output"]')
      ).toBeInTheDocument();
    });
  });

  describe("Long output collapsing", () => {
    it("GIVEN rawOutput longer than 10 lines WHEN rendered THEN shows collapsed with expand button", () => {
      const longOutput = Array.from(
        { length: 15 },
        (_, i) => `Line ${i + 1}`
      ).join("\n");
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "Long output",
          rawOutput: longOutput,
        },
      ]);

      render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

      // Should have a button to expand
      const expandButton = screen.getByRole("button", {
        name: /펼치기|더보기|expand/i,
      });
      expect(expandButton).toBeInTheDocument();
    });

    it("GIVEN collapsed rawOutput WHEN expand button clicked THEN shows full output", async () => {
      const user = userEvent.setup();
      const longOutput = Array.from(
        { length: 15 },
        (_, i) => `Line ${i + 1}`
      ).join("\n");
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "Long output",
          rawOutput: longOutput,
        },
      ]);

      render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

      const expandButton = screen.getByRole("button", {
        name: /펼치기|더보기|expand/i,
      });
      await user.click(expandButton);

      // After expanding, Line 15 should be visible
      expect(screen.getByText(/Line 15/)).toBeInTheDocument();
    });

    it("GIVEN rawOutput with 10 or fewer lines WHEN rendered THEN shows all without expand button", () => {
      const shortOutput = Array.from(
        { length: 5 },
        (_, i) => `Line ${i + 1}`
      ).join("\n");
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "info",
          message: "Short output",
          rawOutput: shortOutput,
        },
      ]);

      render(<AnalysisLiveLog logs={logs} currentStatus="TESTING" />);

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 5/)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /펼치기|더보기|expand/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("GIVEN rawOutput with empty string WHEN rendered THEN does not render terminal block", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "info",
          message: "Empty output",
          rawOutput: "",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="TESTING" />
      );

      expect(screen.getByText("Empty output")).toBeInTheDocument();
      expect(
        container.querySelector('[data-testid="raw-output"]')
      ).not.toBeInTheDocument();
    });

    it("GIVEN rawOutput with null WHEN rendered THEN does not render terminal block", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "info",
          message: "No output",
          rawOutput: null,
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="TESTING" />
      );

      expect(screen.getByText("No output")).toBeInTheDocument();
      expect(
        container.querySelector('[data-testid="raw-output"]')
      ).not.toBeInTheDocument();
    });

    it("GIVEN rawOutput with special HTML characters WHEN rendered THEN escapes properly", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "빌드",
          level: "info",
          message: "HTML chars",
          rawOutput: "<script>alert('xss')</script>",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="BUILDING" />
      );

      const scripts = container.querySelectorAll("script");
      expect(scripts.length).toBe(0);
    });

    it("GIVEN rawOutput with unicode WHEN rendered THEN displays correctly", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "테스트",
          level: "success",
          message: "Unicode test",
          rawOutput: "✓ Tests passed\n한글 테스트\n日本語テスト",
        },
      ]);

      render(<AnalysisLiveLog logs={logs} currentStatus="TESTING" />);

      expect(screen.getByText(/Tests passed/)).toBeInTheDocument();
      expect(screen.getByText(/한글 테스트/)).toBeInTheDocument();
    });

    it("GIVEN rawOutput with unclosed ANSI codes WHEN rendered THEN handles gracefully", () => {
      const logs = JSON.stringify([
        {
          timestamp: "2024-01-01T12:00:00Z",
          step: "에러",
          level: "error",
          message: "Unclosed",
          rawOutput: "\x1b[31mError without reset",
        },
      ]);

      const { container } = render(
        <AnalysisLiveLog logs={logs} currentStatus="ERROR" />
      );

      expect(container.textContent).toContain("Error without reset");
    });
  });
});
