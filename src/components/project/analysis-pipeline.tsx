"use client";

const PIPELINE_STEPS = [
  { key: "CLONING", label: "클론" },
  { key: "STATIC_ANALYSIS", label: "SAST" },
  { key: "BUILDING", label: "빌드" },
  { key: "PENETRATION_TEST", label: "침투 테스트" },
  { key: "COMPLETED", label: "리포트" },
] as const;

type StepStatus = "completed" | "active" | "failed" | "pending";

interface StepResult {
  status: "success" | "failed" | "skipped" | "pending";
  findings_count?: number;
  error?: string;
}

interface AnalysisPipelineProps {
  currentStatus: string;
  stepResults?: Record<string, StepResult>;
}

function getStepIndex(status: string): number {
  return PIPELINE_STEPS.findIndex((s) => s.key === status);
}

function getStepStatuses(
  currentStatus: string,
  stepResults?: Record<string, StepResult>
): StepStatus[] {
  const isCompleted = currentStatus === "COMPLETED";
  const isCompletedWithErrors = currentStatus === "COMPLETED_WITH_ERRORS";
  const isCancelled = currentStatus === "CANCELLED";
  const isPending = currentStatus === "PENDING" || currentStatus === "SCANNING";
  const isFailed = currentStatus === "FAILED";

  // For COMPLETED_WITH_ERRORS, use stepResults to determine per-step status
  if (isCompletedWithErrors) {
    if (stepResults) {
      const stepKeyToResultKey: Record<string, string> = {
        CLONING: "cloning",
        STATIC_ANALYSIS: "sast",
        BUILDING: "building",
        PENETRATION_TEST: "dast",
        COMPLETED: "completed",
      };

      return PIPELINE_STEPS.map((step) => {
        const resultKey = stepKeyToResultKey[step.key];
        const result = resultKey ? stepResults[resultKey] : undefined;

        if (step.key === "COMPLETED") return "completed";
        if (!result) return "completed";
        if (result.status === "failed") return "failed";
        return "completed";
      });
    }
    // Without stepResults, show all as completed (analysis finished but with some errors)
    return PIPELINE_STEPS.map(() => "completed");
  }

  if (isCompleted) return PIPELINE_STEPS.map(() => "completed");
  if (isCancelled || isPending) return PIPELINE_STEPS.map(() => "pending");

  // For FAILED, mark all preceding steps as completed and last active as failed
  if (isFailed) {
    const currentIndex = getStepIndex(currentStatus);
    if (currentIndex === -1) {
      // FAILED is not a pipeline step — find the last known step from stepResults
      if (stepResults) {
        const stepOrder = ["cloning", "sast", "building", "dast"];
        let lastActiveIndex = -1;
        for (let i = stepOrder.length - 1; i >= 0; i--) {
          const result = stepResults[stepOrder[i]];
          if (
            result &&
            (result.status === "failed" || result.status === "success")
          ) {
            lastActiveIndex = i;
            break;
          }
        }
        return PIPELINE_STEPS.map((_, i) => {
          if (lastActiveIndex === -1) return "pending";
          if (i < lastActiveIndex) return "completed";
          if (i === lastActiveIndex) return "failed";
          return "pending";
        });
      }
      // No stepResults: show all as failed at first step
      return PIPELINE_STEPS.map((_, i) => (i === 0 ? "failed" : "pending"));
    }
    return PIPELINE_STEPS.map((_, i) => {
      if (i < currentIndex) return "completed";
      if (i === currentIndex) return "failed";
      return "pending";
    });
  }

  // Active intermediate step
  const currentIndex = getStepIndex(currentStatus);
  return PIPELINE_STEPS.map((_, i) => {
    if (currentIndex >= 0) {
      if (i < currentIndex) return "completed";
      if (i === currentIndex) return "active";
    }
    return "pending";
  });
}

// SVG icons for each step
function StepIcon({ stepKey }: { stepKey: string }) {
  switch (stepKey) {
    case "CLONING":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "STATIC_ANALYSIS":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "BUILDING":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      );
    case "PENETRATION_TEST":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "COMPLETED":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    default:
      return null;
  }
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const stepStyles: Record<
  StepStatus,
  { circle: string; label: string; connector: string }
> = {
  completed: {
    circle: "bg-green-500 text-white",
    label: "text-green-600",
    connector: "bg-green-500",
  },
  active: {
    circle: "bg-blue-500 text-white animate-pulse",
    label: "text-blue-600 font-medium",
    connector: "bg-border",
  },
  failed: {
    circle: "bg-red-500 text-white",
    label: "text-red-600",
    connector: "bg-border",
  },
  pending: {
    circle: "bg-muted text-muted-foreground",
    label: "text-muted-foreground",
    connector: "bg-border",
  },
};

export function AnalysisPipeline({
  currentStatus,
  stepResults,
}: AnalysisPipelineProps) {
  const statuses = getStepStatuses(currentStatus, stepResults);

  return (
    <div className="flex items-center justify-between">
      {PIPELINE_STEPS.map((step, i) => {
        const status = statuses[i];
        const styles = stepStyles[status];

        return (
          <div
            key={step.key}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${styles.circle}`}
                data-testid={`pipeline-step-${step.key}`}
                data-status={status}
              >
                {status === "completed" ? (
                  <CheckIcon />
                ) : status === "failed" ? (
                  <XIcon />
                ) : (
                  <StepIcon stepKey={step.key} />
                )}
              </div>
              <p className={`mt-2 text-xs ${styles.label}`}>{step.label}</p>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 transition-all ${
                  statuses[i] === "completed" && statuses[i + 1] !== "pending"
                    ? "bg-green-500"
                    : "bg-border"
                }`}
                data-testid={`pipeline-connector-${i}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
