import { CreateProjectForm } from "@/components/project/create-project-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "새 프로젝트",
  description: "새 프로젝트를 생성합니다",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <PageHeader titleKey="newProject" />

      {/* Form Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateProjectForm />
      </div>
    </div>
  );
}
