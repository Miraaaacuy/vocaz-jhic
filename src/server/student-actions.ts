"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ExperienceType, SkillLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { fail, ok, zodErrors, type ActionResult } from "@/lib/action";
import { CITIES } from "@/lib/constants";
import { companyUserIds, logActivity, notify } from "@/lib/notify";
import { maybeUpload, saveUpload, UploadError } from "@/lib/storage";
import { jobRequirement, scoreOne, talentInclude } from "@/lib/match-data";
import { parseCsv } from "@/lib/utils";
import { unstable_update } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

const opt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

function handle(e: unknown): ActionResult {
  if (e instanceof UploadError) return fail(e.message);
  throw e;
}

// ───────────── Personal info ─────────────
const personalSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  city: z.string().optional(),
  major: z.string().optional(),
  graduationYear: z.coerce.number().int().min(2010).max(2035).optional(),
});

export async function updatePersonal(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user, student } = await requireStudent();
  const parsed = personalSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return fail("Periksa kembali data.", zodErrors(parsed.error.issues));
  try {
    const avatarUrl = await maybeUpload(form, "avatar", "avatar");
    const d = parsed.data;
    const city = opt(form.get("city"));
    const schoolId = opt(form.get("schoolId"));
    await db.user.update({ where: { id: user.id }, data: { name: d.name, phone: opt(form.get("phone")), ...(avatarUrl ? { avatarUrl } : {}) } });
    await db.studentProfile.update({
      where: { id: student.id },
      data: {
        headline: opt(form.get("headline")),
        bio: opt(form.get("bio")),
        city,
        province: city ? (CITIES[city] ?? null) : null,
        willingRelocate: form.get("willingRelocate") === "on",
        major: opt(form.get("major")),
        graduationYear: d.graduationYear,
        birthDate: opt(form.get("birthDate")) ? new Date(String(form.get("birthDate"))) : null,
        gender: opt(form.get("gender")),
        nisn: opt(form.get("nisn")),
        seekingStatus: (opt(form.get("seekingStatus")) as "OPEN_TO_WORK" | "LOOKING_PKL" | "NOT_LOOKING") ?? "OPEN_TO_WORK",
        linkedinUrl: opt(form.get("linkedinUrl")),
        githubUrl: opt(form.get("githubUrl")),
        websiteUrl: opt(form.get("websiteUrl")),
        // changing school resets school verification
        ...(schoolId !== student.schoolId ? { schoolId, schoolVerified: false } : {}),
      },
    });
    if (schoolId && schoolId !== student.schoolId) {
      const school = await db.school.findUnique({ where: { id: schoolId } });
      if (school)
        await notify(school.userId, { type: "SYSTEM", title: "Permintaan verifikasi siswa", body: `${d.name} menambahkan sekolah Anda di profilnya.`, link: "/school/students?status=pending" });
    }
    await unstable_update({ user: { name: d.name, ...(avatarUrl ? { image: avatarUrl } : {}) } });
  } catch (e) {
    return handle(e);
  }
  revalidatePath("/student", "layout");
  return ok("Profil berhasil disimpan");
}

// ───────────── Education / Experience / Achievement ─────────────
export async function addEducation(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const institution = opt(form.get("institution"));
  const degree = opt(form.get("degree"));
  const startYear = Number(form.get("startYear"));
  if (!institution || !degree || !startYear) return fail("Institusi, jenjang, dan tahun mulai wajib diisi.");
  await db.education.create({
    data: {
      studentId: student.id,
      institution,
      degree,
      field: opt(form.get("field")),
      startYear,
      endYear: Number(form.get("endYear")) || null,
      description: opt(form.get("description")),
    },
  });
  revalidatePath("/student/profile");
  return ok("Pendidikan ditambahkan");
}

export async function addExperience(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const title = opt(form.get("title"));
  const company = opt(form.get("company"));
  const start = opt(form.get("startDate"));
  if (!title || !company || !start) return fail("Posisi, perusahaan, dan tanggal mulai wajib diisi.");
  const end = opt(form.get("endDate"));
  await db.experience.create({
    data: {
      studentId: student.id,
      title,
      company,
      type: (opt(form.get("type")) ?? "PKL") as ExperienceType,
      location: opt(form.get("location")),
      startDate: new Date(start + "-01"),
      endDate: end && form.get("current") !== "on" ? new Date(end + "-01") : null,
      description: opt(form.get("description")),
    },
  });
  revalidatePath("/student/profile");
  return ok("Pengalaman ditambahkan");
}

export async function addAchievement(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const title = opt(form.get("title"));
  if (!title) return fail("Judul prestasi wajib diisi.");
  const date = opt(form.get("date"));
  await db.achievement.create({
    data: { studentId: student.id, title, issuer: opt(form.get("issuer")), date: date ? new Date(date + "-01") : null, description: opt(form.get("description")) },
  });
  revalidatePath("/student/profile");
  return ok("Prestasi ditambahkan");
}

const DELETABLE = {
  education: (id: string, studentId: string) => db.education.deleteMany({ where: { id, studentId } }),
  experience: (id: string, studentId: string) => db.experience.deleteMany({ where: { id, studentId } }),
  achievement: (id: string, studentId: string) => db.achievement.deleteMany({ where: { id, studentId } }),
  portfolio: (id: string, studentId: string) => db.portfolioItem.deleteMany({ where: { id, studentId } }),
  video: (id: string, studentId: string) => db.showcaseVideo.deleteMany({ where: { id, studentId } }),
  certificate: (id: string, studentId: string) => db.certificate.deleteMany({ where: { id, studentId, status: { not: "VERIFIED" } } }),
} as const;

export async function deleteItem(form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const kind = String(form.get("kind")) as keyof typeof DELETABLE;
  const id = String(form.get("id"));
  if (!DELETABLE[kind]) return fail("Tipe tidak valid");
  await DELETABLE[kind](id, student.id);
  revalidatePath("/student", "layout");
  return ok("Berhasil dihapus");
}

// ───────────── Skills ─────────────
export async function addSkill(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const names = parseCsv(form.get("skills"));
  const level = (opt(form.get("level")) ?? "INTERMEDIATE") as SkillLevel;
  if (!names.length) return fail("Tambahkan minimal satu skill.");
  for (const name of names.slice(0, 15)) {
    const skill = await db.skill.upsert({ where: { name }, update: {}, create: { name } });
    await db.studentSkill.upsert({
      where: { studentId_skillId: { studentId: student.id, skillId: skill.id } },
      update: { level },
      create: { studentId: student.id, skillId: skill.id, level },
    });
  }
  revalidatePath("/student/profile/skills");
  return ok(`${names.length} skill disimpan`);
}

export async function updateSkillLevel(form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  await db.studentSkill.update({
    where: { studentId_skillId: { studentId: student.id, skillId: String(form.get("skillId")) } },
    data: { level: String(form.get("level")) as SkillLevel },
  });
  revalidatePath("/student/profile/skills");
  return ok();
}

export async function removeSkill(form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  await db.studentSkill.deleteMany({ where: { studentId: student.id, skillId: String(form.get("skillId")) } });
  revalidatePath("/student/profile/skills");
  return ok("Skill dihapus");
}

// ───────────── Portfolio ─────────────
export async function addPortfolio(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const title = opt(form.get("title"));
  if (!title) return fail("Judul portfolio wajib diisi.");
  try {
    const imageUrl = await maybeUpload(form, "image", "image");
    await db.portfolioItem.create({
      data: { studentId: student.id, title, description: opt(form.get("description")), url: opt(form.get("url")), imageUrl: imageUrl ?? null, tags: parseCsv(form.get("tags")) },
    });
  } catch (e) {
    return handle(e);
  }
  revalidatePath("/student/profile/portfolio");
  return ok("Portfolio ditambahkan");
}

// ───────────── Certificates ─────────────
export async function uploadCertificate(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user, student } = await requireStudent();
  const name = opt(form.get("name"));
  const number = opt(form.get("number"));
  const institutionId = opt(form.get("institutionId"));
  const issuedAt = opt(form.get("issuedAt"));
  if (!name || !number || !institutionId || !issuedAt) return fail("Nama, nomor, lembaga penerbit, dan tanggal terbit wajib diisi.");
  const inst = await db.institution.findUnique({ where: { id: institutionId } });
  if (!inst) return fail("Lembaga tidak ditemukan.");
  const f = form.get("file");
  if (!(f instanceof File) || f.size === 0) return fail("Unggah file sertifikat (PDF/JPG/PNG).");
  try {
    const fileUrl = await saveUpload(f, "document");
    const expires = opt(form.get("expiresAt"));
    const cert = await db.certificate.create({
      data: {
        studentId: student.id,
        institutionId,
        name,
        number,
        type: inst.type === "LSP_BNSP" ? "BNSP" : inst.type === "INDUSTRY" ? "INDUSTRY" : "TRAINING",
        issuer: inst.name,
        issuedAt: new Date(issuedAt),
        expiresAt: expires ? new Date(expires) : null,
        fileUrl,
        relatedSkills: parseCsv(form.get("relatedSkills")),
      },
    });
    await notify(inst.userId, {
      type: "VERIFICATION",
      title: "Permintaan verifikasi sertifikat",
      body: `${user.name} mengajukan verifikasi "${name}" (No. ${number}).`,
      link: `/institution/verification/${cert.id}`,
    });
    await logActivity({ userId: user.id, action: "CERT_SUBMITTED", message: `${user.name} mengajukan verifikasi sertifikat ke ${inst.name}`, entityType: "Certificate", entityId: cert.id });
  } catch (e) {
    return handle(e);
  }
  revalidatePath("/student/profile/certifications");
  return ok("Sertifikat dikirim untuk diverifikasi");
}

// ───────────── Showcase video ─────────────
export async function uploadVideo(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user, student } = await requireStudent();
  const title = opt(form.get("title"));
  if (!title) return fail("Judul video wajib diisi.");
  let videoUrl = opt(form.get("videoUrl"));
  let id: string;
  try {
    const [platform, moderation] = await Promise.all([getSetting("platform"), getSetting("moderation")]);
    const vf = form.get("video");
    if (vf instanceof File && vf.size > platform.maxVideoMB * 1024 * 1024) return fail(`Ukuran video maksimal ${platform.maxVideoMB} MB.`);
    const uploaded = await maybeUpload(form, "video", "video");
    if (uploaded) videoUrl = uploaded;
    if (!videoUrl) return fail("Unggah file video atau masukkan URL video (.mp4).");
    if (!uploaded && !/^https?:\/\/.+/.test(videoUrl)) return fail("URL video tidak valid.");
    const thumbnailUrl = await maybeUpload(form, "thumbnail", "image");
    const v = await db.showcaseVideo.create({
      data: { studentId: student.id, title, description: opt(form.get("description")), videoUrl, thumbnailUrl: thumbnailUrl ?? null, skills: parseCsv(form.get("skills")), status: moderation.requireVideoReview ? "HIDDEN" : "PUBLISHED" },
    });
    id = v.id;
    if (moderation.requireVideoReview) {
      await db.report.create({ data: { targetType: "VIDEO", targetId: v.id, targetLabel: title, reason: "Review video baru (wajib sebelum tayang)" } });
    }
    await logActivity({ userId: user.id, action: "VIDEO_UPLOADED", message: `Video showcase baru: ${title}`, entityType: "ShowcaseVideo", entityId: v.id });
  } catch (e) {
    return handle(e);
  }
  revalidatePath("/student/showcase");
  redirect(`/student/showcase/mine?uploaded=${id}`);
}

// ───────────── Jobs ─────────────
export async function toggleSaveJob(form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const jobId = String(form.get("jobId"));
  const existing = await db.savedJob.findUnique({ where: { studentId_jobId: { studentId: student.id, jobId } } });
  if (existing) await db.savedJob.delete({ where: { studentId_jobId: { studentId: student.id, jobId } } });
  else await db.savedJob.create({ data: { studentId: student.id, jobId } });
  revalidatePath("/student/career", "layout");
  return ok(existing ? "Dihapus dari tersimpan" : "Lowongan disimpan");
}

export async function applyJob(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user, student } = await requireStudent();
  const jobId = String(form.get("jobId"));
  const job = await db.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job || job.status !== "ACTIVE") return fail("Lowongan sudah tidak tersedia.");
  if (job.deadline && job.deadline < new Date()) return fail("Batas waktu lamaran sudah lewat.");
  const exists = await db.application.findUnique({ where: { jobId_studentId: { jobId, studentId: student.id } } });
  if (exists && exists.status !== "WITHDRAWN") return fail("Kamu sudah melamar lowongan ini.");

  const talent = await db.studentProfile.findUniqueOrThrow({ where: { id: student.id }, include: talentInclude });
  const match = await scoreOne(talent, jobRequirement(job));
  const now = new Date().toISOString();
  const data = {
    coverLetter: opt(form.get("coverLetter")),
    status: "APPLIED" as const,
    matchScore: match.score,
    history: [{ status: "APPLIED", at: now }],
  };
  if (exists) await db.application.update({ where: { id: exists.id }, data });
  else await db.application.create({ data: { jobId, studentId: student.id, ...data } });

  await notify(await companyUserIds(job.companyId), {
    type: "APPLICATION",
    title: `Pelamar baru: ${job.title}`,
    body: `${user.name} melamar dengan skor kecocokan ${match.score}%.`,
    link: `/company/recruitment/${job.id}`,
  });
  await logActivity({ userId: user.id, action: "APPLICATION_CREATED", message: `${user.name} melamar ${job.title} di ${job.company.name}`, entityType: "Job", entityId: job.id });
  revalidatePath("/student", "layout");
  return ok("Lamaran terkirim! Pantau statusnya di menu Lamaran Saya.");
}

export async function withdrawApplication(form: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();
  const app = await db.application.findFirst({ where: { id: String(form.get("id")), studentId: student.id } });
  if (!app) return fail("Lamaran tidak ditemukan.");
  if (["HIRED", "REJECTED"].includes(app.status)) return fail("Lamaran sudah final.");
  const history = Array.isArray(app.history) ? app.history : [];
  await db.application.update({ where: { id: app.id }, data: { status: "WITHDRAWN", history: [...history, { status: "WITHDRAWN", at: new Date().toISOString() }] } });
  revalidatePath("/student/career/applications");
  return ok("Lamaran dibatalkan");
}

// ───────────── Talent network ─────────────
export async function connect(form: FormData): Promise<ActionResult> {
  const { user } = await requireStudent();
  const targetId = String(form.get("userId"));
  if (targetId === user.id) return fail("Tidak bisa terhubung dengan diri sendiri.");
  const reverse = await db.connection.findUnique({ where: { requesterId_addresseeId: { requesterId: targetId, addresseeId: user.id } } });
  if (reverse) {
    await db.connection.update({ where: { id: reverse.id }, data: { status: "ACCEPTED" } });
    await notify(targetId, { type: "CONNECTION", title: "Koneksi diterima", body: `${user.name} menerima permintaan koneksi kamu.`, link: "/student/network" });
    revalidatePath("/student/network", "layout");
    return ok("Sekarang kalian terhubung");
  }
  await db.connection.upsert({
    where: { requesterId_addresseeId: { requesterId: user.id, addresseeId: targetId } },
    update: {},
    create: { requesterId: user.id, addresseeId: targetId },
  });
  await notify(targetId, { type: "CONNECTION", title: "Permintaan koneksi baru", body: `${user.name} ingin terhubung denganmu.`, link: "/student/network?tab=requests" });
  revalidatePath("/student/network", "layout");
  return ok("Permintaan koneksi terkirim");
}

export async function acceptConnection(form: FormData): Promise<ActionResult> {
  const { user } = await requireStudent();
  const c = await db.connection.findFirst({ where: { id: String(form.get("id")), addresseeId: user.id } });
  if (!c) return fail("Permintaan tidak ditemukan.");
  if (form.get("decline")) await db.connection.delete({ where: { id: c.id } });
  else {
    await db.connection.update({ where: { id: c.id }, data: { status: "ACCEPTED" } });
    await notify(c.requesterId, { type: "CONNECTION", title: "Koneksi diterima", body: `${user.name} menerima permintaan koneksi kamu.`, link: "/student/network" });
  }
  revalidatePath("/student/network", "layout");
  return ok(form.get("decline") ? "Permintaan ditolak" : "Koneksi diterima");
}
