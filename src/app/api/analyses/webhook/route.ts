import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { serverEnv } from "@/config/env";

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
      vulnerabilities_found,
      critical_count,
      high_count,
      medium_count,
      low_count,
      error,
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
    const VALID_STATUSES = [
      "CLONING",
      "STATIC_ANALYSIS",
      "BUILDING",
      "PENETRATION_TEST",
      "COMPLETED",
      "COMPLETED_WITH_ERRORS",
      "FAILED",
    ];
    const TERMINAL_STATUSES = ["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED", "CANCELLED"];

    const isCurrentTerminal = TERMINAL_STATUSES.includes(analysis.status);
    const isNewStatusValid = VALID_STATUSES.includes(status);
    const isNewTerminal = TERMINAL_STATUSES.includes(status);

    // Allow intermediate status updates only if current status is not terminal.
    // Always allow COMPLETED/FAILED to override non-terminal states.
    const resolvedStatus =
      isNewTerminal && isNewStatusValid
        ? status
        : !isCurrentTerminal && isNewStatusValid
          ? status
          : analysis.status;

    const updateData: Record<string, unknown> = {
      status: resolvedStatus,
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

    if (vulnerabilities_found !== undefined) {
      updateData.vulnerabilitiesFound = vulnerabilities_found;
    }
    if (critical_count !== undefined) {
      updateData.criticalCount = critical_count;
    }
    if (high_count !== undefined) {
      updateData.highCount = high_count;
    }
    if (medium_count !== undefined) {
      updateData.mediumCount = medium_count;
    }
    if (low_count !== undefined) {
      updateData.lowCount = low_count;
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
