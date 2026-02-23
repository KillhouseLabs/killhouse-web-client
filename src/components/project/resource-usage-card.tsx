"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

interface ResourceItem {
  label: string;
  current: number;
  limit: number;
  unlimited: boolean;
}

interface ResourceData {
  planId: string;
  planName: string;
  status: string;
  resources: ResourceItem[];
}

interface ResourceUsageCardProps {
  projectId: string;
}

function getProgressColor(current: number, limit: number): string {
  if (limit <= 0) return "bg-primary";
  const ratio = current / limit;
  if (ratio >= 1) return "bg-destructive";
  if (ratio >= 0.8) return "bg-orange-500";
  return "bg-primary";
}

function getProgressWidth(current: number, limit: number): string {
  if (limit <= 0) return "0%";
  const percent = Math.min((current / limit) * 100, 100);
  return `${percent}%`;
}

export function ResourceUsageCard({ projectId }: ResourceUsageCardProps) {
  const { t } = useLocale();
  const [data, setData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    // Abort previous request
    abortControllerRef.current?.abort();

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`/api/projects/${projectId}/resources`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      // Silently fail for other errors - card is informational
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling interval
    intervalRef.current = setInterval(fetchData, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when tab becomes visible
        fetchData();
        intervalRef.current = setInterval(fetchData, 30_000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t.project.resourceUsage.title}
        </h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {data.planName}
        </span>
      </div>
      <div className="space-y-4">
        {data.resources.map((resource) => (
          <div key={resource.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{resource.label}</span>
              {resource.unlimited ? (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {t.common.unlimited}
                </span>
              ) : (
                <span className="font-medium">
                  {resource.current}/{resource.limit}
                </span>
              )}
            </div>
            {!resource.unlimited && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(resource.current, resource.limit)}`}
                  style={{
                    width: getProgressWidth(resource.current, resource.limit),
                  }}
                />
              </div>
            )}
            {!resource.unlimited &&
              resource.current >= resource.limit &&
              resource.limit > 0 && (
                <p className="mt-1 text-xs text-destructive">
                  {t.project.resourceUsage.limitReachedMessage}
                </p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
