"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { fail, ok, type ActionResult } from "@/lib/action";
import { companyUserIds, logActivity, notify } from "@/lib/notify";
import { maybeUpload, UploadError } from "@/lib/storage";
import { DEFAULT_WEIGHTS } from "@/lib/match";
import { unstable_update } from "@/lib/auth";

export async function setUserStatus(form: FormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as "ACTIVE" | "SUSPENDED";
  if (id === user.id) return fail("Tidak dapat mengubah status akun sendiri.");
  const target = await db.user.update({ where: { id }, data: { status } });
  await logActivity({ userId: user.id, action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED", message: `Admin ${status === "SUSPENDED" ? "menangguhkan" : "mengaktifkan"} akun ${target.name}` });
  revalidatePath("/admin", "layout");
  return ok(status === "SUSPENDED" ? "Akun ditangguhkan" : "Akun diaktifkan kembali");
}

export async function reviewCompany(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const companyId = String(form.get("companyId"));
  const decision = String(form.get("decision")) as "VERIFIED" | "REJECTED";
  const note = String(form.get("note") ?? "").trim() || null;
  if (decision !== "VERIFIED" && decision !== "REJECTED") return fail("Keputusan tidak valid.");
  if (decision === "REJECTED" && !note) return fail("Berikan catatan alasan penolakan.");
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return fail("Perusahaan tidak ditemukan.");
  const pending = await db.companyVerification.findFirst({ where: { companyId, status: "PENDING" }, orderBy: { submittedAt: "desc" } });
  await db.$transaction([
    db.company.update({ where: { id: companyId }, data: { verificationStatus: decision, verifiedAt: decision === "VERIFIED" ? new Date() : null } }),
    pending
      ? db.companyVerification.update({ where: { id: pending.id }, data: { status: decision, reviewNote: note, reviewerId: user.id, reviewedAt: new Date() } })
      : db.companyVerification.create({ data: { companyId, status: decision, reviewNote: note, reviewerId: user.id, reviewedAt: new Date() } }),
  ]);
  await notify(await companyUserIds(companyId), {
    type: "VERIFICATION",
    title: decision === "VERIFIED" ? "🎉 Perusahaan terverifikasi!" : "Pengajuan verifikasi ditolak",
    body: decision === "VERIFIED" ? `${company.name} kini berstatus Verified Company.` : `Catatan reviewer: ${note}`,
    link: "/company/verification",
  });
  await logActivity({ userId: user.id, action: decision === "VERIFIED" ? "COMPANY_VERIFIED" : "COMPANY_REJECTED", message: `${company.name} ${decision === "VERIFIED" ? "diverifikasi" : "ditolak"} oleh admin`, entityType: "Company", entityId: companyId });
  revalidatePath("/admin", "layout");
  return ok(decision === "VERIFIED" ? "Perusahaan diverifikasi" : "Pengajuan ditolak");
}

/** Hide / restore a piece of content */
async function setContentVisibility(type: string, id: string, hidden: boolean) {
  switch (type) {
    case "VIDEO":
      return db.showcaseVideo.update({ where: { id }, data: { status: hidden ? "HIDDEN" : "PUBLISHED" } });
    case "PORTFOLIO":
      return db.portfolioItem.update({ where: { id }, data: { status: hidden ? "HIDDEN" : "PUBLISHED" } });
    case "PROFILE":
      return db.studentProfile.update({ where: { id }, data: { hidden } });
    case "COMPANY":
      return db.company.update({ where: { id }, data: { hidden } });
    case "JOB":
      return db.job.update({ where: { id }, data: hidden ? { status: "CLOSED", closedAt: new Date() } : { status: "ACTIVE", closedAt: null } });
  }
}

async function contentOwner(type: string, id: string): Promise<string[]> {
  switch (type) {
    case "VIDEO":
      return [(await db.showcaseVideo.findUnique({ where: { id }, include: { student: true } }))?.student.userId].filter(Boolean) as string[];
    case "PORTFOLIO":
      return [(await db.portfolioItem.findUnique({ where: { id }, include: { student: true } }))?.student.userId].filter(Boolean) as string[];
    case "PROFILE":
      return [(await db.studentProfile.findUnique({ where: { id } }))?.userId].filter(Boolean) as string[];
    case "COMPANY":
      return companyUserIds(id);
    case "JOB": {
      const j = await db.job.findUnique({ where: { id } });
      return j ? companyUserIds(j.companyId) : [];
    }
  }
  return [];
}

export async function resolveReport(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const id = String(form.get("id"));
  const action = String(form.get("action")); // hide | dismiss | suspend | restore
  const note = String(form.get("note") ?? "").trim();
  if (!["hide", "dismiss", "suspend", "restore"].includes(action)) return fail("Tindakan tidak valid.");
  const r = await db.report.findUnique({ where: { id } });
  if (!r) return fail("Laporan tidak ditemukan.");
  const owners = await contentOwner(r.targetType, r.targetId);
  let label = "";
  try {
    if (action === "hide") {
      await setContentVisibility(r.targetType, r.targetId, true);
      label = "Konten disembunyikan";
      await notify(owners, { type: "SYSTEM", title: "Konten kamu disembunyikan moderator", body: `"${r.targetLabel}" melanggar pedoman komunitas (${r.reason}).${note ? ` ${note}` : ""}` });
    } else if (action === "restore") {
      await setContentVisibility(r.targetType, r.targetId, false);
      label = "Konten dipulihkan";
    } else if (action === "suspend") {
      await setContentVisibility(r.targetType, r.targetId, true);
      await db.user.updateMany({ where: { id: { in: owners } }, data: { status: "SUSPENDED" } });
      label = "Konten disembunyikan & akun ditangguhkan";
    } else {
      label = "Tidak ditemukan pelanggaran";
      // videos waiting in the pre-publish review queue go live once approved
      if (r.reason.startsWith("Review video baru")) {
        await setContentVisibility(r.targetType, r.targetId, false);
        label = "Video disetujui & ditayangkan";
      }
    }
  } catch {
    return fail("Konten sudah tidak tersedia.");
  }
  await db.report.update({
    where: { id },
    data: { status: action === "dismiss" ? "DISMISSED" : "RESOLVED", action: label + (note ? ` — ${note}` : ""), resolvedById: user.id, resolvedAt: new Date() },
  });
  if (r.reporterId) await notify(r.reporterId, { type: "SYSTEM", title: "Laporan kamu telah ditinjau", body: `${r.targetLabel}: ${label}.` });
  await logActivity({ userId: user.id, action: "REPORT_RESOLVED", message: `Laporan "${r.targetLabel}" — ${label}` });
  revalidatePath("/admin", "layout");
  return ok(label);
}

export async function saveMatchWeights(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const w = Object.fromEntries(Object.keys(DEFAULT_WEIGHTS).map((k) => [k, Math.max(0, Number(form.get(k)) || 0)])) as Record<string, number>;
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  if (total !== 100) return fail(`Total bobot harus 100 (saat ini ${total}).`);
  await db.systemSetting.upsert({ where: { key: "match.weights" }, update: { value: w }, create: { key: "match.weights", value: w } });
  await logActivity({ userId: user.id, action: "SETTINGS_UPDATED", message: "Admin memperbarui bobot Smart Talent Match" });
  revalidatePath("/", "layout");
  return ok("Bobot Smart Match disimpan dan langsung berlaku");
}

export async function saveSettings(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const group = String(form.get("group"));
  const bool = (k: string) => form.get(k) === "on";
  const value =
    group === "platform"
      ? { name: String(form.get("name") ?? "VocAZ"), maintenance: bool("maintenance"), allowRegistration: bool("allowRegistration"), maxVideoMB: Number(form.get("maxVideoMB")) || 100 }
      : group === "moderation"
        ? { autoHideThreshold: Number(form.get("autoHideThreshold")) || 3, requireVideoReview: bool("requireVideoReview") }
        : group === "verification"
          ? { requiredDocs: form.getAll("requiredDocs").map(String) }
          : null;
  if (!value) return fail("Grup pengaturan tidak valid.");
  await db.systemSetting.upsert({ where: { key: group }, update: { value }, create: { key: group, value } });
  await logActivity({ userId: user.id, action: "SETTINGS_UPDATED", message: `Admin memperbarui pengaturan ${group}` });
  revalidatePath("/admin/settings");
  return ok("Pengaturan disimpan");
}

export async function updateAdminProfile(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 3) return fail("Nama minimal 3 karakter.");
  try {
    const avatarUrl = await maybeUpload(form, "avatar", "avatar");
    await db.user.update({ where: { id: user.id }, data: { name, phone: String(form.get("phone") ?? "") || null, ...(avatarUrl ? { avatarUrl } : {}) } });
    await unstable_update({ user: { name, ...(avatarUrl ? { image: avatarUrl } : {}) } });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    throw e;
  }
  revalidatePath("/admin", "layout");
  return ok("Profil disimpan");
}
