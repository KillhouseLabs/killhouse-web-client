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
  completedAt: string | null;
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

  const isTerminal = analysis
    ? TERMINAL_STATUSES.includes(analysis.status)
    : false;

  const fetchAnalysis = useCallback(async () => {
    if (!projectId || !analysisId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/analyses/${analysisId}`
      );
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.data) {
        setAnalysis(data.data);
        if (TERMINAL_STATUSES.includes(data.data.status)) {
          isTerminalRef.current = true;
        }
      }
    } catch {
      // Retry on next interval
    } finally {
      setIsLoading(false);
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
    };
  }, [enabled, analysisId, fetchAnalysis]);

  // Reset terminal flag when analysisId changes
  useEffect(() => {
    isTerminalRef.current = false;
    setAnalysis(null);
  }, [analysisId]);

  return { analysis, isTerminal, isLoading };
}
