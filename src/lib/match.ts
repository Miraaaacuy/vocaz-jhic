/**
 * Smart Talent Match — VocAZ
 *
 * Deterministic, explainable scoring (0–100) of a talent against a set of
 * requirements (a Job or a company's Talent Preferences). Every point awarded
 * is backed by a human-readable reason so recruiters see *why* a candidate fits.
 */
import { majorGroup } from "./constants";

export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CertKind = "BNSP" | "INDUSTRY" | "TRAINING";

export interface MatchTalent {
  skills: { name: string; level: Level }[];
  major?: string | null;
  city?: string | null;
  province?: string | null;
  willingRelocate?: boolean;
  experienceMonths: number;
  /** only VERIFIED certificates should be passed */
  verifiedCerts: { type: CertKind; name: string; relatedSkills?: string[] }[];
  hasVideo: boolean;
  portfolioCount: number;
  profileCompletion: number; // 0–100
}

export interface MatchRequirement {
  requiredSkills: string[];
  niceSkills?: string[];
  majors?: string[];
  city?: string | null;
  province?: string | null;
  locations?: string[]; // alternative list of acceptable cities/provinces
  remote?: boolean;
  minExperienceMonths?: number;
  certification?: "ANY" | "BNSP" | "INDUSTRY";
}

export interface MatchWeights {
  skills: number;
  major: number;
  certification: number;
  experience: number;
  location: number;
  profile: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  skills: 40,
  major: 15,
  certification: 15,
  experience: 15,
  location: 10,
  profile: 5,
};

export interface MatchComponent {
  key: keyof MatchWeights;
  label: string;
  score: number;
  max: number;
}

export interface MatchReason {
  ok: boolean;
  text: string;
}

export interface MatchResult {
  score: number;
  label: "Sangat Cocok" | "Cocok" | "Cukup" | "Kurang Cocok";
  breakdown: MatchComponent[];
  reasons: MatchReason[];
  matchedSkills: string[];
  missingSkills: string[];
}

const LEVEL_FACTOR: Record<Level, number> = { BEGINNER: 0.6, INTERMEDIATE: 0.8, ADVANCED: 1 };

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9+#.]/g, "");

function durationText(months: number) {
  if (months >= 12 && months % 12 === 0) return `${months / 12} tahun`;
  if (months >= 12) return `${(months / 12).toFixed(1).replace(".0", "")} tahun`;
  return `${months} bulan`;
}

export function matchLabel(score: number): MatchResult["label"] {
  if (score >= 80) return "Sangat Cocok";
  if (score >= 60) return "Cocok";
  if (score >= 40) return "Cukup";
  return "Kurang Cocok";
}

export function computeMatch(
  talent: MatchTalent,
  req: MatchRequirement,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): MatchResult {
  const reasons: MatchReason[] = [];
  const breakdown: MatchComponent[] = [];
  const talentSkills = new Map(talent.skills.map((s) => [norm(s.name), s]));

  // ── 1. Skills ───────────────────────────────────────────────
  const required = dedupe(req.requiredSkills);
  const nice = dedupe(req.niceSkills ?? []).filter((n) => !required.some((r) => norm(r) === norm(n)));
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let skillScore: number;

  if (required.length === 0 && nice.length === 0) {
    skillScore = weights.skills * 0.7; // no explicit requirement → neutral
  } else {
    let acc = 0;
    for (const r of required) {
      const s = talentSkills.get(norm(r));
      if (s) {
        acc += LEVEL_FACTOR[s.level];
        matchedSkills.push(r);
      } else missingSkills.push(r);
    }
    const niceHit = nice.filter((n) => talentSkills.has(norm(n)));
    matchedSkills.push(...niceHit);
    const niceRatio = nice.length ? niceHit.length / nice.length : 0;
    if (required.length) {
      // required skills weigh 87.5%, nice-to-have adds up to 12.5% (≈5 of 40 points)
      const reqRatio = acc / required.length;
      skillScore = weights.skills * (reqRatio * (nice.length ? 0.875 : 1) + niceRatio * 0.125);
    } else {
      skillScore = weights.skills * (0.7 + niceRatio * 0.3);
    }
  }
  breakdown.push({ key: "skills", label: "Keahlian", score: skillScore, max: weights.skills });
  if (matchedSkills.length) {
    reasons.push({ ok: true, text: `Memenuhi keahlian yang dibutuhkan: ${matchedSkills.slice(0, 4).join(", ")}` });
  }
  if (missingSkills.length) {
    reasons.push({ ok: false, text: `Belum memiliki skill: ${missingSkills.slice(0, 3).join(", ")}` });
  }

  // ── 2. Major / program keahlian ────────────────────────────
  const majors = req.majors ?? [];
  let majorScore = 0;
  if (majors.length === 0) {
    majorScore = weights.major * 0.7;
  } else if (talent.major && majors.includes(talent.major)) {
    majorScore = weights.major;
    reasons.push({ ok: true, text: `Program keahlian sesuai: ${talent.major}` });
  } else if (talent.major && majors.some((m) => majorGroup(m) && majorGroup(m) === majorGroup(talent.major))) {
    majorScore = weights.major * 0.55;
    reasons.push({ ok: true, text: `Program keahlian serumpun (${majorGroup(talent.major)})` });
  } else {
    reasons.push({ ok: false, text: "Program keahlian berbeda dari yang dicari" });
  }
  breakdown.push({ key: "major", label: "Program Keahlian", score: majorScore, max: weights.major });

  // ── 3. Verified certification ──────────────────────────────
  const certs = talent.verifiedCerts;
  const reqSkillSet = new Set([...required, ...nice].map(norm));
  const relevant = (c: MatchTalent["verifiedCerts"][number]) =>
    reqSkillSet.size === 0 ||
    (c.relatedSkills ?? []).some((s) => reqSkillSet.has(norm(s))) ||
    [...reqSkillSet].some((s) => s.length > 2 && norm(c.name).includes(s));
  const bnsp = certs.filter((c) => c.type === "BNSP");
  const industry = certs.filter((c) => c.type === "INDUSTRY");
  const training = certs.filter((c) => c.type === "TRAINING");
  let certScore = 0;
  const pref = req.certification ?? "ANY";
  if (bnsp.length) {
    const rel = bnsp.some(relevant);
    certScore = weights.certification * (rel ? 1 : 0.8);
    reasons.push({ ok: true, text: `Memiliki Sertifikasi BNSP${rel ? " yang relevan" : ""}` });
  } else if (industry.length) {
    const rel = industry.some(relevant);
    certScore = weights.certification * (pref === "BNSP" ? 0.5 : rel ? 0.85 : 0.67);
    reasons.push({ ok: true, text: `Memiliki sertifikasi industri terverifikasi${rel ? " yang relevan" : ""}` });
  } else if (training.length) {
    certScore = weights.certification * 0.35;
    reasons.push({ ok: true, text: "Memiliki sertifikat pelatihan terverifikasi" });
  } else {
    certScore = pref === "ANY" ? weights.certification * 0.3 : 0;
    if (pref !== "ANY") reasons.push({ ok: false, text: `Belum memiliki sertifikasi ${pref === "BNSP" ? "BNSP" : "industri"}` });
  }
  if (pref === "BNSP" && !bnsp.length && certs.length) {
    reasons.push({ ok: false, text: "Belum memiliki sertifikasi BNSP yang disyaratkan" });
  }
  breakdown.push({ key: "certification", label: "Sertifikasi", score: certScore, max: weights.certification });

  // ── 4. Experience ──────────────────────────────────────────
  const minExp = req.minExperienceMonths ?? 0;
  let expScore: number;
  if (minExp <= 0) {
    expScore = weights.experience * Math.min(1, 0.6 + talent.experienceMonths / 30);
    if (talent.experienceMonths > 0)
      reasons.push({ ok: true, text: `Memiliki pengalaman ${durationText(talent.experienceMonths)} (PKL/magang/kerja)` });
  } else {
    const ratio = Math.min(1, talent.experienceMonths / minExp);
    expScore = weights.experience * ratio;
    if (ratio >= 1) reasons.push({ ok: true, text: `Memenuhi persyaratan pengalaman ${durationText(minExp)}` });
    else
      reasons.push({
        ok: false,
        text: `Pengalaman ${durationText(talent.experienceMonths)} dari ${durationText(minExp)} yang diminta`,
      });
  }
  breakdown.push({ key: "experience", label: "Pengalaman", score: expScore, max: weights.experience });

  // ── 5. Location ────────────────────────────────────────────
  let locScore: number;
  const locs = (req.locations ?? []).map(norm);
  const tCity = norm(talent.city ?? "");
  const tProv = norm(talent.province ?? "");
  if (req.remote) {
    locScore = weights.location;
    reasons.push({ ok: true, text: "Posisi remote — lokasi fleksibel" });
  } else if (!req.city && !req.province && locs.length === 0) {
    locScore = weights.location * 0.7;
  } else if ((req.city && norm(req.city) === tCity) || (tCity && locs.includes(tCity))) {
    locScore = weights.location;
    reasons.push({ ok: true, text: `Berdomisili di ${talent.city}` });
  } else if ((req.province && norm(req.province) === tProv) || (tProv && locs.includes(tProv))) {
    locScore = weights.location * 0.6;
    reasons.push({ ok: true, text: `Berada di provinsi yang sama (${talent.province})` });
  } else if (talent.willingRelocate) {
    locScore = weights.location * 0.5;
    reasons.push({ ok: true, text: "Bersedia relokasi" });
  } else {
    locScore = 0;
    reasons.push({ ok: false, text: "Lokasi berbeda dan belum bersedia relokasi" });
  }
  breakdown.push({ key: "location", label: "Lokasi", score: locScore, max: weights.location });

  // ── 6. Profile & showcase ─────────────────────────────────
  const profileRatio =
    (talent.hasVideo ? 0.4 : 0) + (talent.portfolioCount > 0 ? 0.3 : 0) + (talent.profileCompletion >= 80 ? 0.3 : talent.profileCompletion / 80 * 0.3);
  const profileScore = weights.profile * Math.min(1, profileRatio);
  if (talent.hasVideo) reasons.push({ ok: true, text: "Memiliki video showcase kemampuan" });
  breakdown.push({ key: "profile", label: "Profil & Showcase", score: profileScore, max: weights.profile });

  const totalMax = breakdown.reduce((a, b) => a + b.max, 0) || 1;
  const total = breakdown.reduce((a, b) => a + b.score, 0);
  const score = Math.round((total / totalMax) * 100);

  // positive reasons first, then missing ones
  reasons.sort((a, b) => Number(b.ok) - Number(a.ok));

  return {
    score,
    label: matchLabel(score),
    breakdown: breakdown.map((b) => ({ ...b, score: Math.round(b.score * 10) / 10 })),
    reasons,
    matchedSkills,
    missingSkills,
  };
}

function dedupe(list: string[]) {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = norm(s);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
