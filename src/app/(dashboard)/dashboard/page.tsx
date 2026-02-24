import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "대시보드",
  description: "프로젝트 및 분석 현황을 확인하세요",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader titleKey="dashboard" />

      {/* Dashboard Stats */}
      <DashboardStats />
    </div>
  );
}
