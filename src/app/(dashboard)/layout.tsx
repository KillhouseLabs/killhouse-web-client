import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/layout/dashboard-sidebar";
import { AppFooter } from "@/components/layout/app-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
        <AppFooter variant="compact" />
      </div>
    </div>
  );
}
