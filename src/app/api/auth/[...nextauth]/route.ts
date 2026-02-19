import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { handlers } from "@/lib/auth";
import { handleOAuthLinkCallback } from "@/app/api/integrations/link/[provider]/callback/route";

const nextAuthGet = handlers.GET;

/**
 * GET /api/auth/callback/[provider]
 *
 * oauth-link-state 쿠키가 존재하면 → 커스텀 계정 링크 플로우로 처리
 * 그렇지 않으면 → NextAuth 기본 핸들러로 위임
 */
async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const linkState = cookieStore.get("oauth-link-state")?.value;

  if (linkState) {
    // Link flow: 쿠키가 있으면 커스텀 핸들러로 처리
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    // /api/auth/callback/github → provider = "github"
    const provider = pathParts[pathParts.length - 1];

    return handleOAuthLinkCallback(request, provider);
  }

  // Normal flow: NextAuth 핸들러로 위임
  return nextAuthGet(request);
}

export { GET };
export const { POST } = handlers;
