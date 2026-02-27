import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
import {
  buildDedupKey,
  parseReportFindings,
  isCriticalSeverity,
} from "@/domains/analysis/model/vulnerability-dedup";

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
    const totalProjects = await projectRepository.countActiveByUser(
      session.user.id
    );

    // Get completed analyses count
    const completedAnalyses = await analysisRepository.countCompletedByUser(
      session.user.id
    );

    // Get aggregate vulnerability counts across all completed analyses
    const aggregateStats = await analysisRepository.aggregateByUser(
      session.user.id
    );

    // For unique vulnerability count, limit to 100 most recent analyses for deduplication
    const recentAnalysesForDedup = await analysisRepository.findRecentForDedup(
      session.user.id,
      100
    );

    // Deduplicate findings across recent analyses only
    const seenKeys = new Set<string>();
    let uniqueVulnerabilities = 0;
    let uniqueCriticalVulnerabilities = 0;

    for (const analysis of recentAnalysesForDedup) {
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

      for (const finding of allFindings) {
        const key = buildDedupKey(finding);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueVulnerabilities++;
          if (isCriticalSeverity(finding.severity)) {
            uniqueCriticalVulnerabilities++;
          }
        }
      }
    }

    // Use aggregate totals, fall back to deduplicated counts if aggregate is empty
    const totalVulnerabilities =
      aggregateStats.vulnerabilitiesFound || uniqueVulnerabilities;
    const criticalVulnerabilities =
      aggregateStats.criticalCount || uniqueCriticalVulnerabilities;

    // Get recent activities
    const recentAnalyses = await analysisRepository.findRecentWithProject(
      session.user.id,
      5
    );

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
