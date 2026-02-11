import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="ml-64 flex-1">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
