/**
 * Test Login API
 *
 * E2E 테스트를 위한 테스트 로그인 엔드포인트
 * 개발 환경에서만 사용 가능
 */

import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/domains/auth/infra/prisma-user.repository";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

const AUTH_SECRET = process.env.AUTH_SECRET;

/**
 * GET /api/auth/test-login
 * 테스트 사용자로 로그인
 */
export async function GET(request: NextRequest) {
  // 프로덕션 환경에서는 사용 불가
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "Email query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // 사용자 조회
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // 테스트 사용자가 없으면 로그인 페이지로 리다이렉트
      console.log(`[Test Login] User not found: ${email}`);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // JWT 토큰 생성 (next-auth 호환)
    if (!AUTH_SECRET) {
      return NextResponse.json(
        { error: "AUTH_SECRET not configured" },
        { status: 500 }
      );
    }

    const token = await encode({
      token: {
        sub: user.id,
        id: user.id, // auth.ts의 jwt 콜백과 session 콜백이 id 필드를 기대함
        email: user.email,
        name: user.name,
        picture: user.image,
      },
      secret: AUTH_SECRET,
      salt: "authjs.session-token",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // 세션 쿠키 설정
    const cookieStore = cookies();
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: false, // 개발 환경에서는 HTTP 허용
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    console.log(`[Test Login] Logged in as: ${email}`);

    // 대시보드로 리다이렉트
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("[Test Login Error]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
