import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";
import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/database/prisma";
import type { User } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
    GitLab({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        url: `${process.env.GITLAB_URL || "https://gitlab.com"}/oauth/authorize`,
        params: {
          scope: "read_api read_user read_repository",
        },
      },
      token: `${process.env.GITLAB_URL || "https://gitlab.com"}/oauth/token`,
      userinfo: `${process.env.GITLAB_URL || "https://gitlab.com"}/api/v4/user`,
    }),
    GitLab({
      id: "gitlab-self",
      name: "GitLab Self-Hosted",
      clientId: process.env.GITLAB_SELF_CLIENT_ID,
      clientSecret: process.env.GITLAB_SELF_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        url: `${process.env.GITLAB_SELF_URL || "https://gitlab.com"}/oauth/authorize`,
        params: {
          scope: "read_api read_user read_repository",
        },
      },
      token: `${process.env.GITLAB_SELF_URL || "https://gitlab.com"}/oauth/token`,
      userinfo: `${process.env.GITLAB_SELF_URL || "https://gitlab.com"}/api/v4/user`,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // OAuth 재로그인 시 토큰 갱신
      if (
        account?.provider === "github" ||
        account?.provider === "gitlab" ||
        account?.provider === "gitlab-self"
      ) {
        await prisma.account.updateMany({
          where: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
          data: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
          },
        });
        return true;
      }
      // Allow Google OAuth sign in
      if (account?.provider === "google") {
        return true;
      }
      // Allow credentials sign in
      if (account?.provider === "credentials") {
        return !!user;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - user object is available
      if (account && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If callbackUrl is provided and valid, use it
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
});
