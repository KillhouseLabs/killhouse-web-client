import {
  canTransition,
  mapStatusToStep,
  type AnalysisStatus,
} from "@/domains/analysis/model/analysis-state-machine";
import { appendLog } from "@/domains/analysis/model/analysis-log";

export interface WebhookPayload {
  status?: string;
  static_analysis_report?: unknown;
  penetration_test_report?: unknown;
  executive_summary?: string;
  step_results?: unknown;
  exploit_session_id?: string;
  vulnerabilities_found?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  info_count?: number;
  error?: string;
  log_message?: string;
  log_level?: string;
  raw_output?: string;
}

export interface AnalysisRecord {
  id: string;
  status: string;
  logs: string | null;
  staticAnalysisReport: string | null;
  penetrationTestReport: string | null;
  vulnerabilitiesFound: number | null;
  criticalCount: number | null;
  highCount: number | null;
  mediumCount: number | null;
  lowCount: number | null;
  infoCount?: number | null;
}

export interface WebhookUpdateData {
  [key: string]: unknown;
}

/**
 * Helper: determine if incoming report should update the stored report
 */
function shouldUpdateReport(
  incoming: unknown,
  existingReport: string | null
): boolean {
  const parsed = typeof incoming === "string" ? JSON.parse(incoming) : incoming;

  // If there's no existing report, always save the incoming report
  if (!existingReport) return true;

  // Don't overwrite if the step was skipped
  if (parsed?.step_result?.status === "skipped") return false;

  // Don't overwrite existing report with empty findings
  if (parsed?.findings?.length === 0) {
    try {
      const existing = JSON.parse(existingReport);
      if (existing?.findings?.length > 0) return false;
    } catch {
      // If existing report is not valid JSON, allow overwrite
    }
  }
  return true;
}

/**
 * Process webhook payload and return the update data for the analysis record.
 *
 * This is a pure function with no side effects. It handles:
 * - State transitions using the analysis state machine
 * - Log building (status transitions, custom messages, errors)
 * - Report overwrite protection
 * - Vulnerability count accumulation
 * - Terminal state handling (completedAt, sandboxStatus)
 */
export function processWebhook(
  analysis: AnalysisRecord,
  payload: WebhookPayload
): WebhookUpdateData {
  const {
    status,
    static_analysis_report,
    penetration_test_report,
    executive_summary,
    step_results,
    exploit_session_id,
    vulnerabilities_found,
    critical_count,
    high_count,
    medium_count,
    low_count,
    info_count,
    error: webhookError,
    log_message,
    log_level,
    raw_output,
  } = payload;

  // Build update data
  const currentStatus = analysis.status as AnalysisStatus;
  let resolvedStatus = currentStatus;
  let updatedLogs = analysis.logs;

  // Determine the resolved status using the state machine
  if (status) {
    const newStatus = status as AnalysisStatus;
    if (canTransition(currentStatus, newStatus)) {
      resolvedStatus = newStatus;

      // Auto-generate status transition log
      const timestamp = new Date().toISOString();
      const step = mapStatusToStep(resolvedStatus);
      updatedLogs = appendLog(updatedLogs, {
        timestamp,
        step,
        level: "info",
        message: `상태 변경: ${currentStatus} → ${resolvedStatus}`,
      });
    } else {
      updatedLogs = appendLog(updatedLogs, {
        timestamp: new Date().toISOString(),
        step: mapStatusToStep(newStatus),
        level: "warn",
        message: `상태 전이 거부됨: ${currentStatus} → ${newStatus}`,
      });
    }
  }

  const statusTransitionAccepted = resolvedStatus !== currentStatus;

  // Append custom log message if provided
  if (log_message) {
    const timestamp = new Date().toISOString();
    const step = mapStatusToStep(resolvedStatus);
    const level = log_level || "info";
    updatedLogs = appendLog(updatedLogs, {
      timestamp,
      step,
      level: level as "info" | "warn" | "error" | "success",
      message: log_message,
      ...(raw_output ? { rawOutput: raw_output } : {}),
    });
  }

  // Append error log if error is provided
  if (webhookError) {
    const timestamp = new Date().toISOString();
    const step = mapStatusToStep(resolvedStatus);
    updatedLogs = appendLog(updatedLogs, {
      timestamp,
      step,
      level: "error",
      message: webhookError,
    });
  }

  const updateData: Record<string, unknown> = {
    status: resolvedStatus,
    logs: updatedLogs,
  };

  if (
    static_analysis_report &&
    shouldUpdateReport(static_analysis_report, analysis.staticAnalysisReport)
  ) {
    updateData.staticAnalysisReport =
      typeof static_analysis_report === "string"
        ? static_analysis_report
        : JSON.stringify(static_analysis_report);
  }

  if (
    penetration_test_report &&
    shouldUpdateReport(penetration_test_report, analysis.penetrationTestReport)
  ) {
    updateData.penetrationTestReport =
      typeof penetration_test_report === "string"
        ? penetration_test_report
        : JSON.stringify(penetration_test_report);
  }

  // Accumulate counts (SAST and DAST callbacks may arrive separately)
  if (vulnerabilities_found !== undefined) {
    updateData.vulnerabilitiesFound =
      (analysis.vulnerabilitiesFound || 0) + vulnerabilities_found;
  }
  if (critical_count !== undefined) {
    updateData.criticalCount = (analysis.criticalCount || 0) + critical_count;
  }
  if (high_count !== undefined) {
    updateData.highCount = (analysis.highCount || 0) + high_count;
  }
  if (medium_count !== undefined) {
    updateData.mediumCount = (analysis.mediumCount || 0) + medium_count;
  }
  if (low_count !== undefined) {
    updateData.lowCount = (analysis.lowCount || 0) + low_count;
  }
  if (info_count !== undefined) {
    const currentInfoCount = analysis.infoCount || 0;
    updateData.infoCount = currentInfoCount + info_count;
  }

  if (executive_summary) {
    updateData.executiveSummary = executive_summary;
  }

  if (step_results) {
    updateData.stepResults =
      typeof step_results === "string"
        ? step_results
        : JSON.stringify(step_results);
  }

  if (exploit_session_id) {
    updateData.exploitSessionId = exploit_session_id;
  }

  // Only set terminal fields when the state transition was actually accepted
  if (statusTransitionAccepted) {
    if (resolvedStatus === "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.sandboxStatus = "COMPLETED";
    }

    if (resolvedStatus === "COMPLETED_WITH_ERRORS") {
      updateData.completedAt = new Date();
      updateData.sandboxStatus = "COMPLETED";
    }

    if (resolvedStatus === "FAILED") {
      updateData.completedAt = new Date();
      updateData.sandboxStatus = "FAILED";
    }
  }

  return updateData;
}
