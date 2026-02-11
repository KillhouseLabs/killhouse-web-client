import { CreateProjectForm } from "@/components/project/create-project-form";

export const metadata = {
  title: "새 프로젝트",
  description: "새 프로젝트를 생성합니다",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
        <p className="mt-1 text-muted-foreground">
          분석할 프로젝트의 정보를 입력하세요
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateProjectForm />
      </div>
    </div>
  );
}
