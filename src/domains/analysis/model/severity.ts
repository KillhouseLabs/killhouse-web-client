/**
 * Severity — 취약점 심각도 도메인 모델
 *
 * 심각도 레벨, 정렬 가중치, 정규화는 분석 도메인 지식이다.
 */

export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export function normalizeSeverity(severity: string): string {
  return severity
    .toUpperCase()
    .replace("WARNING", "MEDIUM")
    .replace("ERROR", "HIGH");
}

export function compareSeverity(
  a: string,
  b: string,
  direction: "asc" | "desc" = "desc"
): number {
  const weightA = SEVERITY_WEIGHT[normalizeSeverity(a)] ?? 5;
  const weightB = SEVERITY_WEIGHT[normalizeSeverity(b)] ?? 5;
  return direction === "desc" ? weightA - weightB : weightB - weightA;
}
