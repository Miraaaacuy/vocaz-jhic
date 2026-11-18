"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReportTarget } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { adminUserIds, notify } from "@/lib/notify";
import { ROLE_HOME } from "@/lib/constants";
import { findOrCreateConversation } from "@/lib/conversations";
import { getSetting } from "@/lib/settings";

async function me() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  return s.user;
}

// ───────────── Messages ─────────────
/** Start (or reopen) a conversation and jump to it */
export async function startConversation(form: FormData) {
  const user = await me();
  const target = String(form.get("userId"));
  if (target === user.id) return;
  const subject = String(form.get("subject") ?? "") || undefined;
  const conv = await findOrCreateConversation(user.id, target, subject);
  const first = String(form.get("message") ?? "").trim();
  if (first) await sendRaw(conv.id, user.id, user.name ?? "", first);
  redirect(`${ROLE_HOME[user.role]}/messages?c=${conv.id}`);
}

async function sendRaw(conversationId: string, senderId: string, senderName: string, body: string) {
  const now = new Date();
  await db.message.create({ data: { conversationId, senderId, body } });
  await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } });
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId: senderId } }, data: { lastReadAt: now } });
  const others = await db.conversationParticipant.findMany({ where: { conversationId, userId: { not: senderId } }, include: { user: { select: { role: true } } } });
  // avoid notification spam: only notify if the other party has no unread message notification for this conversation
  for (const o of others) {
    const link = `${ROLE_HOME[o.user.role]}/messages?c=${conversationId}`;
    const pending = await db.notification.findFirst({ where: { userId: o.userId, link, readAt: null } });
    if (!pending) await notify(o.userId, { type: "MESSAGE", title: `Pesan baru dari ${senderName}`, body: body.slice(0, 120), link });
  }
}

export async function sendMessage(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await me();
  const conversationId = String(form.get("conversationId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return fail("Pesan kosong");
  const part = await db.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId: user.id } } });
  if (!part) return fail("Percakapan tidak ditemukan");
  await sendRaw(conversationId, user.id, user.name ?? "", body.slice(0, 4000));
  return ok();
}

// ───────────── Notifications ─────────────
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await me();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
  return ok("Semua notifikasi ditandai dibaca");
}

export async function openNotification(form: FormData) {
  const user = await me();
  const n = await db.notification.findFirst({ where: { id: String(form.get("id")), userId: user.id } });
  if (!n) return;
  await db.notification.update({ where: { id: n.id }, data: { readAt: n.readAt ?? new Date() } });
  if (n.link) redirect(n.link);
  revalidatePath("/", "layout");
}

// ───────────── Video showcase ─────────────
/** Called by the feed player once a video has actually been watched for a moment (not on page load) */
export async function countVideoView(id: string): Promise<void> {
  if (typeof id !== "string" || !id || id.length > 40) return;
  const s = await auth();
  // an owner watching their own video does not count
  await db.showcaseVideo.updateMany({ where: { id, status: "PUBLISHED", ...(s?.user ? { student: { userId: { not: s.user.id } } } : {}) }, data: { views: { increment: 1 } } });
}

// ───────────── Settings ─────────────
export async function changePassword(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await me();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  if (next.length < 8) return fail("Kata sandi baru minimal 8 karakter.");
  if (next !== form.get("confirm")) return fail("Konfirmasi kata sandi tidak sama.");
  const u = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(current, u.passwordHash))) return fail("Kata sandi saat ini salah.");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return ok("Kata sandi berhasil diubah");
}

export async function savePreferences(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await me();
  const keys = ["notif_email", "notif_message", "notif_application", "notif_verification", "notif_opportunity", "privacy_public", "privacy_contact"];
  const prefs = Object.fromEntries(keys.map((k) => [k, form.get(k) === "on"]));
  await db.user.update({ where: { id: user.id }, data: { prefs } });
  if (user.role === "STUDENT") {
    await db.studentProfile.update({ where: { userId: user.id }, data: { isPublic: prefs.privacy_public } });
  }
  revalidatePath("/", "layout");
  return ok("Pengaturan disimpan");
}

// ───────────── Reports (content moderation) ─────────────
export async function reportContent(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await me();
  const targetType = String(form.get("targetType")) as ReportTarget;
  const reason = String(form.get("reason") ?? "");
  if (!reason) return fail("Pilih alasan laporan.");
  const r = await db.report.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId: String(form.get("targetId")),
      targetLabel: String(form.get("targetLabel") ?? ""),
      reason,
      details: String(form.get("details") ?? "") || null,
    },
  });
  const { autoHideThreshold } = await getSetting("moderation");
  const open = await db.report.count({ where: { targetType, targetId: r.targetId, status: "OPEN" } });
  if (open >= autoHideThreshold) {
    const id = r.targetId;
    if (targetType === "VIDEO") await db.showcaseVideo.updateMany({ where: { id }, data: { status: "HIDDEN" } });
    if (targetType === "PORTFOLIO") await db.portfolioItem.updateMany({ where: { id }, data: { status: "HIDDEN" } });
    if (targetType === "PROFILE") await db.studentProfile.updateMany({ where: { id }, data: { hidden: true } });
  }
  await notify(await adminUserIds(), { type: "SYSTEM", title: "Laporan konten baru", body: `${reason} — ${r.targetLabel}`, link: `/admin/moderation/${r.id}` });
  return ok("Terima kasih, laporan kamu akan ditinjau tim VocAZ.");
}
