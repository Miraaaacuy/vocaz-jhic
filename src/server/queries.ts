import "server-only";
import type { JobType, Prisma, WorkMode } from "@prisma/client";
import { db } from "@/lib/db";
import { talentInclude } from "@/lib/match-data";

export const PAGE_SIZE = 12;

// ───────────── Talents ─────────────
export type TalentFilter = {
  q?: string;
  major?: string;
  city?: string;
  cert?: string; // BNSP | INDUSTRY
  video?: string; // "1"
  skill?: string;
  schoolId?: string;
};

export function talentWhere(f: TalentFilter, opts: { publicOnly?: boolean } = {}): Prisma.StudentProfileWhereInput {
  const and: Prisma.StudentProfileWhereInput[] = [{ hidden: false }, { user: { status: "ACTIVE" } }];
  if (opts.publicOnly) and.push({ isPublic: true });
  if (f.q)
    and.push({
      OR: [
        { user: { name: { contains: f.q } } },
        { headline: { contains: f.q } },
        { skills: { some: { skill: { name: { contains: f.q } } } } },
      ],
    });
  if (f.major) and.push({ major: f.major });
  if (f.city) and.push({ city: f.city });
  if (f.schoolId) and.push({ schoolId: f.schoolId });
  if (f.skill) and.push({ skills: { some: { skill: { name: f.skill } } } });
  if (f.cert === "BNSP" || f.cert === "INDUSTRY") and.push({ certificates: { some: { type: f.cert, status: "VERIFIED" } } });
  if (f.video === "1") and.push({ videos: { some: { status: "PUBLISHED" } } });
  return { AND: and };
}

export async function listTalents(f: TalentFilter, page = 1, opts: { publicOnly?: boolean } = {}) {
  const where = talentWhere(f, opts);
  const [total, rows] = await Promise.all([
    db.studentProfile.count({ where }),
    db.studentProfile.findMany({
      where,
      include: talentInclude,
      orderBy: [{ schoolVerified: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, rows, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export const fullTalentInclude = {
  ...talentInclude,
  skills: { include: { skill: true }, orderBy: { level: "desc" as const } },
  educations: { orderBy: { startYear: "desc" as const } },
  experiences: { orderBy: { startDate: "desc" as const } },
  achievements: { orderBy: { date: "desc" as const } },
  portfolio: { where: { status: "PUBLISHED" as const }, orderBy: { createdAt: "desc" as const } },
  certificates: { where: { status: "VERIFIED" as const }, include: { institution: { select: { name: true, type: true } } }, orderBy: { issuedAt: "desc" as const } },
  videos: { where: { status: "PUBLISHED" as const }, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.StudentProfileInclude;

export type FullTalent = Prisma.StudentProfileGetPayload<{ include: typeof fullTalentInclude }>;

export async function getTalent(slug: string) {
  return db.studentProfile.findFirst({ where: { slug, hidden: false, user: { status: "ACTIVE" } }, include: fullTalentInclude });
}

// ───────────── Jobs ─────────────
export type JobFilter = { q?: string; city?: string; type?: string; mode?: string; major?: string; industry?: string };

export const jobCardInclude = {
  company: { select: { id: true, name: true, slug: true, logoUrl: true, verificationStatus: true, industry: true, city: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

export function jobWhere(f: JobFilter): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [{ status: "ACTIVE" }, { company: { hidden: false } }];
  if (f.q) and.push({ OR: [{ title: { contains: f.q } }, { company: { name: { contains: f.q } } }, { department: { contains: f.q } }] });
  if (f.city) and.push({ city: { contains: f.city } });
  if (f.type) and.push({ type: f.type as JobType });
  if (f.mode) and.push({ workMode: f.mode as WorkMode });
  if (f.industry) and.push({ company: { industry: f.industry } });
  return { AND: and };
}

export async function listJobs(f: JobFilter, page = 1, take = PAGE_SIZE) {
  let where = jobWhere(f);
  // JSON array filter for major — do it in JS for MariaDB compatibility
  if (f.major) {
    const all = await db.job.findMany({ where, select: { id: true, majors: true } });
    const ids = all.filter((j) => Array.isArray(j.majors) && (j.majors as string[]).includes(f.major!)).map((j) => j.id);
    where = { id: { in: ids } };
  }
  const [total, rows] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({ where, include: jobCardInclude, orderBy: { publishedAt: "desc" }, skip: (page - 1) * take, take }),
  ]);
  return { total, rows, totalPages: Math.ceil(total / take) };
}

export async function getJob(id: string) {
  return db.job.findUnique({
    where: { id },
    include: {
      company: { include: { _count: { select: { jobs: { where: { status: "ACTIVE" } } } } } },
      _count: { select: { applications: true } },
    },
  });
}

// ───────────── Companies ─────────────
export async function listCompanies(f: { q?: string; industry?: string; city?: string; verified?: string }, page = 1) {
  const and: Prisma.CompanyWhereInput[] = [{ hidden: false }];
  if (f.q) and.push({ name: { contains: f.q } });
  if (f.industry) and.push({ industry: f.industry });
  if (f.city) and.push({ city: f.city });
  if (f.verified === "1") and.push({ verificationStatus: "VERIFIED" });
  const where = { AND: and };
  const [total, rows] = await Promise.all([
    db.company.count({ where }),
    db.company.findMany({
      where,
      include: { _count: { select: { jobs: { where: { status: "ACTIVE" } } } } },
      orderBy: [{ verificationStatus: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return {
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    rows: rows.map((c) => ({ ...c, activeJobs: c._count.jobs })),
  };
}

export async function getCompany(slug: string) {
  return db.company.findFirst({
    where: { slug, hidden: false },
    include: {
      jobs: { where: { status: "ACTIVE" }, include: jobCardInclude, orderBy: { publishedAt: "desc" } },
      members: { include: { user: { select: { name: true, avatarUrl: true } } } },
      partners: { include: { school: { select: { name: true, slug: true } } } },
    },
  });
}

// ───────────── Videos ─────────────
export const videoInclude = {
  student: {
    select: {
      id: true,
      slug: true,
      major: true,
      headline: true,
      city: true,
      schoolVerified: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
      school: { select: { name: true } },
      certificates: { where: { status: "VERIFIED" as const }, select: { type: true } },
      skills: { include: { skill: true } },
    },
  },
} satisfies Prisma.ShowcaseVideoInclude;

export async function listVideos(f: { q?: string; major?: string; excludeStudentId?: string; excludeId?: string }, page = 1, take = 12) {
  const and: Prisma.ShowcaseVideoWhereInput[] = [{ status: "PUBLISHED" }, { student: { hidden: false, user: { status: "ACTIVE" } } }];
  if (f.q) and.push({ OR: [{ title: { contains: f.q } }, { student: { user: { name: { contains: f.q } } } }] });
  if (f.major) and.push({ student: { major: f.major } });
  if (f.excludeStudentId) and.push({ studentId: { not: f.excludeStudentId } });
  if (f.excludeId) and.push({ id: { not: f.excludeId } });
  const where = { AND: and };
  const [total, rows] = await Promise.all([
    db.showcaseVideo.count({ where }),
    db.showcaseVideo.findMany({ where, include: videoInclude, orderBy: [{ createdAt: "desc" }], skip: (page - 1) * take, take }),
  ]);
  return { total, rows, totalPages: Math.ceil(total / take) };
}

export async function getVideo(id: string) {
  return db.showcaseVideo.findFirst({ where: { id, status: "PUBLISHED" }, include: videoInclude });
}

// ───────────── Stats ─────────────
export async function platformStats() {
  const [students, companies, jobs, verifiedCerts, schools, videos, hired] = await Promise.all([
    db.studentProfile.count(),
    db.company.count(),
    db.job.count({ where: { status: "ACTIVE" } }),
    db.certificate.count({ where: { status: "VERIFIED" } }),
    db.school.count(),
    db.showcaseVideo.count({ where: { status: "PUBLISHED" } }),
    db.application.count({ where: { status: "HIRED" } }),
  ]);
  return { students, companies, jobs, verifiedCerts, schools, videos, hired };
}
