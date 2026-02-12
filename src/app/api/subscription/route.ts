import { NextRequest, NextResponse } from "next/server";
import { getUsageStats } from "@/domains/subscription/usecase/subscription-limits";
import {
  authenticatedHandler,
  type AuthenticatedContext,
} from "@/lib/api/middleware";

// GET /api/subscription - Get current subscription and usage
export const GET = authenticatedHandler(
  async (_request: NextRequest, context: AuthenticatedContext) => {
    const { userId } = context;

    const usage = await getUsageStats(userId);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  }
);
