import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverEnv } from "@/config/env";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const apiKey = serverEnv.OPENAI_API_KEY();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI 서비스가 설정되지 않았습니다" },
        { status: 503 }
      );
    }

    const finding = await request.json();

    const filePath = finding.file_path || finding.file || "";
    const ruleName =
      finding.title ||
      finding.rule_id ||
      finding.rule ||
      finding.template_id ||
      finding.name ||
      "";
    const description = finding.description || finding.message || "";

    const prompt = `당신은 보안 전문가입니다. 아래 취약점 정보를 분석하고 수정 방법을 제안해주세요.

심각도: ${finding.severity}
규칙: ${ruleName}
파일: ${filePath}${finding.line ? `:${finding.line}` : ""}
CWE: ${finding.cwe || "N/A"}
설명: ${description}

다음 JSON 형식으로만 답변해주세요 (마크다운 코드 펜스 없이):
{
  "explanation": "이 취약점이 왜 위험한지 간단히 설명",
  "suggestion": "구체적인 수정 방법 제안",
  "exampleCode": "수정된 코드 예시 (해당하는 경우)"
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { success: false, error: "AI 서비스 호출에 실패했습니다" },
        { status: 502 }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    const cleaned = content
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      data: {
        explanation: parsed.explanation || "",
        suggestion: parsed.suggestion || "",
        exampleCode: parsed.exampleCode || "",
      },
    });
  } catch (error) {
    console.error("Fix suggestion error:", error);
    return NextResponse.json(
      { success: false, error: "수정 제안 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
