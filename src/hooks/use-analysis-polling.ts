"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TERMINAL_STATUSES = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
  "CANCELLED",
];
const POLLING_INTERVAL = 3000;

interface PollingAnalysis {
  id: string;
  status: string;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount?: number;
  completedAt: string | null;
  logs: string | null;
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  stepResults: string | null;
}

interface UseAnalysisPollingResult {
  analysis: PollingAnalysis | null;
  isTerminal: boolean;
  isLoading: boolean;
}

export function useAnalysisPolling(
  projectId: string,
  analysisId: string | null,
  enabled: boolean = true
): UseAnalysisPollingResult {
  const [analysis, setAnalysis] = useState<PollingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTerminalRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialFetchRef = useRef(true);

  const isTerminal = analysis
    ? TERMINAL_STATUSES.includes(analysis.status)
    : false;

  const fetchAnalysis = useCallback(async () => {
    if (!projectId || !analysisId) return;

    // Abort previous request
    abortControllerRef.current?.abort();

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Only set loading for initial fetch
      if (isInitialFetchRef.current) {
        setIsLoading(true);
      }

      const response = await fetch(
        `/api/projects/${projectId}/analyses/${analysisId}`,
        { signal: controller.signal }
      );
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.data) {
        setAnalysis(data.data);
        if (TERMINAL_STATUSES.includes(data.data.status)) {
          isTerminalRef.current = true;
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      // Retry on next interval for other errors
    } finally {
      if (isInitialFetchRef.current) {
        setIsLoading(false);
        isInitialFetchRef.current = false;
      }
    }
  }, [projectId, analysisId]);

  useEffect(() => {
    if (!enabled || !analysisId || isTerminalRef.current) return;

    // Immediate fetch
    fetchAnalysis();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isTerminalRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      fetchAnalysis();
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortControllerRef.current?.abort();
    };
  }, [enabled, analysisId, fetchAnalysis]);

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
        if (enabled && analysisId && !isTerminalRef.current) {
          fetchAnalysis();
          intervalRef.current = setInterval(() => {
            if (isTerminalRef.current) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              return;
            }
            fetchAnalysis();
          }, POLLING_INTERVAL);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, analysisId, fetchAnalysis]);

  // Reset terminal flag when analysisId changes
  useEffect(() => {
    isTerminalRef.current = false;
    isInitialFetchRef.current = true;
    setAnalysis(null);
  }, [analysisId]);

  return { analysis, isTerminal, isLoading };
}
