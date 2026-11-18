"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireInstitution } from "@/lib/session";
import { fail, ok, type ActionResult } from "@/lib/action";
import { logActivity, notify } from "@/lib/notify";
import { maybeUpload, UploadError } from "@/lib/storage";
import { parseCsv, strArr } from "@/lib/utils";

export async function reviewCertificate(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user, institution } = await requireInstitution();
  const id = String(form.get("id"));
  const decision = String(form.get("decision"));
  const note = String(form.get("note") ?? "").trim() || null;
  if (decision !== "VERIFIED" && decision !== "REJECTED") return fail("Keputusan tidak valid.");
  if (decision === "REJECTED" && !note) return fail("Berikan alasan penolakan agar siswa dapat memperbaiki.");
  const cert = await db.certificate.findFirst({ where: { id, institutionId: institution.id }, include: { student: { include: { user: true } } } });
  if (!cert) return fail("Sertifikat tidak ditemukan.");

  await db.certificate.update({ where: { id }, data: { status: decision, reviewNote: note, reviewedAt: new Date(), reviewedById: user.id } });

  // mark related skills as competency-verified
  const related = strArr(cert.relatedSkills);
  if (decision === "VERIFIED" && related.length) {
    const skills = await db.skill.findMany({ where: { name: { in: related } } });
    await db.studentSkill.updateMany({ where: { studentId: cert.studentId, skillId: { in: skills.map((s) => s.id) } }, data: { verified: true } });
  }

  const badge = cert.type === "BNSP" ? "LSP – BNSP Verified" : cert.type === "INDUSTRY" ? "Industry Certified" : "sertifikat pelatihan terverifikasi";
  await notify(cert.student.userId, {
    type: "VERIFICATION",
    title: decision === "VERIFIED" ? `✅ Sertifikat terverifikasi — badge ${badge}` : "Sertifikat ditolak",
    body: decision === "VERIFIED" ? `"${cert.name}" telah diverifikasi oleh ${institution.name}.` : `"${cert.name}" ditolak: ${note}`,
    link: "/student/profile/certifications",
  });
  await logActivity({
    userId: user.id,
    action: decision === "VERIFIED" ? "CERT_VERIFIED" : "CERT_REJECTED",
    message: `${institution.name} ${decision === "VERIFIED" ? "memverifikasi" : "menolak"} sertifikat ${cert.student.user.name}`,
    entityType: "Certificate",
    entityId: id,
  });
  revalidatePath("/institution", "layout");
  return ok(decision === "VERIFIED" ? "Sertifikat diverifikasi — badge tampil di profil siswa" : "Sertifikat ditolak");
}

export async function updateInstitutionProfile(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { institution } = await requireInstitution();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return fail("Nama lembaga wajib diisi.");
  try {
    const logoUrl = await maybeUpload(form, "logo", "logo");
    const s = (k: string) => String(form.get(k) ?? "").trim() || null;
    await db.institution.update({
      where: { id: institution.id },
      data: {
        name,
        accreditationNumber: s("accreditationNumber"),
        city: s("city"),
        address: s("address"),
        website: s("website"),
        description: s("description"),
        scopes: parseCsv(form.get("scopes")),
        ...(logoUrl ? { logoUrl } : {}),
      },
    });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    throw e;
  }
  revalidatePath("/institution", "layout");
  return ok("Profil lembaga disimpan");
}
