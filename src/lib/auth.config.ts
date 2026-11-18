import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

const ROLE_PREFIX: Record<string, Role> = {
  "/student": "STUDENT",
  "/company": "COMPANY",
  "/school": "SCHOOL",
  "/institution": "INSTITUTION",
  "/admin": "ADMIN",
};

// Edge-safe config (no Prisma) — used by middleware
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const prefix = Object.keys(ROLE_PREFIX).find((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!prefix) return true;
      if (!auth?.user) return false; // → redirect to /login?callbackUrl=
      if (auth.user.role !== ROLE_PREFIX[prefix]) {
        return Response.redirect(new URL("/forbidden", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
