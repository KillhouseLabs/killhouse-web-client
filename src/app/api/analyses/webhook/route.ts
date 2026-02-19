import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { serverEnv } from "@/config/env";
import {
  canTransition,
  mapStatusToStep,
  type AnalysisStatus,
} from "@/domains/analysis/model/analysis-state-machine";
import { appendLog } from "@/domains/analysis/model/analysis-log";

export async function POST(request: Request) {
  try {
    // API key verification
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = serverEnv.ANALYSIS_API_KEY();

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      analysis_id,
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
      error,
      log_message,
      log_level,
    } = body;

    if (!analysis_id) {
      return NextResponse.json(
        { success: false, error: "analysis_id is required" },
        { status: 400 }
      );
    }

    // Find the analysis record
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysis_id },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

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
      }
    }

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
      });
    }

    // Append error log if error is provided
    if (error) {
      const timestamp = new Date().toISOString();
      const step = mapStatusToStep(resolvedStatus);
      updatedLogs = appendLog(updatedLogs, {
        timestamp,
        step,
        level: "error",
        message: error,
      });
    }

    const updateData: Record<string, unknown> = {
      status: resolvedStatus,
      logs: updatedLogs,
    };

    if (static_analysis_report) {
      updateData.staticAnalysisReport =
        typeof static_analysis_report === "string"
          ? static_analysis_report
          : JSON.stringify(static_analysis_report);
    }

    if (penetration_test_report) {
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

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.sandboxStatus = "COMPLETED";
    }

    if (status === "COMPLETED_WITH_ERRORS") {
      updateData.completedAt = new Date();
      updateData.sandboxStatus = "COMPLETED";
    }

    if (status === "FAILED" && error) {
      updateData.sandboxStatus = "FAILED";
    }

    // Update the analysis record
    const updated = await prisma.analysis.update({
      where: { id: analysis_id },
      data: updateData,
    });

    console.log(`Webhook: Analysis ${analysis_id} updated to ${status}`);

    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
