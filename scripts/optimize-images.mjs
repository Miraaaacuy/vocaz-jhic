// Generates right-sized WebP assets from assets/source → public.
// Run after changing any source image: node scripts/optimize-images.mjs
import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const SRC = "assets/source";
const OUT = "public";

const jobs = [
  // logos are shown ~40px high (≈130px wide) — 2x for retina
  { in: "brand/logo.png", out: "brand/logo.webp", width: 400 },
  { in: "brand/logo-white.png", out: "brand/logo-white.webp", width: 400 },
  // social preview image (Open Graph needs PNG/JPG)
  { in: "brand/logo.png", out: "brand/og-logo.png", width: 1200, format: "png" },
  // hero / LCP image in two sizes for srcset
  { in: "images/hero.jpg", out: "images/hero-560.webp", width: 560, quality: 70 },
  { in: "images/hero.jpg", out: "images/hero-900.webp", width: 900, quality: 70 },
  { in: "images/cta.jpg", out: "images/cta-1400.webp", width: 1400, quality: 55 },
  { in: "images/talent.jpg", out: "images/talent.webp", width: 128, quality: 75 },
];

// sponsor logos are shown at most 48px high → 96px for retina
for (const f of await readdir(path.join(SRC, "sponsors"))) {
  if (f.endsWith(".png")) jobs.push({ in: `sponsors/${f}`, out: `sponsors/${f.replace(".png", ".webp")}`, height: 96, quality: 85 });
}

for (const j of jobs) {
  const src = path.join(SRC, j.in);
  const dst = path.join(OUT, j.out);
  await mkdir(path.dirname(dst), { recursive: true });
  let img = sharp(src).resize({ width: j.width, height: j.height, withoutEnlargement: true });
  img = j.format === "png" ? img.png({ compressionLevel: 9, palette: true }) : img.webp({ quality: j.quality ?? 82, effort: 6 });
  const info = await img.toFile(dst);
  const before = (await stat(src)).size;
  console.log(`${j.out.padEnd(34)} ${info.width}×${info.height}  ${(before / 1024).toFixed(0)} KB → ${(info.size / 1024).toFixed(1)} KB`);
}
