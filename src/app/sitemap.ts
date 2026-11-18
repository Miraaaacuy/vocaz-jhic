import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = process.env.AUTH_URL || "http://localhost:3000";

// generated per request so builds never need a database connection
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [talents, jobs, companies] = await Promise.all([
    db.studentProfile.findMany({ where: { hidden: false, isPublic: true }, select: { slug: true, updatedAt: true } }),
    db.job.findMany({ where: { status: "ACTIVE" }, select: { id: true, updatedAt: true } }),
    db.company.findMany({ where: { hidden: false }, select: { slug: true, updatedAt: true } }),
  ]);
  const pages = ["", "/talenta", "/showcase", "/lowongan", "/perusahaan", "/tentang"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...pages,
    ...talents.map((t) => ({ url: `${BASE}/talenta/${t.slug}`, lastModified: t.updatedAt, priority: 0.6 })),
    ...jobs.map((j) => ({ url: `${BASE}/lowongan/${j.id}`, lastModified: j.updatedAt, priority: 0.7 })),
    ...companies.map((c) => ({ url: `${BASE}/perusahaan/${c.slug}`, lastModified: c.updatedAt, priority: 0.5 })),
  ];
}
