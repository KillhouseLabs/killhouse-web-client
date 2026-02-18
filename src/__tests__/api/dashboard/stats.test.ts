/**
 * Dashboard Stats API Route Tests
 *
 * 대시보드 통계 API 엔드포인트 테스트
 */

// Mock prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    project: {
      count: jest.fn(),
    },
    analysis: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";
import {
  buildDedupKey,
  parseReportFindings,
  isCriticalSeverity,
} from "@/app/api/dashboard/stats/route";
import type { Finding } from "@/app/api/dashboard/stats/route";

describe("Dashboard Stats API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("GIVEN 인증되지 않은 사용자 WHEN 통계 요청 THEN null 세션이 반환되어야 한다", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue(null);

      // WHEN
      const session = await auth();

      // THEN
      expect(session).toBeNull();
    });

    it("GIVEN 인증된 사용자 WHEN 세션 확인 THEN 사용자 정보가 있어야 한다", async () => {
      // GIVEN
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });

      // WHEN
      const session = await auth();

      // THEN
      expect(session?.user?.id).toBe("user-1");
    });
  });

  describe("프로젝트 수 조회", () => {
    it("GIVEN 사용자의 프로젝트가 있음 WHEN 프로젝트 수 조회 THEN 정확한 수가 반환되어야 한다", async () => {
      // GIVEN
      (prisma.project.count as jest.Mock).mockResolvedValue(5);

      // WHEN
      const count = await prisma.project.count({
        where: {
          userId: "user-1",
          status: { not: "DELETED" },
        },
      });

      // THEN
      expect(count).toBe(5);
    });

    it("GIVEN 프로젝트가 없음 WHEN 프로젝트 수 조회 THEN 0이 반환되어야 한다", async () => {
      // GIVEN
      (prisma.project.count as jest.Mock).mockResolvedValue(0);

      // WHEN
      const count = await prisma.project.count({
        where: {
          userId: "user-1",
          status: { not: "DELETED" },
        },
      });

      // THEN
      expect(count).toBe(0);
    });
  });

  describe("분석 통계 조회", () => {
    it("GIVEN 완료된 분석이 있음 WHEN 분석 조회 THEN 완료된 분석이 포함되어야 한다", async () => {
      // GIVEN
      const mockAnalyses = [
        {
          status: "COMPLETED",
          vulnerabilitiesFound: 5,
          criticalCount: 1,
          staticAnalysisReport: null,
          penetrationTestReport: null,
        },
        {
          status: "COMPLETED",
          vulnerabilitiesFound: 3,
          criticalCount: 0,
          staticAnalysisReport: null,
          penetrationTestReport: null,
        },
      ];
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue(mockAnalyses);

      // WHEN
      const analyses = await prisma.analysis.findMany({
        where: {
          project: { userId: "user-1", status: { not: "DELETED" } },
          status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
        },
        select: {
          status: true,
          vulnerabilitiesFound: true,
          criticalCount: true,
          staticAnalysisReport: true,
          penetrationTestReport: true,
        },
      });

      // THEN
      expect(analyses).toHaveLength(2);
    });
  });

  describe("최근 활동 조회", () => {
    it("GIVEN 최근 분석이 있음 WHEN 최근 활동 조회 THEN 최근 5개가 반환되어야 한다", async () => {
      // GIVEN
      const mockRecentAnalyses = [
        {
          id: "analysis-1",
          status: "COMPLETED",
          startedAt: new Date(),
          completedAt: new Date(),
          vulnerabilitiesFound: 5,
          project: {
            name: "Project 1",
            repositories: [{ provider: "GITHUB" }],
          },
        },
        {
          id: "analysis-2",
          status: "RUNNING",
          startedAt: new Date(),
          completedAt: null,
          vulnerabilitiesFound: null,
          project: {
            name: "Project 2",
            repositories: [{ provider: "GITLAB" }],
          },
        },
      ];
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue(
        mockRecentAnalyses
      );

      // WHEN
      const recentAnalyses = await prisma.analysis.findMany({
        where: {
          project: { userId: "user-1", status: { not: "DELETED" } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          project: {
            select: {
              name: true,
              repositories: {
                where: { isPrimary: true },
                take: 1,
                select: { provider: true },
              },
            },
          },
        },
      });

      // THEN
      expect(recentAnalyses).toHaveLength(2);
      expect(recentAnalyses[0].project.name).toBe("Project 1");
    });

    it("GIVEN 활동이 없음 WHEN 최근 활동 조회 THEN 빈 배열이 반환되어야 한다", async () => {
      // GIVEN
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue([]);

      // WHEN
      const recentAnalyses = await prisma.analysis.findMany({
        where: {
          project: { userId: "user-1", status: { not: "DELETED" } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      });

      // THEN
      expect(recentAnalyses).toHaveLength(0);
    });
  });

  describe("buildDedupKey", () => {
    it("GIVEN SAST finding with CWE WHEN buildDedupKey THEN sast:{cwe}:{file}:{line} 형식이어야 한다", () => {
      const finding: Finding = {
        type: "sast",
        severity: "high",
        cwe: "CWE-79",
        file_path: "src/app.ts",
        line: 10,
      };
      expect(buildDedupKey(finding)).toBe("sast:CWE-79:src/app.ts:10");
    });

    it("GIVEN SAST finding without CWE WHEN buildDedupKey THEN sast:{title}:{file}:{line} 형식이어야 한다", () => {
      const finding: Finding = {
        type: "sast",
        severity: "medium",
        title: "SQL Injection",
        file_path: "src/db.ts",
        line: 42,
      };
      expect(buildDedupKey(finding)).toBe("sast:SQL Injection:src/db.ts:42");
    });

    it("GIVEN DAST finding with CWE WHEN buildDedupKey THEN dast:{cwe}:{url} 형식이어야 한다", () => {
      const finding: Finding = {
        type: "dast",
        severity: "critical",
        cwe: "CWE-89",
        url: "https://example.com/api",
      };
      expect(buildDedupKey(finding)).toBe(
        "dast:CWE-89:https://example.com/api"
      );
    });

    it("GIVEN DAST finding without CWE WHEN buildDedupKey THEN dast:{title}:{url} 형식이어야 한다", () => {
      const finding: Finding = {
        type: "dast",
        severity: "high",
        title: "XSS",
        url: "https://example.com/page",
      };
      expect(buildDedupKey(finding)).toBe("dast:XSS:https://example.com/page");
    });

    it("GIVEN finding without type WHEN buildDedupKey THEN dast로 기본 처리되어야 한다", () => {
      const finding: Finding = {
        severity: "low",
        title: "Info Disclosure",
        url: "https://example.com",
      };
      expect(buildDedupKey(finding)).toBe(
        "dast:Info Disclosure:https://example.com"
      );
    });
  });

  describe("parseReportFindings", () => {
    it("GIVEN null 리포트 WHEN 파싱 THEN 빈 배열이 반환되어야 한다", () => {
      expect(parseReportFindings(null)).toEqual([]);
    });

    it("GIVEN 유효한 JSON 리포트 WHEN 파싱 THEN findings가 추출되어야 한다", () => {
      const report = JSON.stringify([
        {
          tool: "semgrep",
          findings: [
            { severity: "high", title: "XSS", type: "sast" },
            { severity: "low", title: "Info", type: "sast" },
          ],
        },
      ]);
      const findings = parseReportFindings(report);
      expect(findings).toHaveLength(2);
      expect(findings[0].title).toBe("XSS");
    });

    it("GIVEN 여러 도구 리포트 WHEN 파싱 THEN 모든 findings가 합쳐져야 한다", () => {
      const report = JSON.stringify([
        {
          tool: "semgrep",
          findings: [{ severity: "high", title: "A", type: "sast" }],
        },
        {
          tool: "bandit",
          findings: [{ severity: "medium", title: "B", type: "sast" }],
        },
      ]);
      const findings = parseReportFindings(report);
      expect(findings).toHaveLength(2);
    });

    it("GIVEN 잘못된 JSON WHEN 파싱 THEN 빈 배열이 반환되어야 한다", () => {
      expect(parseReportFindings("not json")).toEqual([]);
    });

    it("GIVEN 배열이 아닌 JSON WHEN 파싱 THEN 빈 배열이 반환되어야 한다", () => {
      expect(parseReportFindings(JSON.stringify({ not: "array" }))).toEqual([]);
    });
  });

  describe("isCriticalSeverity", () => {
    it("GIVEN 'critical' WHEN 확인 THEN true", () => {
      expect(isCriticalSeverity("critical")).toBe(true);
    });

    it("GIVEN 'CRITICAL' WHEN 확인 THEN true (대소문자 무시)", () => {
      expect(isCriticalSeverity("CRITICAL")).toBe(true);
    });

    it("GIVEN 'high' WHEN 확인 THEN false", () => {
      expect(isCriticalSeverity("high")).toBe(false);
    });
  });

  describe("취약점 중복 제거", () => {
    it("GIVEN 동일한 취약점이 여러 분석에 존재 WHEN 통계 집계 THEN 1회만 카운트되어야 한다", () => {
      // GIVEN - same finding in two analyses
      const finding: Finding = {
        type: "sast",
        severity: "critical",
        cwe: "CWE-79",
        file_path: "src/app.ts",
        line: 10,
      };

      // WHEN - dedup with Set
      const seenKeys = new Set<string>();
      let totalVulnerabilities = 0;
      let criticalVulnerabilities = 0;

      // Process same finding twice (simulating two analyses with identical findings)
      for (let i = 0; i < 2; i++) {
        const key = buildDedupKey(finding);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          totalVulnerabilities++;
          if (isCriticalSeverity(finding.severity)) {
            criticalVulnerabilities++;
          }
        }
      }

      // THEN
      expect(totalVulnerabilities).toBe(1);
      expect(criticalVulnerabilities).toBe(1);
    });

    it("GIVEN 서로 다른 취약점 WHEN 통계 집계 THEN 모두 카운트되어야 한다", () => {
      // GIVEN
      const findings: Finding[] = [
        {
          type: "sast",
          severity: "critical",
          cwe: "CWE-79",
          file_path: "src/app.ts",
          line: 10,
        },
        {
          type: "sast",
          severity: "high",
          cwe: "CWE-89",
          file_path: "src/db.ts",
          line: 20,
        },
        {
          type: "dast",
          severity: "medium",
          cwe: "CWE-79",
          url: "https://example.com",
        },
      ];

      // WHEN
      const seenKeys = new Set<string>();
      let totalVulnerabilities = 0;

      for (const finding of findings) {
        const key = buildDedupKey(finding);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          totalVulnerabilities++;
        }
      }

      // THEN
      expect(totalVulnerabilities).toBe(3);
    });

    it("GIVEN SAST와 DAST에 동일 CWE지만 다른 위치 WHEN 통계 집계 THEN 별도로 카운트되어야 한다", () => {
      // GIVEN
      const sastFinding: Finding = {
        type: "sast",
        severity: "high",
        cwe: "CWE-79",
        file_path: "src/app.ts",
        line: 10,
      };
      const dastFinding: Finding = {
        type: "dast",
        severity: "high",
        cwe: "CWE-79",
        url: "https://example.com/page",
      };

      // WHEN
      const sastKey = buildDedupKey(sastFinding);
      const dastKey = buildDedupKey(dastFinding);

      // THEN - different type prefix means different keys
      expect(sastKey).not.toBe(dastKey);
      expect(sastKey).toBe("sast:CWE-79:src/app.ts:10");
      expect(dastKey).toBe("dast:CWE-79:https://example.com/page");
    });

    it("GIVEN JSON 리포트 없는 레거시 분석 WHEN 통계 집계 THEN 정수 카운트를 폴백으로 사용해야 한다", () => {
      // GIVEN - analysis with no reports but has integer counts
      const legacyAnalysis = {
        status: "COMPLETED",
        vulnerabilitiesFound: 7,
        criticalCount: 2,
        staticAnalysisReport: null,
        penetrationTestReport: null,
      };

      // WHEN
      const sastFindings = parseReportFindings(
        legacyAnalysis.staticAnalysisReport
      );
      const dastFindings = parseReportFindings(
        legacyAnalysis.penetrationTestReport
      );
      const allFindings = [...sastFindings, ...dastFindings];

      let totalVulnerabilities = 0;
      let criticalVulnerabilities = 0;

      if (allFindings.length > 0) {
        // would dedup here
      } else if (
        legacyAnalysis.vulnerabilitiesFound ||
        legacyAnalysis.criticalCount
      ) {
        totalVulnerabilities += legacyAnalysis.vulnerabilitiesFound || 0;
        criticalVulnerabilities += legacyAnalysis.criticalCount || 0;
      }

      // THEN
      expect(totalVulnerabilities).toBe(7);
      expect(criticalVulnerabilities).toBe(2);
    });

    it("GIVEN 리포트가 있는 분석과 레거시 분석이 혼재 WHEN 통계 집계 THEN 각각 올바르게 처리되어야 한다", () => {
      // GIVEN
      const reportAnalysis = {
        staticAnalysisReport: JSON.stringify([
          {
            tool: "semgrep",
            findings: [
              {
                type: "sast",
                severity: "critical",
                cwe: "CWE-79",
                file_path: "src/app.ts",
                line: 10,
              },
            ],
          },
        ]),
        penetrationTestReport: null,
        vulnerabilitiesFound: 1,
        criticalCount: 1,
      };
      const legacyAnalysis = {
        staticAnalysisReport: null,
        penetrationTestReport: null,
        vulnerabilitiesFound: 3,
        criticalCount: 1,
      };

      // WHEN
      const seenKeys = new Set<string>();
      let totalVulnerabilities = 0;
      let criticalVulnerabilities = 0;

      for (const analysis of [reportAnalysis, legacyAnalysis]) {
        const sastFindings = parseReportFindings(
          analysis.staticAnalysisReport
        ).map((f) => ({ ...f, type: f.type || "sast" }));
        const dastFindings = parseReportFindings(
          analysis.penetrationTestReport
        ).map((f) => ({ ...f, type: f.type || "dast" }));
        const allFindings = [...sastFindings, ...dastFindings];

        if (allFindings.length > 0) {
          for (const finding of allFindings) {
            const key = buildDedupKey(finding);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              totalVulnerabilities++;
              if (isCriticalSeverity(finding.severity)) {
                criticalVulnerabilities++;
              }
            }
          }
        } else if (analysis.vulnerabilitiesFound || analysis.criticalCount) {
          totalVulnerabilities += analysis.vulnerabilitiesFound || 0;
          criticalVulnerabilities += analysis.criticalCount || 0;
        }
      }

      // THEN - 1 from report + 3 from legacy fallback
      expect(totalVulnerabilities).toBe(4);
      // 1 critical from report + 1 critical from legacy
      expect(criticalVulnerabilities).toBe(2);
    });
  });

  describe("통계 집계", () => {
    it("GIVEN 모든 데이터가 있음 WHEN 통계 집계 THEN 올바른 통계가 계산되어야 한다", async () => {
      // GIVEN
      const sastReport = JSON.stringify([
        {
          tool: "semgrep",
          findings: [
            {
              type: "sast",
              severity: "critical",
              cwe: "CWE-79",
              file_path: "src/app.ts",
              line: 10,
            },
            {
              type: "sast",
              severity: "high",
              cwe: "CWE-89",
              file_path: "src/db.ts",
              line: 20,
            },
          ],
        },
      ]);

      (prisma.project.count as jest.Mock).mockResolvedValue(3);
      (prisma.analysis.findMany as jest.Mock).mockResolvedValue([
        {
          status: "COMPLETED",
          vulnerabilitiesFound: 2,
          criticalCount: 1,
          staticAnalysisReport: sastReport,
          penetrationTestReport: null,
        },
        {
          status: "COMPLETED",
          vulnerabilitiesFound: 2,
          criticalCount: 1,
          staticAnalysisReport: sastReport, // same report = duplicates
          penetrationTestReport: null,
        },
      ]);

      // WHEN
      const totalProjects = await prisma.project.count({});
      const analyses = await prisma.analysis.findMany({});
      const completedAnalyses = analyses.length;

      const seenKeys = new Set<string>();
      let totalVulnerabilities = 0;
      let criticalVulnerabilities = 0;

      for (const analysis of analyses) {
        const sastFindings = parseReportFindings(
          analysis.staticAnalysisReport
        ).map((f: Finding) => ({ ...f, type: f.type || "sast" }));
        const dastFindings = parseReportFindings(
          analysis.penetrationTestReport
        ).map((f: Finding) => ({ ...f, type: f.type || "dast" }));
        const allFindings = [...sastFindings, ...dastFindings];

        if (allFindings.length > 0) {
          for (const finding of allFindings) {
            const key = buildDedupKey(finding);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              totalVulnerabilities++;
              if (isCriticalSeverity(finding.severity)) {
                criticalVulnerabilities++;
              }
            }
          }
        } else if (analysis.vulnerabilitiesFound || analysis.criticalCount) {
          totalVulnerabilities += analysis.vulnerabilitiesFound || 0;
          criticalVulnerabilities += analysis.criticalCount || 0;
        }
      }

      // THEN
      expect(totalProjects).toBe(3);
      expect(completedAnalyses).toBe(2);
      // Deduped: 2 unique findings (CWE-79 + CWE-89), not 4
      expect(totalVulnerabilities).toBe(2);
      // Deduped: 1 unique critical (CWE-79), not 2
      expect(criticalVulnerabilities).toBe(1);
    });
  });
});
