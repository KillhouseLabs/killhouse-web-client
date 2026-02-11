import Link from "next/link";
import { ProjectList } from "@/components/project/project-list";

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
        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          새 프로젝트
        </Link>
      </div>

      {/* Project List */}
      <ProjectList />
    </div>
  );
}
