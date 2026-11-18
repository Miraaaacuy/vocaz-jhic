import "server-only";
import { db } from "./db";

export type PlatformSettings = { name: string; maintenance: boolean; allowRegistration: boolean; maxVideoMB: number };
export type ModerationSettings = { autoHideThreshold: number; requireVideoReview: boolean };
export type VerificationSettings = { requiredDocs: string[] };

const DEFAULTS = {
  platform: { name: "VocAZ", maintenance: false, allowRegistration: true, maxVideoMB: 100 } as PlatformSettings,
  moderation: { autoHideThreshold: 3, requireVideoReview: false } as ModerationSettings,
  verification: { requiredDocs: ["NIB", "NPWP"] } as VerificationSettings,
};

export async function getSetting<K extends keyof typeof DEFAULTS>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const row = await db.systemSetting.findUnique({ where: { key } });
  return { ...DEFAULTS[key], ...((row?.value as object) ?? {}) };
}
