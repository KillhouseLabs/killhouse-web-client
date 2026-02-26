import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env";
import { processWebhook } from "@/domains/analysis/usecase/process-webhook.usecase";
import type { AnalysisRecord } from "@/domains/analysis/usecase/process-webhook.usecase";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";

const KNOWN_DB_FIELDS = [
  "status",
  "logs",
  "staticAnalysisReport",
  "penetrationTestReport",
  "vulnerabilitiesFound",
  "criticalCount",
  "highCount",
  "mediumCount",
  "lowCount",
  "infoCount",
  "executiveSummary",
  "stepResults",
  "exploitSessionId",
  "completedAt",
  "sandboxStatus",
];

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
    const { analysis_id } = body;

    if (!analysis_id) {
      return NextResponse.json(
        { success: false, error: "analysis_id is required" },
        { status: 400 }
      );
    }

    // Find the analysis record
    const analysis = await analysisRepository.findById(analysis_id);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Delegate business logic to usecase
    const updateData = processWebhook(
      analysis as unknown as AnalysisRecord,
      body
    );

    // Update the analysis record
    let updated;
    try {
      updated = await analysisRepository.update(analysis_id, updateData);
    } catch (dbError) {
      // Prisma 스키마에 없는 필드가 포함된 경우 해당 필드를 제거하고 재시도
      console.warn(
        `Webhook: DB update failed, retrying without unknown fields: ${dbError}`
      );
      const safeData = { ...updateData };
      for (const key of Object.keys(safeData)) {
        if (!KNOWN_DB_FIELDS.includes(key)) {
          delete safeData[key];
        }
      }
      updated = await analysisRepository.update(analysis_id, safeData);
    }

    console.log(`Webhook: Analysis ${analysis_id} updated to ${body.status}`);

    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `Webhook processing failed: ${error.message}`
            : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
