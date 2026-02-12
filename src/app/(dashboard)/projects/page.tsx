import { ProjectList } from "@/components/project/project-list";
import { NewProjectButton } from "@/components/project/new-project-button";

export const metadata = {
  title: "프로젝트",
  description: "프로젝트 목록을 확인하고 관리하세요",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="mt-1 text-muted-foreground">
            프로젝트를 관리하고 분석 결과를 확인하세요
          </p>
        </div>
        <NewProjectButton />
      </div>

      {/* Project List */}
      <ProjectList />
    </div>
  );
}
