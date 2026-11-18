import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { computeMatch, DEFAULT_WEIGHTS, type MatchRequirement, type MatchTalent, type MatchWeights } from "./match";
import { monthsBetween, strArr } from "./utils";

/** Prisma include needed to evaluate a student for matching / cards */
export const talentInclude = {
  user: { select: { id: true, name: true, avatarUrl: true, email: true } },
  school: { select: { id: true, name: true, slug: true } },
  skills: { include: { skill: true } },
  experiences: { select: { startDate: true, endDate: true, title: true, company: true, type: true } },
  certificates: {
    where: { status: "VERIFIED" as const },
    select: { id: true, type: true, name: true, relatedSkills: true, issuer: true },
  },
  videos: {
    where: { status: "PUBLISHED" as const },
    select: { id: true, title: true, thumbnailUrl: true, videoUrl: true },
    orderBy: { createdAt: "desc" as const },
  },
  _count: { select: { portfolio: true, educations: true } },
} satisfies Prisma.StudentProfileInclude;

export type TalentRow = Prisma.StudentProfileGetPayload<{ include: typeof talentInclude }>;

export function profileCompletion(s: {
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  major?: string | null;
  schoolId?: string | null;
  user?: { avatarUrl?: string | null };
  skills?: unknown[];
  experiences?: unknown[];
  certificates?: unknown[];
  videos?: unknown[];
  _count?: { portfolio?: number; educations?: number };
}) {
  const checks = [
    !!s.user?.avatarUrl,
    !!s.headline,
    !!s.bio && s.bio.length > 40,
    !!s.city,
    !!s.major,
    !!s.schoolId,
    (s.skills?.length ?? 0) >= 3,
    (s._count?.educations ?? 0) > 0,
    (s.experiences?.length ?? 0) > 0,
    (s._count?.portfolio ?? 0) > 0,
    (s.certificates?.length ?? 0) > 0,
    (s.videos?.length ?? 0) > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function experienceMonths(exps: { startDate: Date; endDate: Date | null }[]) {
  return exps.reduce((a, e) => a + monthsBetween(e.startDate, e.endDate), 0);
}

export function toTalentCard(s: TalentRow) {
  const levelRank = { ADVANCED: 0, INTERMEDIATE: 1, BEGINNER: 2 };
  return {
    slug: s.slug,
    name: s.user.name,
    avatarUrl: s.user.avatarUrl,
    headline: s.headline,
    major: s.major,
    city: s.city,
    schoolName: s.school?.name,
    schoolVerified: s.schoolVerified,
    skills: [...s.skills].sort((a, b) => levelRank[a.level] - levelRank[b.level]).map((k) => k.skill.name),
    certTypes: s.certificates.map((c) => c.type),
    hasVideo: s.videos.length > 0,
  };
}

export function toMatchTalent(s: TalentRow): MatchTalent {
  return {
    skills: s.skills.map((k) => ({ name: k.skill.name, level: k.level })),
    major: s.major,
    city: s.city,
    province: s.province,
    willingRelocate: s.willingRelocate,
    experienceMonths: experienceMonths(s.experiences),
    verifiedCerts: s.certificates.map((c) => ({ type: c.type, name: c.name, relatedSkills: strArr(c.relatedSkills) })),
    hasVideo: s.videos.length > 0,
    portfolioCount: s._count.portfolio,
    profileCompletion: profileCompletion(s),
  };
}

export function jobRequirement(job: {
  requiredSkills: unknown;
  niceSkills: unknown;
  majors: unknown;
  city: string | null;
  province: string | null;
  workMode: string;
  minExperienceMonths: number;
  certification: "ANY" | "BNSP" | "INDUSTRY";
}): MatchRequirement {
  return {
    requiredSkills: strArr(job.requiredSkills),
    niceSkills: strArr(job.niceSkills),
    majors: strArr(job.majors),
    city: job.city,
    province: job.province,
    remote: job.workMode === "REMOTE",
    minExperienceMonths: job.minExperienceMonths,
    certification: job.certification,
  };
}

export function preferenceRequirement(
  pref: {
    skills: unknown;
    majors: unknown;
    locations: unknown;
    minExperienceMonths: number;
    certification: "ANY" | "BNSP" | "INDUSTRY";
  } | null,
): MatchRequirement {
  if (!pref) return { requiredSkills: [] };
  return {
    requiredSkills: strArr(pref.skills),
    majors: strArr(pref.majors),
    locations: strArr(pref.locations),
    minExperienceMonths: pref.minExperienceMonths,
    certification: pref.certification,
  };
}

export async function getWeights(): Promise<MatchWeights> {
  const row = await db.systemSetting.findUnique({ where: { key: "match.weights" } });
  if (!row) return DEFAULT_WEIGHTS;
  return { ...DEFAULT_WEIGHTS, ...(row.value as Partial<MatchWeights>) };
}

export async function scoreTalents(talents: TalentRow[], req: MatchRequirement) {
  const weights = await getWeights();
  return talents
    .map((t) => ({ talent: t, match: computeMatch(toMatchTalent(t), req, weights) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export async function scoreOne(talent: TalentRow, req: MatchRequirement) {
  return computeMatch(toMatchTalent(talent), req, await getWeights());
}
