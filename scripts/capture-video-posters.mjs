// Grabs one frame from each demo showcase video and saves it as a small WebP poster
// (public/images/videos/<pexels-id>.webp) so cards don't have to download video data.
// Usage: node scripts/capture-video-posters.mjs   (needs Microsoft Edge + internet)
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const seed = await readFile("prisma/seed.ts", "utf8");
const urls = [...new Set([...seed.matchAll(/https:\/\/videos\.pexels\.com\/video-files\/\d+\/[^"]+\.mp4/g)].map((m) => m[0]))];
await mkdir("public/images/videos", { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
for (const url of urls) {
  const id = url.match(/video-files\/(\d+)\//)[1];
  await page.setContent(`<body style="margin:0;background:#000"><video id="v" muted playsinline preload="auto" src="${url}" style="width:800px;height:450px;object-fit:cover"></video></body>`);
  try {
    await page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const v = document.getElementById("v");
          const t = setTimeout(() => reject(new Error("timeout")), 45000);
          const seek = () => (v.currentTime = Math.min(1.5, v.duration / 3));
          v.addEventListener("seeked", () => (clearTimeout(t), resolve()), { once: true });
          v.addEventListener("error", () => reject(new Error("video error")), { once: true });
          // metadata may already be loaded by the time this runs
          if (v.readyState >= 1) seek();
          else v.addEventListener("loadedmetadata", seek, { once: true });
        }),
    );
    await page.waitForTimeout(250);
    const png = await page.locator("#v").screenshot();
    const info = await sharp(png).resize({ width: 640 }).webp({ quality: 62, effort: 6 }).toFile(`public/images/videos/${id}.webp`);
    console.log(`✔ ${id}.webp  ${(info.size / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.log(`✖ ${id}: ${e.message}`);
  }
}
await browser.close();
