import { render, screen } from "@testing-library/react";
import { AnalysisLiveLog } from "@/components/analysis/analysis-live-log";

describe("AnalysisLiveLog", () => {
  it("GIVEN null logs WHEN rendered THEN returns null (nothing rendered)", () => {
    const { container } = render(
      <AnalysisLiveLog logs={null} currentStatus="PENDING" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("GIVEN valid logs WHEN rendered THEN shows step sections", () => {
    const logs = JSON.stringify([
      {
        timestamp: "2024-01-01T12:00:00Z",
        step: "저장소 클론",
        level: "info",
        message: "Cloning repository...",
      },
      {
        timestamp: "2024-01-01T12:00:05Z",
        step: "저장소 클론",
        level: "success",
        message: "Clone completed",
      },
    ]);

    render(<AnalysisLiveLog logs={logs} currentStatus="CLONING" />);

    expect(screen.getByText("분석 로그")).toBeInTheDocument();
    expect(screen.getByText("저장소 클론")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("Cloning repository...")).toBeInTheDocument();
    expect(screen.getByText("Clone completed")).toBeInTheDocument();
  });

  it("GIVEN logs with error level WHEN rendered THEN error messages have red styling", () => {
    const logs = JSON.stringify([
      {
        timestamp: "2024-01-01T12:00:00Z",
        step: "빌드",
        level: "error",
        message: "Build failed",
      },
    ]);

    render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

    const errorMessage = screen.getByText("Build failed");
    expect(errorMessage).toHaveClass("text-red-600");
  });

  it("GIVEN logs with multiple steps WHEN rendered THEN groups by step", () => {
    const logs = JSON.stringify([
      {
        timestamp: "2024-01-01T12:00:00Z",
        step: "저장소 클론",
        level: "info",
        message: "Cloning...",
      },
      {
        timestamp: "2024-01-01T12:00:05Z",
        step: "정적 분석",
        level: "info",
        message: "Running SAST...",
      },
      {
        timestamp: "2024-01-01T12:00:10Z",
        step: "저장소 클론",
        level: "success",
        message: "Clone complete",
      },
    ]);

    render(<AnalysisLiveLog logs={logs} currentStatus="STATIC_ANALYSIS" />);

    expect(screen.getByText("저장소 클론")).toBeInTheDocument();
    expect(screen.getByText("정적 분석")).toBeInTheDocument();
    // 저장소 클론 has 2 logs
    expect(screen.getByText("(2)", { exact: false })).toBeInTheDocument();
  });

  it("GIVEN current status matching a step WHEN rendered THEN that section is auto-expanded", () => {
    const logs = JSON.stringify([
      {
        timestamp: "2024-01-01T12:00:00Z",
        step: "저장소 클론",
        level: "info",
        message: "Cloning...",
      },
      {
        timestamp: "2024-01-01T12:00:05Z",
        step: "정적 분석",
        level: "info",
        message: "Running SAST...",
      },
    ]);

    const { container } = render(
      <AnalysisLiveLog logs={logs} currentStatus="STATIC_ANALYSIS" />
    );

    const details = container.querySelectorAll("details");
    const detailsArray = Array.from(details);

    // Find the details element containing "정적 분석"
    const sastDetails = detailsArray.find((d) =>
      d.textContent?.includes("정적 분석")
    );

    expect(sastDetails).toHaveAttribute("open");
  });

  it("GIVEN logs with warn level WHEN rendered THEN warning messages have yellow styling", () => {
    const logs = JSON.stringify([
      {
        timestamp: "2024-01-01T12:00:00Z",
        step: "빌드",
        level: "warn",
        message: "Warning: deprecated function",
      },
    ]);

    render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

    const warnMessage = screen.getByText("Warning: deprecated function");
    expect(warnMessage).toHaveClass("text-yellow-600");
  });

  it("GIVEN logs with success level WHEN rendered THEN success messages have green styling", () => {
    const logs = JSON.stringify([
      {
        timestamp: "2024-01-01T12:00:00Z",
        step: "빌드",
        level: "success",
        message: "Build successful",
      },
    ]);

    render(<AnalysisLiveLog logs={logs} currentStatus="BUILDING" />);

    const successMessage = screen.getByText("Build successful");
    expect(successMessage).toHaveClass("text-green-600");
  });

  it("GIVEN empty logs array WHEN rendered THEN returns null", () => {
    const logs = JSON.stringify([]);
    const { container } = render(
      <AnalysisLiveLog logs={logs} currentStatus="PENDING" />
    );
    expect(container.firstChild).toBeNull();
  });
});
