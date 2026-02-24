import { ProjectList } from "@/components/project/project-list";
import { NewProjectButton } from "@/components/project/new-project-button";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "프로젝트",
  description: "프로젝트 목록을 확인하고 관리하세요",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <PageHeader titleKey="projects" />
        <NewProjectButton />
      </div>

      {/* Project List */}
      <ProjectList />
    </div>
  );
}
