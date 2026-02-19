"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [data, setData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/resources`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silently fail - card is informational
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
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
        <h2 className="text-lg font-semibold">리소스 사용량</h2>
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
                  무제한
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
                  한도에 도달했습니다. 플랜 업그레이드가 필요합니다.
                </p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
