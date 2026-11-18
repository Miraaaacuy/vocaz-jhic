import { describe, expect, it } from "vitest";
import { computeMatch, DEFAULT_WEIGHTS, type MatchTalent } from "./match";

const base: MatchTalent = {
  skills: [
    { name: "JavaScript", level: "ADVANCED" },
    { name: "React", level: "ADVANCED" },
    { name: "Git", level: "INTERMEDIATE" },
  ],
  major: "Rekayasa Perangkat Lunak",
  city: "Malang",
  province: "Jawa Timur",
  willingRelocate: false,
  experienceMonths: 24,
  verifiedCerts: [{ type: "BNSP", name: "Sertifikat Kompetensi RPL", relatedSkills: ["JavaScript"] }],
  hasVideo: true,
  portfolioCount: 2,
  profileCompletion: 90,
};

const frontendJob = {
  requiredSkills: ["JavaScript", "React", "Git"],
  niceSkills: ["TypeScript"],
  majors: ["Rekayasa Perangkat Lunak"],
  city: "Malang",
  province: "Jawa Timur",
  minExperienceMonths: 24,
  certification: "ANY" as const,
};

describe("Smart Talent Match", () => {
  it("gives a very high score to an ideal candidate", () => {
    const r = computeMatch(base, frontendJob);
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.label).toBe("Sangat Cocok");
    expect(r.reasons.some((x) => x.ok && x.text.includes("JavaScript"))).toBe(true);
    expect(r.reasons.some((x) => x.ok && x.text.includes("pengalaman 2 tahun"))).toBe(true);
    expect(r.reasons.some((x) => x.ok && x.text.includes("BNSP"))).toBe(true);
  });

  it("breakdown adds up to the total weights", () => {
    const r = computeMatch(base, frontendJob);
    expect(r.breakdown.reduce((a, b) => a + b.max, 0)).toBe(100);
    for (const b of r.breakdown) expect(b.score).toBeLessThanOrEqual(b.max);
  });

  it("penalises missing required skills and reports them", () => {
    const r = computeMatch({ ...base, skills: [{ name: "JavaScript", level: "BEGINNER" }] }, frontendJob);
    expect(r.missingSkills).toEqual(["React", "Git"]);
    expect(r.reasons.some((x) => !x.ok && x.text.includes("React"))).toBe(true);
    expect(r.score).toBeLessThan(computeMatch(base, frontendJob).score - 20);
  });

  it("gives partial credit for a related major (same rumpun)", () => {
    const same = computeMatch(base, frontendJob).breakdown.find((b) => b.key === "major")!.score;
    const related = computeMatch({ ...base, major: "Teknik Komputer dan Jaringan" }, frontendJob).breakdown.find((b) => b.key === "major")!.score;
    const unrelated = computeMatch({ ...base, major: "Kuliner" }, frontendJob).breakdown.find((b) => b.key === "major")!.score;
    expect(same).toBe(DEFAULT_WEIGHTS.major);
    expect(related).toBeGreaterThan(0);
    expect(related).toBeLessThan(same);
    expect(unrelated).toBe(0);
  });

  it("handles location: same city > same province > relocate > elsewhere", () => {
    const loc = (t: Partial<MatchTalent>) => computeMatch({ ...base, ...t }, frontendJob).breakdown.find((b) => b.key === "location")!.score;
    expect(loc({})).toBe(10);
    expect(loc({ city: "Surabaya" })).toBe(6);
    expect(loc({ city: "Bandung", province: "Jawa Barat", willingRelocate: true })).toBe(5);
    expect(loc({ city: "Bandung", province: "Jawa Barat" })).toBe(0);
    expect(computeMatch({ ...base, city: "Medan", province: "Sumatera Utara" }, { ...frontendJob, remote: true }).breakdown.find((b) => b.key === "location")!.score).toBe(10);
  });

  it("scales experience proportionally", () => {
    const exp = (m: number) => computeMatch({ ...base, experienceMonths: m }, frontendJob).breakdown.find((b) => b.key === "experience")!.score;
    expect(exp(12)).toBeCloseTo(7.5, 1);
    expect(exp(36)).toBe(15);
  });

  it("requires BNSP when the job demands it", () => {
    const noCert = computeMatch({ ...base, verifiedCerts: [] }, { ...frontendJob, certification: "BNSP" });
    expect(noCert.breakdown.find((b) => b.key === "certification")!.score).toBe(0);
    expect(noCert.reasons.some((x) => !x.ok && x.text.includes("BNSP"))).toBe(true);
  });

  it("respects custom weights", () => {
    const w = { skills: 100, major: 0, certification: 0, experience: 0, location: 0, profile: 0 };
    // only skills count: (1 + 1 + 0.8) / 3 × 87.5% (no nice-to-have TypeScript) ≈ 82
    expect(computeMatch(base, frontendJob, w).score).toBe(82);
    expect(computeMatch({ ...base, skills: [...base.skills, { name: "TypeScript", level: "ADVANCED" }] }, frontendJob, w).score).toBe(94);
  });
});
