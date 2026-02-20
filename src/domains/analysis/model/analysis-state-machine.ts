export type AnalysisStatus =
  | "PENDING"
  | "SCANNING"
  | "CLONING"
  | "STATIC_ANALYSIS"
  | "BUILDING"
  | "PENETRATION_TEST"
  | "EXPLOIT_VERIFICATION"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED"
  | "CANCELLED";

const VALID_TRANSITIONS: Record<AnalysisStatus, AnalysisStatus[]> = {
  PENDING: ["SCANNING", "CLONING", "FAILED", "CANCELLED"],
  SCANNING: [
    "CLONING",
    "STATIC_ANALYSIS",
    "BUILDING",
    "PENETRATION_TEST",
    "EXPLOIT_VERIFICATION",
    "COMPLETED",
    "COMPLETED_WITH_ERRORS",
    "FAILED",
    "CANCELLED",
  ],
  CLONING: ["STATIC_ANALYSIS", "FAILED", "CANCELLED"],
  STATIC_ANALYSIS: [
    "BUILDING",
    "PENETRATION_TEST",
    "COMPLETED",
    "COMPLETED_WITH_ERRORS",
    "FAILED",
    "CANCELLED",
  ],
  BUILDING: [
    "PENETRATION_TEST",
    "COMPLETED",
    "COMPLETED_WITH_ERRORS",
    "FAILED",
    "CANCELLED",
  ],
  PENETRATION_TEST: [
    "EXPLOIT_VERIFICATION",
    "COMPLETED",
    "COMPLETED_WITH_ERRORS",
    "FAILED",
    "CANCELLED",
  ],
  EXPLOIT_VERIFICATION: [
    "COMPLETED",
    "COMPLETED_WITH_ERRORS",
    "FAILED",
    "CANCELLED",
  ],
  COMPLETED: [],
  COMPLETED_WITH_ERRORS: [],
  FAILED: [],
  CANCELLED: [],
};

const TERMINAL_STATUSES: ReadonlySet<AnalysisStatus> = new Set([
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
  "CANCELLED",
]);

export function isTerminalStatus(status: AnalysisStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function canTransition(
  from: AnalysisStatus,
  to: AnalysisStatus
): boolean {
  // Terminal statuses can override other terminal statuses (e.g., COMPLETED -> FAILED)
  if (isTerminalStatus(to) && isTerminalStatus(from)) {
    return true;
  }
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function mapStatusToStep(status: AnalysisStatus): string {
  const stepMap: Record<AnalysisStatus, string> = {
    PENDING: "대기",
    SCANNING: "스캔 시작",
    CLONING: "저장소 클론",
    STATIC_ANALYSIS: "정적 분석",
    BUILDING: "빌드",
    PENETRATION_TEST: "침투 테스트",
    EXPLOIT_VERIFICATION: "모의 침투 검증",
    COMPLETED: "완료",
    COMPLETED_WITH_ERRORS: "일부 오류 완료",
    FAILED: "실패",
    CANCELLED: "취소",
  };
  return stepMap[status] || status;
}
