import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";

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

    // Get analyses statistics
    const analyses = await prisma.analysis.findMany({
      where: {
        project: {
          userId: session.user.id,
          status: { not: "DELETED" },
        },
      },
      select: {
        status: true,
        vulnerabilitiesFound: true,
        criticalCount: true,
      },
    });

    const completedAnalyses = analyses.filter(
      (a: { status: string }) => a.status === "COMPLETED"
    ).length;

    const totalVulnerabilities = analyses.reduce(
      (sum: number, a: { vulnerabilitiesFound: number | null }) =>
        sum + (a.vulnerabilitiesFound || 0),
      0
    );

    const criticalVulnerabilities = analyses.reduce(
      (sum: number, a: { criticalCount: number | null }) =>
        sum + (a.criticalCount || 0),
      0
    );

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
