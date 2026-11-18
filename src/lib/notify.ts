import "server-only";
import { db } from "./db";

export type NotifType = "MESSAGE" | "APPLICATION" | "VERIFICATION" | "OPPORTUNITY" | "SYSTEM" | "CONNECTION";

export async function notify(
  userIds: string | string[],
  n: { type: NotifType; title: string; body?: string; link?: string },
) {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (!ids.length) return;
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, ...n })) });
}

export async function logActivity(a: {
  userId?: string | null;
  action: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  await db.activityLog.create({ data: a });
}

export async function companyUserIds(companyId: string) {
  const m = await db.companyMember.findMany({ where: { companyId }, select: { userId: true } });
  return m.map((x) => x.userId);
}

export async function adminUserIds() {
  const a = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  return a.map((x) => x.id);
}
