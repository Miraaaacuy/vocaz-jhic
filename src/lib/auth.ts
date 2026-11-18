import NextAuth, { CredentialsSignin } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { authConfig } from "./auth.config";
import { cookies } from "next/headers";
import { ROLE_HOME } from "./constants";
import { LINK_COOKIE, verifyLinkIntent } from "./oauth-link";

class SuspendedError extends CredentialsSignin {
  code = "suspended";
}

/** Social providers are only enabled when their keys are set (AUTH_GOOGLE_ID/SECRET, AUTH_FACEBOOK_ID/SECRET). */
export const OAUTH_PROVIDERS = {
  google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  facebook: !!(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET),
};
export type OAuthProvider = keyof typeof OAUTH_PROVIDERS;

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(raw);
      if (!parsed.success) return null;
      const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
      if (!user) return null;
      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;
      if (user.status === "SUSPENDED") throw new SuspendedError();
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl, role: user.role };
    },
  }),
];
if (OAUTH_PROVIDERS.google) providers.push(Google);
if (OAUTH_PROVIDERS.facebook) providers.push(Facebook);

/**
 * Social sign-in never creates accounts and never matches by email. A Google/Facebook
 * account only works after its owner linked it from Settings (see `linkOAuth`):
 *  - link mode  → the signed intent cookie is present: store the link for that user
 *  - login mode → look the link up; unknown social accounts are sent back to /login
 */
async function resolveOAuthUser(provider: string, providerAccountId: string, email: string | null) {
  const jar = await cookies();
  const linkingUserId = verifyLinkIntent(jar.get(LINK_COOKIE)?.value, provider);
  const existing = await db.oAuthAccount.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } }, include: { user: true } });

  if (linkingUserId) {
    try {
      jar.delete(LINK_COOKIE);
    } catch {
      /* read-only cookie store — the intent expires on its own after 10 minutes */
    }
    const me = await db.user.findUnique({ where: { id: linkingUserId } });
    if (!me) return "/login";
    const settings = `${ROLE_HOME[me.role]}/settings`;
    if (existing && existing.userId !== me.id) return `${settings}?oauth=taken`;
    await db.oAuthAccount.upsert({
      where: { userId_provider: { userId: me.id, provider } },
      create: { userId: me.id, provider, providerAccountId, email },
      update: { providerAccountId, email },
    });
    return me;
  }

  if (!existing) return `/login?error=notlinked&provider=${provider}`;
  if (existing.user.status === "SUSPENDED") return "/login?error=suspended";
  await db.user.update({ where: { id: existing.userId }, data: { lastLoginAt: new Date() } });
  return existing.user;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      const dbUser = await resolveOAuthUser(account.provider, account.providerAccountId, user.email?.toLowerCase() ?? null);
      if (typeof dbUser === "string") return dbUser; // redirect with an explanation
      // hand the VocAZ identity (not the provider's) to the jwt callback
      Object.assign(user, { id: dbUser.id, role: dbUser.role, name: dbUser.name, email: dbUser.email, image: dbUser.avatarUrl });
      return true;
    },
  },
});
