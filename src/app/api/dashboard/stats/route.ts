import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";

interface Finding {
  type?: string;
  severity: string;
  title?: string;
  file_path?: string;
  line?: number;
  url?: string;
  cwe?: string;
}

interface Report {
  tool: string;
  findings: Finding[];
}

function buildDedupKey(finding: Finding): string {
  const isSast = finding.type === "sast";
  const identifier = finding.cwe || finding.title || "unknown";

  if (isSast) {
    return `sast:${identifier}:${finding.file_path || ""}:${finding.line ?? ""}`;
  }
  return `dast:${identifier}:${finding.url || ""}`;
}

function parseReportFindings(reportJson: string | null): Finding[] {
  if (!reportJson) return [];
  try {
    const reports: Report[] = JSON.parse(reportJson);
    if (!Array.isArray(reports)) return [];
    return reports.flatMap((r) => r.findings || []);
  } catch {
    return [];
  }
}

function isCriticalSeverity(severity: string): boolean {
  return severity.toLowerCase() === "critical";
}

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Get projects count
    const totalProjects = await prisma.project.count({
      where: {
        userId: session.user.id,
        status: { not: "DELETED" },
      },
    });

    // Get completed analyses with reports for dedup
    const analyses = await prisma.analysis.findMany({
      where: {
        project: {
          userId: session.user.id,
          status: { not: "DELETED" },
        },
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

    // Count all analyses (including non-completed) for completedAnalyses stat
    const completedAnalyses = analyses.length;

    // Deduplicate findings across all analyses
    const seenKeys = new Set<string>();
    let totalVulnerabilities = 0;
    let criticalVulnerabilities = 0;

    for (const analysis of analyses) {
      const sastFindings = parseReportFindings(
        analysis.staticAnalysisReport as string | null
      );
      const dastFindings = parseReportFindings(
        analysis.penetrationTestReport as string | null
      );

      const allFindings = [
        ...sastFindings.map((f) => ({ ...f, type: f.type || "sast" })),
        ...dastFindings.map((f) => ({ ...f, type: f.type || "dast" })),
      ];

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
        // Legacy fallback: no JSON report but has counts — best-effort, no dedup possible
        totalVulnerabilities += analysis.vulnerabilitiesFound || 0;
        criticalVulnerabilities += analysis.criticalCount || 0;
      }
    }

    // Get recent activities
    const recentAnalyses = await prisma.analysis.findMany({
      where: {
        project: {
          userId: session.user.id,
          status: { not: "DELETED" },
        },
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

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        completedAnalyses,
        totalVulnerabilities,
        criticalVulnerabilities,
        recentActivities: recentAnalyses.map(
          (a: (typeof recentAnalyses)[number]) => ({
            id: a.id,
            projectName: a.project.name,
            repoProvider: a.project.repositories[0]?.provider || null,
            status: a.status,
            startedAt: a.startedAt,
            completedAt: a.completedAt,
            vulnerabilitiesFound: a.vulnerabilitiesFound,
          })
        ),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export { buildDedupKey, parseReportFindings, isCriticalSeverity };
export type { Finding, Report };
