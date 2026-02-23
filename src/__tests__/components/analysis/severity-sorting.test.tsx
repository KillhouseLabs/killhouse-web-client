// Severity weight map (same as in implementation)
const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

function normalizeSeverity(severity: string): string {
  return severity
    .toUpperCase()
    .replace("WARNING", "MEDIUM")
    .replace("ERROR", "HIGH");
}

interface Finding {
  id?: string;
  severity: string;
  title?: string;
  description?: string;
  file_path?: string;
  line?: number;
  url?: string;
}

function sortFindings(
  findings: Finding[],
  direction: "asc" | "desc"
): Finding[] {
  return [...findings].sort((a, b) => {
    const weightA = SEVERITY_WEIGHT[normalizeSeverity(a.severity)] ?? 5;
    const weightB = SEVERITY_WEIGHT[normalizeSeverity(b.severity)] ?? 5;
    return direction === "desc" ? weightA - weightB : weightB - weightA;
  });
}

function filterFindings(
  findings: Finding[],
  severityFilter: string | null
): Finding[] {
  if (!severityFilter) return findings;
  return findings.filter(
    (f) => normalizeSeverity(f.severity) === severityFilter
  );
}

describe("Severity Sorting", () => {
  const findings: Finding[] = [
    { severity: "LOW", title: "Low issue" },
    { severity: "CRITICAL", title: "Critical issue" },
    { severity: "MEDIUM", title: "Medium issue" },
    { severity: "HIGH", title: "High issue" },
    { severity: "INFO", title: "Info issue" },
  ];

  describe("sortFindings", () => {
    it("기본 정렬: CRITICAL → HIGH → MEDIUM → LOW → INFO (desc)", () => {
      const sorted = sortFindings(findings, "desc");
      expect(sorted.map((f) => f.severity)).toEqual([
        "CRITICAL",
        "HIGH",
        "MEDIUM",
        "LOW",
        "INFO",
      ]);
    });

    it("오름차순 정렬: INFO → LOW → MEDIUM → HIGH → CRITICAL (asc)", () => {
      const sorted = sortFindings(findings, "asc");
      expect(sorted.map((f) => f.severity)).toEqual([
        "INFO",
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ]);
    });

    it("WARNING 심각도를 MEDIUM으로 정규화", () => {
      const mixed = [
        { severity: "WARNING", title: "w1" },
        { severity: "HIGH", title: "h1" },
      ];
      const sorted = sortFindings(mixed, "desc");
      expect(sorted[0].severity).toBe("HIGH");
      expect(sorted[1].severity).toBe("WARNING");
    });
  });

  describe("filterFindings", () => {
    it("CRITICAL 필터 시 CRITICAL만 반환", () => {
      const filtered = filterFindings(findings, "CRITICAL");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe("CRITICAL");
    });

    it("null 필터 시 전체 반환", () => {
      const filtered = filterFindings(findings, null);
      expect(filtered).toHaveLength(5);
    });

    it("빈 결과 처리", () => {
      const filtered = filterFindings([], "CRITICAL");
      expect(filtered).toHaveLength(0);
    });
  });
});
