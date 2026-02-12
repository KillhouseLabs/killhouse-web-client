/**
 * Payment Callback API
 *
 * PortOne 결제 완료 후 리다이렉트 콜백
 * KG이니시스 등 일부 PG사는 결제 완료 후 이 URL로 리다이렉트됨
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/payment/callback
 * 결제 완료 후 리다이렉트 처리
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentId = searchParams.get("paymentId");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  console.log("[Payment Callback] Received:", { paymentId, code, message });

  // 결제 실패 시
  if (code) {
    return NextResponse.redirect(
      new URL(
        `/subscription?error=${encodeURIComponent(message || "결제에 실패했습니다")}`,
        request.url
      )
    );
  }

  // 결제 성공 시 - 구독 페이지로 리다이렉트하고 클라이언트에서 검증 처리
  if (paymentId) {
    return NextResponse.redirect(
      new URL(
        `/subscription?paymentId=${encodeURIComponent(paymentId)}&verify=true`,
        request.url
      )
    );
  }

  // paymentId 없이 콜백된 경우
  return NextResponse.redirect(new URL("/subscription", request.url));
}

/**
 * POST /api/payment/callback
 * 일부 PG사는 POST로 콜백하기도 함
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Payment Callback POST] Received:", body);

    const paymentId = body.paymentId || body.payment_id;
    const code = body.code;
    const message = body.message;

    if (code) {
      return NextResponse.redirect(
        new URL(
          `/subscription?error=${encodeURIComponent(message || "결제에 실패했습니다")}`,
          request.url
        )
      );
    }

    if (paymentId) {
      return NextResponse.redirect(
        new URL(
          `/subscription?paymentId=${encodeURIComponent(paymentId)}&verify=true`,
          request.url
        )
      );
    }

    return NextResponse.redirect(new URL("/subscription", request.url));
  } catch {
    return NextResponse.redirect(new URL("/subscription", request.url));
  }
}
