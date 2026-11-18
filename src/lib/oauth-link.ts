import { createHmac, timingSafeEqual } from "crypto";

/**
 * "Link this Google/Facebook account to me" intent.
 * Settings sets this short-lived signed cookie right before redirecting to the provider;
 * the Auth.js `signIn` callback reads it to know the OAuth round-trip is a link, not a login.
 */
export const LINK_COOKIE = "vocaz-oauth-link";
export const LINK_TTL_MS = 10 * 60 * 1000;

const secret = () => process.env.AUTH_SECRET ?? "";
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

export function signLinkIntent(userId: string, provider: string, now = Date.now()) {
  const payload = `${userId}.${provider}.${now + LINK_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the user id when the token is authentic, unexpired and issued for this provider. */
export function verifyLinkIntent(token: string | undefined, provider: string, now = Date.now()): string | null {
  if (!token || !secret()) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, tokenProvider, exp, mac] = parts;
  const expected = Buffer.from(sign(`${userId}.${tokenProvider}.${exp}`));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (tokenProvider !== provider || Number(exp) < now) return null;
  return userId;
}
