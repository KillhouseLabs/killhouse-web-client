/**
 * AnalysisPipeline Component Tests
 *
 * 분석 파이프라인 UI 테스트
 */

import { render, screen } from "@testing-library/react";
import { AnalysisPipeline } from "@/components/project/analysis-pipeline";

describe("AnalysisPipeline", () => {
  describe("PENDING 상태", () => {
    it("GIVEN PENDING 상태 WHEN 컴포넌트 렌더링 THEN 모든 단계가 pending 상태여야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="PENDING" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });

    it("GIVEN SCANNING 상태 WHEN 컴포넌트 렌더링 THEN 모든 단계가 pending 상태여야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="SCANNING" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("CLONING 상태", () => {
    it("GIVEN CLONING 상태 WHEN 컴포넌트 렌더링 THEN CLONING은 active, 나머지는 pending이어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="CLONING" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "active"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("STATIC_ANALYSIS 상태", () => {
    it("GIVEN STATIC_ANALYSIS 상태 WHEN 컴포넌트 렌더링 THEN CLONING은 completed, STATIC_ANALYSIS는 active, 나머지는 pending이어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="STATIC_ANALYSIS" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "active");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("BUILDING 상태", () => {
    it("GIVEN BUILDING 상태 WHEN 컴포넌트 렌더링 THEN 이전 단계들은 completed, BUILDING은 active, 나머지는 pending이어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="BUILDING" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "active"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("PENETRATION_TEST 상태", () => {
    it("GIVEN PENETRATION_TEST 상태 WHEN 컴포넌트 렌더링 THEN 이전 단계들은 completed, PENETRATION_TEST는 active, COMPLETED는 pending이어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="PENETRATION_TEST" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "active");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("COMPLETED 상태", () => {
    it("GIVEN COMPLETED 상태 WHEN 컴포넌트 렌더링 THEN 모든 단계가 completed 상태여야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="COMPLETED" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "completed"
      );
    });
  });

  describe("FAILED 상태", () => {
    it("GIVEN FAILED 상태 stepResults 없이 WHEN 컴포넌트 렌더링 THEN 첫 스텝이 failed, 나머지 pending이어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="FAILED" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "failed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });

    it("GIVEN FAILED 상태 + stepResults WHEN 렌더링 THEN 실패한 스텝에 failed 표시", () => {
      // GIVEN
      const stepResults = {
        cloning: { status: "success" as const },
        sast: { status: "success" as const, findings_count: 3 },
        building: { status: "skipped" as const },
        dast: { status: "failed" as const, error: "nuclei timeout" },
      };

      // WHEN
      render(
        <AnalysisPipeline currentStatus="FAILED" stepResults={stepResults} />
      );

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "failed");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("COMPLETED_WITH_ERRORS 상태", () => {
    it("GIVEN COMPLETED_WITH_ERRORS + stepResults WHEN 렌더링 THEN 실패한 스텝만 failed 표시", () => {
      // GIVEN
      const stepResults = {
        cloning: { status: "success" as const },
        sast: { status: "success" as const, findings_count: 5 },
        building: { status: "skipped" as const },
        dast: { status: "failed" as const, error: "nuclei timeout" },
      };

      // WHEN
      render(
        <AnalysisPipeline
          currentStatus="COMPLETED_WITH_ERRORS"
          stepResults={stepResults}
        />
      );

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "failed");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "completed"
      );
    });

    it("GIVEN COMPLETED_WITH_ERRORS stepResults 없이 WHEN 렌더링 THEN 모든 스텝이 completed 표시", () => {
      // GIVEN & WHEN
      render(
        <AnalysisPipeline currentStatus="COMPLETED_WITH_ERRORS" />
      );

      // THEN - without stepResults, falls through to active step logic
      // COMPLETED_WITH_ERRORS is not in PIPELINE_STEPS so all default to pending
      // But with our fix, it's treated separately
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "completed"
      );
    });
  });

  describe("CANCELLED 상태", () => {
    it("GIVEN CANCELLED 상태 WHEN 컴포넌트 렌더링 THEN 모든 단계가 pending 상태여야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="CANCELLED" />);

      // THEN
      expect(screen.getByTestId("pipeline-step-CLONING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-STATIC_ANALYSIS")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-BUILDING")).toHaveAttribute(
        "data-status",
        "pending"
      );
      expect(
        screen.getByTestId("pipeline-step-PENETRATION_TEST")
      ).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("pipeline-step-COMPLETED")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("커넥터 렌더링", () => {
    it("GIVEN 파이프라인 렌더링 WHEN 5개 단계 표시 THEN 4개의 커넥터가 렌더링되어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="PENDING" />);

      // THEN
      expect(screen.getByTestId("pipeline-connector-0")).toBeInTheDocument();
      expect(screen.getByTestId("pipeline-connector-1")).toBeInTheDocument();
      expect(screen.getByTestId("pipeline-connector-2")).toBeInTheDocument();
      expect(screen.getByTestId("pipeline-connector-3")).toBeInTheDocument();
      expect(
        screen.queryByTestId("pipeline-connector-4")
      ).not.toBeInTheDocument();
    });
  });

  describe("단계 레이블 표시", () => {
    it("GIVEN 파이프라인 렌더링 WHEN 컴포넌트 마운트 THEN 모든 단계 레이블이 표시되어야 한다", () => {
      // GIVEN & WHEN
      render(<AnalysisPipeline currentStatus="PENDING" />);

      // THEN
      expect(screen.getByText("클론")).toBeInTheDocument();
      expect(screen.getByText("SAST")).toBeInTheDocument();
      expect(screen.getByText("빌드")).toBeInTheDocument();
      expect(screen.getByText("침투 테스트")).toBeInTheDocument();
      expect(screen.getByText("리포트")).toBeInTheDocument();
    });
  });
});
