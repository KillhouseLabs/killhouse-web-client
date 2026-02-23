import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  buildDedupKey,
  parseReportFindings,
  isCriticalSeverity,
} from "@/lib/vulnerability-dedup";

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

    // Get completed analyses count
    const completedAnalyses = await prisma.analysis.count({
      where: {
        project: {
          userId: session.user.id,
          status: { not: "DELETED" },
        },
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
    });

    // Get aggregate vulnerability counts across all completed analyses
    const aggregateStats = await prisma.analysis.aggregate({
      where: {
        project: {
          userId: session.user.id,
          status: { not: "DELETED" },
        },
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
      _sum: {
        vulnerabilitiesFound: true,
        criticalCount: true,
      },
    });

    // For unique vulnerability count, limit to 100 most recent analyses for deduplication
    const recentAnalysesForDedup = await prisma.analysis.findMany({
      where: {
        project: {
          userId: session.user.id,
          status: { not: "DELETED" },
        },
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS"] },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
      select: {
        staticAnalysisReport: true,
        penetrationTestReport: true,
      },
    });

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
      aggregateStats._sum.vulnerabilitiesFound || uniqueVulnerabilities;
    const criticalVulnerabilities =
      aggregateStats._sum.criticalCount || uniqueCriticalVulnerabilities;

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
