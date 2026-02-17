import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AnalysisDetail } from "@/components/analysis/analysis-detail";

interface PageProps {
  params: Promise<{ id: string; analysisId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id, analysisId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return { title: "분석 상세" };
  }

  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      projectId: id,
      project: { userId: session.user.id, status: { not: "DELETED" } },
    },
  });

  return {
    title: analysis ? `분석 ${analysis.status}` : "분석 상세",
    description: "분석 결과 상세 정보",
  };
}

export default async function AnalysisDetailPage({ params }: PageProps) {
  const { id: projectId, analysisId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
      status: { not: "DELETED" },
    },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      projectId,
    },
    include: {
      repository: {
        select: { id: true, name: true, provider: true },
      },
    },
  });

  if (!analysis) {
    notFound();
  }

  return (
    <AnalysisDetail
      analysis={analysis}
      projectId={projectId}
      projectName={project.name}
    />
  );
}
