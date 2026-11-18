import { beforeAll, describe, expect, it } from "vitest";
import { LINK_TTL_MS, signLinkIntent, verifyLinkIntent } from "./oauth-link";

describe("oauth link intent cookie", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret";
  });

  it("accepts a fresh token for the same provider", () => {
    expect(verifyLinkIntent(signLinkIntent("user1", "google"), "google")).toBe("user1");
  });

  it("rejects a token issued for another provider", () => {
    expect(verifyLinkIntent(signLinkIntent("user1", "google"), "facebook")).toBeNull();
  });

  it("rejects an expired token", () => {
    const t0 = 1_000_000;
    const token = signLinkIntent("user1", "google", t0);
    expect(verifyLinkIntent(token, "google", t0 + LINK_TTL_MS - 1)).toBe("user1");
    expect(verifyLinkIntent(token, "google", t0 + LINK_TTL_MS + 1)).toBeNull();
  });

  it("rejects a tampered user id or signature", () => {
    const token = signLinkIntent("user1", "google");
    expect(verifyLinkIntent(token.replace("user1", "user2"), "google")).toBeNull();
    expect(verifyLinkIntent(token.slice(0, -2) + "00", "google")).toBeNull();
    expect(verifyLinkIntent("garbage", "google")).toBeNull();
    expect(verifyLinkIntent(undefined, "google")).toBeNull();
  });

  it("rejects everything when no secret is configured", () => {
    const token = signLinkIntent("user1", "google");
    const saved = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    expect(verifyLinkIntent(token, "google")).toBeNull();
    process.env.AUTH_SECRET = saved;
  });
});
