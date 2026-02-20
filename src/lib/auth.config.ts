import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-safe auth config for middleware.
 * Does NOT include PrismaAdapter, bcrypt, or any Node.js-only dependencies.
 * Full auth config with adapter is in auth.ts (server-side only).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    GitLab({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const protectedRoutes = [
        "/dashboard",
        "/projects",
        "/mypage",
        "/subscription",
      ];
      const authRoutes = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ];

      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );
      const isAuthRoute = authRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true;
    },
  },
};
