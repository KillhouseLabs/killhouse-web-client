import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export const metadata = {
  title: "대시보드",
  description: "프로젝트 및 분석 현황을 확인하세요",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="mt-1 text-muted-foreground">
          프로젝트 현황과 최근 분석 결과를 확인하세요
        </p>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />
    </div>
  );
}
