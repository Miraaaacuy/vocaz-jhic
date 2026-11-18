"use server";

import { revalidatePath } from "next/cache";
import type { PartnerType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { fail, ok, type ActionResult } from "@/lib/action";
import { logActivity, notify } from "@/lib/notify";
import { maybeUpload, UploadError } from "@/lib/storage";
import { parseCsv } from "@/lib/utils";

export async function verifyStudent(form: FormData): Promise<ActionResult> {
  const { school, user } = await requireSchool();
  const id = String(form.get("id"));
  const approve = form.get("decision") !== "reject";
  const s = await db.studentProfile.findFirst({ where: { id, schoolId: school.id }, include: { user: true } });
  if (!s) return fail("Siswa tidak ditemukan.");
  if (approve) {
    await db.studentProfile.update({ where: { id }, data: { schoolVerified: true } });
    await notify(s.userId, { type: "VERIFICATION", title: "🎓 Status siswa terverifikasi", body: `${school.name} memverifikasi kamu sebagai siswa. Badge School Verified kini tampil di profilmu.`, link: "/student/profile" });
  } else {
    await db.studentProfile.update({ where: { id }, data: { schoolVerified: false, schoolId: null } });
    await notify(s.userId, { type: "VERIFICATION", title: "Verifikasi sekolah ditolak", body: `${school.name} tidak dapat memverifikasi data kamu. Periksa kembali sekolah yang kamu pilih.`, link: "/student/profile" });
  }
  await logActivity({ userId: user.id, action: approve ? "STUDENT_VERIFIED" : "STUDENT_REJECTED", message: `${school.name} ${approve ? "memverifikasi" : "menolak"} siswa ${s.user.name}` });
  revalidatePath("/school", "layout");
  return ok(approve ? `${s.user.name} terverifikasi` : "Permintaan ditolak");
}

export async function verifyAllPending(): Promise<ActionResult> {
  const { school } = await requireSchool();
  const pending = await db.studentProfile.findMany({ where: { schoolId: school.id, schoolVerified: false }, select: { id: true, userId: true } });
  await db.studentProfile.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { schoolVerified: true } });
  await notify(pending.map((p) => p.userId), { type: "VERIFICATION", title: "🎓 Status siswa terverifikasi", body: `${school.name} memverifikasi kamu sebagai siswa.`, link: "/student/profile" });
  revalidatePath("/school", "layout");
  return ok(`${pending.length} siswa diverifikasi`);
}

export async function updateSchoolProfile(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { school } = await requireSchool();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return fail("Nama sekolah wajib diisi.");
  const s = (k: string) => String(form.get(k) ?? "").trim() || null;
  try {
    const logoUrl = await maybeUpload(form, "logo", "logo");
    await db.school.update({
      where: { id: school.id },
      data: {
        name,
        npsn: s("npsn"),
        city: s("city"),
        address: s("address"),
        website: s("website"),
        description: s("description"),
        programs: parseCsv(form.get("programs")),
        bkkName: s("bkkName"),
        bkkHead: s("bkkHead"),
        bkkEmail: s("bkkEmail"),
        bkkPhone: s("bkkPhone"),
        ...(logoUrl ? { logoUrl } : {}),
      },
    });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    throw e;
  }
  revalidatePath("/school", "layout");
  return ok("Profil sekolah disimpan");
}

export async function addPartner(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { school } = await requireSchool();
  const companyId = String(form.get("companyId") ?? "") || null;
  let name = String(form.get("name") ?? "").trim();
  if (companyId) {
    const c = await db.company.findUnique({ where: { id: companyId } });
    if (!c) return fail("Perusahaan tidak ditemukan.");
    name = c.name;
  }
  if (!name) return fail("Pilih perusahaan VocAZ atau isi nama mitra.");
  const since = String(form.get("since") ?? "");
  await db.industryPartner.create({
    data: { schoolId: school.id, companyId, name, type: (String(form.get("type")) || "MOU") as PartnerType, since: since ? new Date(since) : null, notes: String(form.get("notes") ?? "") || null },
  });
  revalidatePath("/school/partners");
  return ok("Mitra industri ditambahkan");
}

export async function removePartner(form: FormData): Promise<ActionResult> {
  const { school } = await requireSchool();
  await db.industryPartner.deleteMany({ where: { id: String(form.get("id")), schoolId: school.id } });
  revalidatePath("/school/partners");
  return ok("Mitra dihapus");
}
