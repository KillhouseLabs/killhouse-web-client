import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { ProjectDetail } from "@/components/project/project-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getProject = cache(async (id: string, userId: string) => {
  return projectRepository.findFullDetailByIdAndUser(userId, id);
});

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return { title: "프로젝트" };
  }

  const project = await getProject(id, session.user.id);

  return {
    title: project?.name || "프로젝트",
    description: project?.description || "프로젝트 상세 정보",
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const project = await getProject(id, session.user.id);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
