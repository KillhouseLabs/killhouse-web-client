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

    const body = await request.json();
    const { finding, question, context } = body;

    if (!finding || !question) {
      return NextResponse.json(
        { success: false, error: "finding과 question은 필수입니다" },
        { status: 400 }
      );
    }

    const filePath = finding.file_path || finding.file || "";
    const ruleName =
      finding.title ||
      finding.rule_id ||
      finding.rule ||
      finding.template_id ||
      finding.name ||
      "";
    const description = finding.description || finding.message || "";

    const systemPrompt = `당신은 보안 전문가입니다. 사용자가 취약점 스캔 결과에 대해 질문합니다.
아래 취약점 컨텍스트를 기반으로 한국어로 답변해주세요. 답변은 간결하면서도 구체적이어야 합니다.

취약점 정보:
- 심각도: ${finding.severity}
- 규칙/템플릿: ${ruleName}
- 파일: ${filePath}${finding.line ? `:${finding.line}` : ""}
- URL: ${finding.url || "N/A"}
- CWE: ${finding.cwe || "N/A"}
- 설명: ${description}
${context ? `\n추가 컨텍스트:\n${context}` : ""}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.4,
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
    const answer = result.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      data: { answer },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { success: false, error: "AI 질의 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
