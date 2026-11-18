"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ApplicationStatus, CertPreference, JobType, WorkMode } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { fail, ok, zodErrors, type ActionResult } from "@/lib/action";
import { APP_STATUS_LABEL, CITIES } from "@/lib/constants";
import { adminUserIds, logActivity, notify } from "@/lib/notify";
import { maybeUpload, saveUpload, UploadError } from "@/lib/storage";
import { parseCsv } from "@/lib/utils";
import { getSetting } from "@/lib/settings";

const opt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};
const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function ownJob(jobId: string) {
  const { company, user } = await requireCompany();
  const job = await db.job.findFirst({ where: { id: jobId, companyId: company.id } });
  return { job, company, user };
}

// ───────────── Jobs ─────────────
const jobSchema = z.object({
  title: z.string().min(3, "Judul posisi minimal 3 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  type: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "PKL", "CONTRACT"]),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  certification: z.enum(["ANY", "BNSP", "INDUSTRY"]),
  city: z.string().min(2, "Pilih kota"),
});

export async function saveJob(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company, user } = await requireCompany();
  const parsed = jobSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Periksa kembali data lowongan.", zodErrors(parsed.error.issues));
  const d = parsed.data;
  const required = parseCsv(form.get("requiredSkills"));
  const intent = String(form.get("intent") ?? "draft"); // draft | publish
  if (intent === "publish" && required.length === 0) return fail("Tambahkan minimal satu skill wajib sebelum mempublikasikan.");
  const id = opt(form.get("id"));
  const deadline = opt(form.get("deadline"));

  const data = {
    title: d.title,
    department: opt(form.get("department")),
    type: d.type as JobType,
    workMode: d.workMode as WorkMode,
    city: d.city,
    province: CITIES[d.city] ?? null,
    salaryMin: num(form.get("salaryMin")),
    salaryMax: num(form.get("salaryMax")),
    showSalary: form.get("showSalary") === "on",
    description: d.description,
    responsibilities: opt(form.get("responsibilities")),
    requirements: opt(form.get("requirements")),
    benefits: opt(form.get("benefits")),
    requiredSkills: required,
    niceSkills: parseCsv(form.get("niceSkills")),
    majors: parseCsv(form.get("majors")),
    minExperienceMonths: Number(form.get("minExperienceMonths")) || 0,
    certification: d.certification as CertPreference,
    quota: Number(form.get("quota")) || 1,
    deadline: deadline ? new Date(deadline) : null,
  };

  let jobId = id;
  if (id) {
    const { job } = await ownJob(id);
    if (!job) return fail("Lowongan tidak ditemukan.");
    await db.job.update({
      where: { id },
      data: { ...data, ...(intent === "publish" && job.status !== "ACTIVE" ? { status: "ACTIVE", publishedAt: new Date(), closedAt: null } : {}) },
    });
  } else {
    const job = await db.job.create({
      data: { ...data, companyId: company.id, createdById: user.id, status: intent === "publish" ? "ACTIVE" : "DRAFT", publishedAt: intent === "publish" ? new Date() : null },
    });
    jobId = job.id;
  }
  if (intent === "publish") {
    await logActivity({ userId: user.id, action: "JOB_PUBLISHED", message: `${company.name} mempublikasikan lowongan ${d.title}`, entityType: "Job", entityId: jobId! });
    await notifyMatchingSchools(company.name, d.title, jobId!, data.majors);
  }
  revalidatePath("/company", "layout");
  redirect(intent === "publish" ? `/company/recruitment/${jobId}?published=1` : "/company/recruitment/drafts");
}

/** Let BKK of schools with matching programs know about new openings */
async function notifyMatchingSchools(companyName: string, title: string, jobId: string, majors: string[]) {
  if (!majors.length) return;
  const schools = await db.school.findMany({ select: { userId: true, programs: true } });
  const target = schools.filter((s) => Array.isArray(s.programs) && (s.programs as string[]).some((p) => majors.includes(p))).map((s) => s.userId);
  await notify(target, { type: "OPPORTUNITY", title: "Lowongan baru relevan untuk siswa", body: `${companyName} membuka ${title}.`, link: `/school/career?job=${jobId}` });
}

export async function setJobStatus(form: FormData): Promise<ActionResult> {
  const id = String(form.get("id"));
  const status = String(form.get("status")) as "ACTIVE" | "CLOSED";
  const { job, company, user } = await ownJob(id);
  if (!job) return fail("Lowongan tidak ditemukan.");
  await db.job.update({
    where: { id },
    data: status === "ACTIVE" ? { status, publishedAt: job.publishedAt ?? new Date(), closedAt: null } : { status, closedAt: new Date() },
  });
  if (status === "ACTIVE" && !job.publishedAt) await logActivity({ userId: user.id, action: "JOB_PUBLISHED", message: `${company.name} mempublikasikan lowongan ${job.title}`, entityType: "Job", entityId: id });
  revalidatePath("/company", "layout");
  return ok(status === "ACTIVE" ? "Lowongan dipublikasikan" : "Lowongan ditutup");
}

export async function deleteJob(form: FormData): Promise<ActionResult> {
  const id = String(form.get("id"));
  const { job } = await ownJob(id);
  if (!job) return fail("Lowongan tidak ditemukan.");
  if (job.status !== "DRAFT") return fail("Hanya draft yang dapat dihapus. Tutup lowongan aktif.");
  await db.job.delete({ where: { id } });
  revalidatePath("/company", "layout");
  return ok("Draft dihapus");
}

export async function duplicateJob(form: FormData) {
  const id = String(form.get("id"));
  const { job, user } = await ownJob(id);
  if (!job) return;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _i, createdAt, updatedAt, publishedAt, closedAt, views, status, ...rest } = job;
  const copy = await db.job.create({
    data: {
      ...rest,
      requiredSkills: rest.requiredSkills ?? [],
      niceSkills: rest.niceSkills ?? [],
      majors: rest.majors ?? [],
      title: `${job.title} (Salinan)`,
      status: "DRAFT",
      createdById: user.id,
    },
  });
  redirect(`/company/recruitment/${copy.id}/edit`);
}

// ───────────── Applicants ─────────────
export async function updateApplication(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company, user } = await requireCompany();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as ApplicationStatus;
  const app = await db.application.findFirst({
    where: { id, job: { companyId: company.id } },
    include: { job: true, student: { include: { user: true, school: true } } },
  });
  if (!app) return fail("Lamaran tidak ditemukan.");
  const history = Array.isArray(app.history) ? app.history : [];
  const note = opt(form.get("note"));
  await db.application.update({
    where: { id },
    data: {
      status,
      recruiterNote: note ?? app.recruiterNote,
      history: status !== app.status ? [...history, { status, at: new Date().toISOString() }] : history,
      hiredAt: status === "HIRED" ? new Date() : app.hiredAt,
    },
  });
  if (status !== app.status) {
    await notify(app.student.userId, {
      type: "APPLICATION",
      title: status === "HIRED" ? `🎉 Selamat! Kamu diterima di ${company.name}` : `Status lamaran: ${APP_STATUS_LABEL[status]}`,
      body: `${app.job.title} — ${company.name}${note ? `. Catatan: ${note}` : ""}`,
      link: "/student/career/applications",
    });
    if (status === "HIRED") {
      if (app.student.school) {
        await notify(app.student.school.userId, {
          type: "APPLICATION",
          title: "Siswa diterima kerja",
          body: `${app.student.user.name} diterima sebagai ${app.job.title} di ${company.name}.`,
          link: "/school/career/placement",
        });
      }
      await logActivity({ userId: user.id, action: "APPLICATION_HIRED", message: `${app.student.user.name} diterima sebagai ${app.job.title} di ${company.name}`, entityType: "Application", entityId: id });
    }
  }
  revalidatePath(`/company/recruitment/${app.jobId}`);
  return ok(`Status diperbarui: ${APP_STATUS_LABEL[status]}`);
}

// ───────────── Talent ─────────────
export async function toggleSaveTalent(form: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  const studentId = String(form.get("studentId"));
  const key = { companyId_studentId: { companyId: company.id, studentId } };
  const exists = await db.savedTalent.findUnique({ where: key });
  if (exists) await db.savedTalent.delete({ where: key });
  else await db.savedTalent.create({ data: { companyId: company.id, studentId } });
  revalidatePath("/company", "layout");
  return ok(exists ? "Dihapus dari talent tersimpan" : "Talent disimpan ke Talent Pool");
}

// ───────────── Company profile ─────────────
export async function updateCompanyProfile(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  const name = opt(form.get("name"));
  if (!name) return fail("Nama perusahaan wajib diisi.");
  try {
    const logoUrl = await maybeUpload(form, "logo", "logo");
    const coverUrl = await maybeUpload(form, "cover", "image");
    const city = opt(form.get("city"));
    await db.company.update({
      where: { id: company.id },
      data: {
        name,
        industry: opt(form.get("industry")),
        size: opt(form.get("size")),
        city,
        province: city ? (CITIES[city] ?? null) : null,
        address: opt(form.get("address")),
        website: opt(form.get("website")),
        email: opt(form.get("email")),
        phone: opt(form.get("phone")),
        description: opt(form.get("description")),
        foundedYear: Number(form.get("foundedYear")) || null,
        ...(logoUrl ? { logoUrl } : {}),
        ...(coverUrl ? { coverUrl } : {}),
      },
    });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    throw e;
  }
  revalidatePath("/company", "layout");
  return ok("Profil perusahaan disimpan");
}

// ───────────── Verification ─────────────
export async function uploadCompanyDocument(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  const f = form.get("file");
  const type = String(form.get("type") ?? "OTHER");
  if (!(f instanceof File) || f.size === 0) return fail("Pilih file dokumen.");
  try {
    const fileUrl = await saveUpload(f, "document");
    await db.companyDocument.create({ data: { companyId: company.id, type, fileName: f.name, fileUrl } });
    await db.company.update({ where: { id: company.id }, data: { nib: opt(form.get("nib")) ?? company.nib, npwp: opt(form.get("npwp")) ?? company.npwp } });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    throw e;
  }
  revalidatePath("/company/verification");
  return ok("Dokumen diunggah");
}

export async function deleteCompanyDocument(form: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  if (company.verificationStatus === "PENDING") return fail("Dokumen tidak dapat dihapus saat sedang ditinjau.");
  await db.companyDocument.deleteMany({ where: { id: String(form.get("id")), companyId: company.id } });
  revalidatePath("/company/verification");
  return ok("Dokumen dihapus");
}

export async function submitVerification(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company, user } = await requireCompany();
  if (company.verificationStatus === "VERIFIED") return fail("Perusahaan sudah terverifikasi.");
  if (company.verificationStatus === "PENDING") return fail("Pengajuan sedang ditinjau.");
  const docs = await db.companyDocument.findMany({ where: { companyId: company.id } });
  const types = new Set(docs.map((d) => d.type));
  const required = (await getSetting("verification")).requiredDocs;
  const missing = required.filter((t) => !types.has(t));
  if (missing.length) return fail(`Dokumen wajib belum lengkap: ${missing.join(", ")}.`);
  await db.$transaction([
    db.company.update({ where: { id: company.id }, data: { verificationStatus: "PENDING" } }),
    db.companyVerification.create({ data: { companyId: company.id, status: "PENDING", message: opt(form.get("message")) } }),
  ]);
  await notify(await adminUserIds(), {
    type: "VERIFICATION",
    title: "Pengajuan verifikasi perusahaan",
    body: `${company.name} mengajukan verifikasi dengan ${docs.length} dokumen.`,
    link: `/admin/company-verification/${company.id}`,
  });
  await logActivity({ userId: user.id, action: "COMPANY_VERIFY_REQUEST", message: `${company.name} mengajukan verifikasi`, entityType: "Company", entityId: company.id });
  revalidatePath("/company", "layout");
  return ok("Pengajuan verifikasi terkirim. Tim VocAZ akan meninjau dalam 1–3 hari kerja.");
}

// ───────────── Team ─────────────
export async function addTeamMember(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company, member } = await requireCompany();
  if (member.role === "RECRUITER") return fail("Hanya Owner/Admin yang dapat menambah anggota tim.");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = opt(form.get("name"));
  const password = String(form.get("password") ?? "");
  if (!name || !z.string().email().safeParse(email).success) return fail("Nama dan email valid wajib diisi.");
  if (password.length < 8) return fail("Kata sandi awal minimal 8 karakter.");
  if (await db.user.findUnique({ where: { email } })) return fail("Email sudah terdaftar di VocAZ.");
  const u = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 10), role: "COMPANY" } });
  await db.companyMember.create({
    data: { companyId: company.id, userId: u.id, role: (String(form.get("role")) as "ADMIN" | "RECRUITER") || "RECRUITER", position: opt(form.get("position")) },
  });
  await notify(u.id, { type: "SYSTEM", title: `Selamat datang di tim ${company.name}`, body: "Segera ubah kata sandi awal kamu di menu Pengaturan.", link: "/company/settings" });
  revalidatePath("/company/team");
  return ok(`${name} ditambahkan ke tim`);
}

export async function updateTeamMember(form: FormData): Promise<ActionResult> {
  const { company, member } = await requireCompany();
  if (member.role !== "OWNER") return fail("Hanya Owner yang dapat mengubah peran anggota.");
  const id = String(form.get("id"));
  const target = await db.companyMember.findFirst({ where: { id, companyId: company.id } });
  if (!target || target.role === "OWNER") return fail("Anggota tidak dapat diubah.");
  if (form.get("remove")) {
    await db.user.delete({ where: { id: target.userId } });
    revalidatePath("/company/team");
    return ok("Anggota dihapus dari tim");
  }
  await db.companyMember.update({ where: { id }, data: { role: String(form.get("role")) as "ADMIN" | "RECRUITER" } });
  revalidatePath("/company/team");
  return ok("Peran diperbarui");
}

// ───────────── Talent preferences ─────────────
export async function saveTalentPreferences(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { company } = await requireCompany();
  const data = {
    skills: parseCsv(form.get("skills")),
    majors: parseCsv(form.get("majors")),
    locations: parseCsv(form.get("locations")),
    minExperienceMonths: Number(form.get("minExperienceMonths")) || 0,
    certification: (String(form.get("certification")) || "ANY") as CertPreference,
    jobTypes: form.getAll("jobTypes").map(String),
    notes: opt(form.get("notes")),
  };
  await db.talentPreference.upsert({ where: { companyId: company.id }, update: data, create: { companyId: company.id, ...data } });
  revalidatePath("/company", "layout");
  return ok("Talent preferences disimpan — Smart Talent Match diperbarui");
}
