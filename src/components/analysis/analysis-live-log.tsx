"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  parseAnalysisLogs,
  groupLogsByStep,
} from "@/domains/analysis/model/analysis-log";
import {
  mapStatusToStep,
  type AnalysisStatus,
} from "@/domains/analysis/model/analysis-state-machine";

interface AnalysisLiveLogProps {
  logs: string | null;
  currentStatus: string;
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

const levelColors: Record<string, string> = {
  info: "text-foreground",
  warn: "text-yellow-600",
  error: "text-red-600",
  success: "text-green-600",
};

export function AnalysisLiveLog({ logs, currentStatus }: AnalysisLiveLogProps) {
  const lastLogRef = useRef<HTMLDivElement>(null);

  const logEntries = useMemo(() => parseAnalysisLogs(logs), [logs]);
  const grouped = useMemo(() => groupLogsByStep(logEntries), [logEntries]);
  const currentStepName = mapStatusToStep(currentStatus as AnalysisStatus);

  // Auto-scroll to last log entry when new logs arrive
  useEffect(() => {
    if (typeof lastLogRef.current?.scrollIntoView === "function") {
      lastLogRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [logEntries.length]);

  if (logEntries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">분석 로그</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {Array.from(grouped.entries()).map(([stepName, entries], idx) => {
          const isCurrentStep = stepName === currentStepName;
          return (
            <details key={stepName} open={isCurrentStep}>
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {stepName}
                <span className="text-xs text-muted-foreground">
                  ({entries.length})
                </span>
              </summary>
              <div className="space-y-0.5 px-4 pb-2">
                {entries.map((entry, entryIdx) => {
                  const isLastLog =
                    idx === grouped.size - 1 && entryIdx === entries.length - 1;
                  return (
                    <div
                      key={entryIdx}
                      className="flex gap-3 py-0.5 font-mono text-xs"
                      ref={isLastLog ? lastLogRef : null}
                    >
                      <span className="shrink-0 text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </span>
                      <span
                        className={levelColors[entry.level] || levelColors.info}
                      >
                        {entry.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
