"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, OAUTH_PROVIDERS, signIn, type OAuthProvider } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, ok, zodErrors, type ActionResult } from "@/lib/action";
import { CITIES, ROLE_HOME } from "@/lib/constants";
import { LINK_COOKIE, LINK_TTL_MS, signLinkIntent } from "@/lib/oauth-link";
import { homeFor } from "@/lib/redirects";
import { adminUserIds, logActivity, notify } from "@/lib/notify";
import { saveUpload, UploadError } from "@/lib/storage";
import { parseCsv, slugify, uniqueSuffix } from "@/lib/utils";
import { getSetting } from "@/lib/settings";

async function registrationClosed() {
  return !(await getSetting("platform")).allowRegistration;
}

async function doSignIn(email: string, password: string) {
  await signIn("credentials", { email, password, redirect: false });
}

function safeNext(next: FormDataEntryValue | null) {
  const n = String(next ?? "");
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

export async function loginAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  try {
    await doSignIn(email, password);
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      return fail(code === "suspended" ? "Akun kamu sedang ditangguhkan. Hubungi admin VocAZ." : "Email atau kata sandi salah.");
    }
    throw e;
  }
  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  redirect(homeFor(user!.role, safeNext(form.get("next"))));
}

const OAUTH_LABEL: Record<OAuthProvider, string> = { google: "Google", facebook: "Facebook" };

/** Validates the requested provider; returns an error result when it is unknown or not configured */
function providerOf(form: FormData): { provider: OAuthProvider } | { error: ActionResult } {
  const provider = String(form.get("provider")) as OAuthProvider;
  if (!(provider in OAUTH_PROVIDERS)) return { error: fail("Metode login tidak dikenal.") };
  if (!OAUTH_PROVIDERS[provider]) {
    const key = provider.toUpperCase();
    return { error: fail(`Login ${OAUTH_LABEL[provider]} belum diaktifkan. Admin perlu mengisi AUTH_${key}_ID dan AUTH_${key}_SECRET di file .env.`) };
  }
  return { provider };
}

// Login with a linked Google / Facebook account — Auth.js redirects to the provider, then back to /login/lanjut which routes by role
export async function oauthLogin(_: ActionResult, form: FormData): Promise<ActionResult> {
  const p = providerOf(form);
  if ("error" in p) return p.error;
  const { provider } = p;
  (await cookies()).delete(LINK_COOKIE); // a plain login must never be mistaken for a pending "link" request
  const next = safeNext(form.get("next"));
  await signIn(provider, { redirectTo: `/login/lanjut${next ? `?next=${encodeURIComponent(next)}` : ""}` });
  return null;
}

// Settings → "Tautkan": remember who asked (signed, 10 min), then do the provider round-trip; the signIn callback stores the link
export async function linkOAuth(_: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const p = providerOf(form);
  if ("error" in p) return p.error;
  (await cookies()).set(LINK_COOKIE, signLinkIntent(session.user.id, p.provider), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !!process.env.AUTH_URL?.startsWith("https"),
    path: "/",
    maxAge: LINK_TTL_MS / 1000,
  });
  await signIn(p.provider, { redirectTo: `${ROLE_HOME[session.user.role]}/settings?oauth=linked&provider=${p.provider}` });
  return null;
}

export async function unlinkOAuth(_: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const provider = String(form.get("provider")) as OAuthProvider;
  if (!(provider in OAUTH_PROVIDERS)) return fail("Metode login tidak dikenal.");
  await db.oAuthAccount.deleteMany({ where: { userId: session.user.id, provider } });
  revalidatePath(`${ROLE_HOME[session.user.role]}/settings`);
  return ok(`Tautan ${OAUTH_LABEL[provider]} dilepas`);
}

const account = {
  email: z
    .string()
    .email("Email tidak valid")
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
};

async function emailTaken(email: string) {
  return !!(await db.user.findUnique({ where: { email } }));
}

function confirmOk(form: FormData) {
  return form.get("password") === form.get("confirm");
}

// ── Student ─────────────────────────────────────────────
const studentSchema = z.object({
  ...account,
  schoolId: z.string().optional(),
  major: z.string().min(2, "Pilih program keahlian"),
  graduationYear: z.coerce.number().int().min(2015).max(2035),
  city: z.string().min(2, "Pilih kota"),
});

export async function registerStudent(_: ActionResult, form: FormData): Promise<ActionResult> {
  if (await registrationClosed()) return fail("Pendaftaran akun baru sedang ditutup sementara oleh admin.");
  const parsed = studentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Periksa kembali data kamu.", zodErrors(parsed.error.issues));
  if (!confirmOk(form)) return fail("Konfirmasi kata sandi tidak sama.");
  if (!form.get("agree")) return fail("Kamu harus menyetujui Ketentuan Layanan.");
  const d = parsed.data;
  if (await emailTaken(d.email)) return fail("Email sudah terdaftar. Silakan masuk.");

  const user = await db.user.create({
    data: {
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 10),
      name: d.name,
      role: "STUDENT",
      student: {
        create: {
          slug: `${slugify(d.name)}-${uniqueSuffix()}`,
          schoolId: d.schoolId || null,
          major: d.major,
          graduationYear: d.graduationYear,
          city: d.city,
          province: CITIES[d.city] ?? null,
          seekingStatus: d.graduationYear > new Date().getFullYear() ? "LOOKING_PKL" : "OPEN_TO_WORK",
        },
      },
    },
  });
  if (d.schoolId) {
    const school = await db.school.findUnique({ where: { id: d.schoolId } });
    if (school)
      await notify(school.userId, {
        type: "SYSTEM",
        title: "Siswa baru bergabung",
        body: `${d.name} (${d.major}) mendaftar di VocAZ dan menunggu verifikasi sekolah.`,
        link: "/school/students",
      });
  }
  await notify(user.id, {
    type: "SYSTEM",
    title: "Selamat datang di VocAZ! 🎉",
    body: "Lengkapi profil, tambahkan skill, dan upload video showcase agar mudah ditemukan perusahaan.",
    link: "/student/profile",
  });
  await logActivity({ userId: user.id, action: "USER_REGISTERED", message: `${d.name} mendaftar sebagai siswa` });
  await doSignIn(d.email, d.password);
  redirect("/student?welcome=1");
}

// ── Company (multi-step) ─────────────────────────────────
const companySchema = z.object({
  ...account,
  position: z.string().min(2, "Pilih jabatan"),
  companyName: z.string().min(3, "Nama perusahaan wajib diisi"),
  industry: z.string().min(2, "Pilih industri"),
  size: z.string().min(1, "Pilih ukuran perusahaan"),
  city: z.string().min(2, "Pilih kota"),
  address: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  nib: z.string().optional(),
  npwp: z.string().optional(),
});

export async function registerCompany(_: ActionResult, form: FormData): Promise<ActionResult> {
  if (await registrationClosed()) return fail("Pendaftaran akun baru sedang ditutup sementara oleh admin.");
  const parsed = companySchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return fail("Periksa kembali data perusahaan.", zodErrors(parsed.error.issues));
  if (!confirmOk(form)) return fail("Konfirmasi kata sandi tidak sama.");
  const d = parsed.data;
  if (await emailTaken(d.email)) return fail("Email sudah terdaftar. Silakan masuk.");

  // optional legal documents (step 3)
  const docs: { type: string; fileName: string; fileUrl: string }[] = [];
  try {
    for (const type of ["NIB", "NPWP", "AKTA"]) {
      const f = form.get(`doc_${type}`);
      if (f instanceof File && f.size > 0) docs.push({ type, fileName: f.name, fileUrl: await saveUpload(f, "document") });
    }
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    throw e;
  }

  const user = await db.user.create({
    data: { email: d.email, passwordHash: await bcrypt.hash(d.password, 10), name: d.name, role: "COMPANY" },
  });
  const company = await db.company.create({
    data: {
      slug: `${slugify(d.companyName)}-${uniqueSuffix()}`,
      name: d.companyName,
      industry: d.industry,
      size: d.size,
      city: d.city,
      province: CITIES[d.city] ?? null,
      address: d.address,
      website: d.website,
      phone: d.phone,
      email: d.email,
      description: d.description,
      nib: d.nib,
      npwp: d.npwp,
      verificationStatus: docs.length ? "PENDING" : "UNVERIFIED",
      members: { create: { userId: user.id, role: "OWNER", position: d.position } },
      documents: { create: docs },
      verifications: docs.length ? { create: { status: "PENDING", message: "Pengajuan verifikasi saat registrasi." } } : undefined,
      preference: { create: { locations: [d.city] } },
    },
  });
  if (docs.length) {
    await notify(await adminUserIds(), {
      type: "VERIFICATION",
      title: "Pengajuan verifikasi perusahaan baru",
      body: `${company.name} mengunggah dokumen legal dan menunggu review.`,
      link: `/admin/company-verification/${company.id}`,
    });
  }
  await logActivity({ userId: user.id, action: "COMPANY_REGISTERED", message: `${company.name} mendaftar sebagai perusahaan`, entityType: "Company", entityId: company.id });
  await doSignIn(d.email, d.password);
  redirect("/company?welcome=1");
}

// ── School / BKK ─────────────────────────────────────────
const schoolSchema = z.object({
  ...account,
  schoolName: z.string().min(3, "Nama sekolah wajib diisi"),
  npsn: z.string().min(6, "NPSN tidak valid"),
  city: z.string().min(2, "Pilih kota"),
  programs: z.string().min(2, "Isi minimal satu program keahlian"),
});

export async function registerSchool(_: ActionResult, form: FormData): Promise<ActionResult> {
  if (await registrationClosed()) return fail("Pendaftaran akun baru sedang ditutup sementara oleh admin.");
  const parsed = schoolSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Periksa kembali data sekolah.", zodErrors(parsed.error.issues));
  if (!confirmOk(form)) return fail("Konfirmasi kata sandi tidak sama.");
  const d = parsed.data;
  if (await emailTaken(d.email)) return fail("Email sudah terdaftar. Silakan masuk.");
  const user = await db.user.create({
    data: {
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 10),
      name: d.name,
      role: "SCHOOL",
      school: {
        create: {
          slug: `${slugify(d.schoolName)}-${uniqueSuffix()}`,
          name: d.schoolName,
          npsn: d.npsn,
          city: d.city,
          province: CITIES[d.city] ?? null,
          programs: parseCsv(d.programs),
          bkkName: `BKK ${d.schoolName}`,
          bkkHead: d.name,
          bkkEmail: d.email,
        },
      },
    },
  });
  await logActivity({ userId: user.id, action: "USER_REGISTERED", message: `${d.schoolName} mendaftar sebagai Sekolah/BKK` });
  await doSignIn(d.email, d.password);
  redirect("/school?welcome=1");
}

// ── Certification institution ────────────────────────────
const instSchema = z.object({
  ...account,
  instName: z.string().min(3, "Nama lembaga wajib diisi"),
  type: z.enum(["LSP_BNSP", "INDUSTRY", "TRAINING"]),
  accreditationNumber: z.string().min(3, "Nomor lisensi/akreditasi wajib diisi"),
  city: z.string().min(2, "Pilih kota"),
  scopes: z.string().optional(),
});

export async function registerInstitution(_: ActionResult, form: FormData): Promise<ActionResult> {
  if (await registrationClosed()) return fail("Pendaftaran akun baru sedang ditutup sementara oleh admin.");
  const parsed = instSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Periksa kembali data lembaga.", zodErrors(parsed.error.issues));
  if (!confirmOk(form)) return fail("Konfirmasi kata sandi tidak sama.");
  const d = parsed.data;
  if (await emailTaken(d.email)) return fail("Email sudah terdaftar. Silakan masuk.");
  const user = await db.user.create({
    data: {
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 10),
      name: d.name,
      role: "INSTITUTION",
      institution: {
        create: {
          slug: `${slugify(d.instName)}-${uniqueSuffix()}`,
          name: d.instName,
          type: d.type,
          accreditationNumber: d.accreditationNumber,
          city: d.city,
          scopes: parseCsv(d.scopes ?? ""),
        },
      },
    },
  });
  await logActivity({ userId: user.id, action: "USER_REGISTERED", message: `${d.instName} mendaftar sebagai Lembaga Sertifikasi` });
  await doSignIn(d.email, d.password);
  redirect("/institution?welcome=1");
}
