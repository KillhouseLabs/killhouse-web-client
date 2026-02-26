import { NextResponse } from "next/server";
import { createPatch } from "diff";
import { auth } from "@/lib/auth";
import { accountRepository } from "@/domains/auth/infra/prisma-account.repository";
import { analysisRepository } from "@/domains/analysis/infra/prisma-analysis.repository";
import { serverEnv } from "@/config/env";
import {
  createGitHubClient,
  getFileContent,
} from "@/infrastructure/github/github-client";

interface CodeFixRequest {
  analysisId: string;
  finding: {
    file_path?: string;
    file?: string;
    line?: number;
    severity: string;
    title?: string;
    rule_id?: string;
    rule?: string;
    template_id?: string;
    name?: string;
    description?: string;
    message?: string;
    cwe?: string;
  };
}

const CONTEXT_LINES = 15;

function extractLines(
  content: string,
  targetLine: number,
  contextLines: number
): { text: string; startLine: number } {
  const lines = content.split("\n");
  const start = Math.max(0, targetLine - contextLines - 1);
  const end = Math.min(lines.length, targetLine + contextLines);
  return {
    text: lines.slice(start, end).join("\n"),
    startLine: start + 1,
  };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body: CodeFixRequest = await request.json();
    const { analysisId, finding } = body;

    if (!analysisId || !finding) {
      return NextResponse.json(
        { success: false, error: "analysisId와 finding이 필요합니다" },
        { status: 400 }
      );
    }

    const filePath = finding.file_path || finding.file || "";
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "파일 경로가 필요합니다" },
        { status: 400 }
      );
    }

    // 1. Fetch analysis with repository
    const analysis = await analysisRepository.findByIdWithOwnership(analysisId);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "분석을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (analysis.project.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const repo = analysis.repository;
    if (!repo?.owner || !repo?.name) {
      return NextResponse.json(
        { success: false, error: "저장소 정보가 없습니다" },
        { status: 400 }
      );
    }

    // 2. Get OAuth access token
    const account = await accountRepository.findAccessToken(
      session.user.id,
      "github"
    );

    if (!account?.access_token) {
      return NextResponse.json(
        { success: false, error: "GitHub 연동이 필요합니다" },
        { status: 400 }
      );
    }

    // 3. Fetch source code from GitHub
    const client = createGitHubClient(account.access_token);
    let fullContent: string;
    try {
      fullContent = await getFileContent(
        client,
        repo.owner,
        repo.name,
        filePath,
        analysis.branch
      );
    } catch {
      return NextResponse.json(
        { success: false, error: "소스 파일을 가져올 수 없습니다" },
        { status: 404 }
      );
    }

    // 4. Normalize line endings and extract relevant lines
    const normalizedContent = fullContent.replace(/\r\n/g, "\n");
    const targetLine = finding.line || 1;
    const { text: originalCode, startLine } = extractLines(
      normalizedContent,
      targetLine,
      CONTEXT_LINES
    );

    // 5. Call scanner-engine fix-suggestion API
    const scannerUrl = serverEnv.SCANNER_API_URL();
    const ruleName =
      finding.title ||
      finding.rule_id ||
      finding.rule ||
      finding.template_id ||
      finding.name ||
      "";
    const description = finding.description || finding.message || "";

    const scannerResponse = await fetch(`${scannerUrl}/api/fix-suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: originalCode,
        file_path: filePath,
        line: targetLine,
        severity: finding.severity,
        rule: ruleName,
        cwe: finding.cwe || "",
        description,
      }),
    });

    if (!scannerResponse.ok) {
      const errorText = await scannerResponse.text();
      console.error("Scanner fix-suggestion error:", errorText);

      let detail = "코드 수정 제안 생성에 실패했습니다";
      if (scannerResponse.status === 503) {
        detail = "AI 서비스가 설정되지 않았습니다 (OpenAI API 키 확인 필요)";
      } else if (scannerResponse.status === 502) {
        detail = "AI 서비스 호출에 실패했습니다 (API 키 만료 또는 서비스 오류)";
      }

      return NextResponse.json(
        { success: false, error: detail },
        { status: scannerResponse.status >= 500 ? 502 : scannerResponse.status }
      );
    }

    const scannerResult = await scannerResponse.json();
    const fixedCode: string = scannerResult.fixed_code;
    const explanation: string = scannerResult.explanation;

    // 6. Generate unified diff
    const unifiedDiff = createPatch(
      filePath,
      originalCode,
      fixedCode,
      "원본",
      "수정"
    );

    return NextResponse.json({
      success: true,
      data: {
        originalCode,
        fixedCode,
        unifiedDiff,
        explanation,
        filePath,
        startLine,
      },
    });
  } catch (error) {
    console.error("Code fix error:", error);
    return NextResponse.json(
      { success: false, error: "코드 수정 제안 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
