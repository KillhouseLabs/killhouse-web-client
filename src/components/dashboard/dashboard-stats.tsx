"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useLocale } from "@/lib/i18n/locale-context";

interface DashboardStats {
  totalProjects: number;
  completedAnalyses: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  recentActivities: {
    id: string;
    projectName: string;
    projectType: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    vulnerabilitiesFound: number | null;
  }[];
}

export function DashboardStats() {
  const { t } = useLocale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats");
        const data = await response.json();

        if (response.ok) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
        {/* Loading Recent Activity */}
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  const displayStats = stats || {
    totalProjects: 0,
    completedAnalyses: 0,
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
    recentActivities: [],
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t.dashboard.statsLabels.totalProjects}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {displayStats.totalProjects}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-green-500"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t.dashboard.statsLabels.completedAnalyses}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {displayStats.completedAnalyses}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-yellow-500"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t.dashboard.statsLabels.vulnerabilitiesFound}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {displayStats.totalVulnerabilities}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-red-500"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t.dashboard.statsLabels.criticalVulnerabilities}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {displayStats.criticalVulnerabilities}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {t.dashboard.quickStartTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">
                {t.dashboard.quickActions.createProject}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.dashboard.quickActions.createProjectDescription}
              </p>
            </div>
          </Link>

          <Link
            href="/projects"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">
                {t.dashboard.quickActions.viewProjects}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.dashboard.quickActions.viewProjectsDescription}
              </p>
            </div>
          </Link>

          <Link
            href="/subscription"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">
                {t.dashboard.quickActions.upgradePlan}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.dashboard.quickActions.upgradePlanDescription}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {t.dashboard.recentActivityTitle}
        </h2>
        {displayStats.recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-muted-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="mb-1 font-medium">
              {t.dashboard.noActivityHeading}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t.dashboard.noActivityMessage}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayStats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      activity.status === "COMPLETED"
                        ? "bg-green-500/10"
                        : activity.status === "FAILED"
                          ? "bg-red-500/10"
                          : "bg-yellow-500/10"
                    }`}
                  >
                    {activity.projectType === "CODE" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-5 w-5 ${
                          activity.status === "COMPLETED"
                            ? "text-green-500"
                            : activity.status === "FAILED"
                              ? "text-red-500"
                              : "text-yellow-500"
                        }`}
                      >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-5 w-5 ${
                          activity.status === "COMPLETED"
                            ? "text-green-500"
                            : activity.status === "FAILED"
                              ? "text-red-500"
                              : "text-yellow-500"
                        }`}
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.projectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.status === "COMPLETED"
                        ? `${t.dashboard.activity.completed} · ${activity.vulnerabilitiesFound || 0}개 취약점 발견`
                        : activity.status === "FAILED"
                          ? t.dashboard.activity.failed
                          : t.dashboard.activity.inProgress}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.startedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
