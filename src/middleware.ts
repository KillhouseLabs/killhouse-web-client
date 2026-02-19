import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitConfig } from "@/lib/rate-limit";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/projects", "/mypage", "/subscription"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(req);
    const { config: limitConfig, prefix } = getRateLimitConfig(pathname);
    const result = checkRateLimit(ip, prefix, limitConfig);

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "요청이 너무 많습니다. 잠시 후 다시 시도하세요.",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfter),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetTime),
          },
        }
      );
    }
  }

  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
