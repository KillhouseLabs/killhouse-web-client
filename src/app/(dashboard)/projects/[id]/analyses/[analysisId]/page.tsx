import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
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

  const analysis = await analysisRepository.findByIdAndProject(analysisId, id);

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

  const project = await projectRepository.findByIdAndUser(
    session.user.id,
    projectId
  );

  if (!project) {
    notFound();
  }

  const analysis = await analysisRepository.findByIdAndProject(
    analysisId,
    projectId
  );

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
