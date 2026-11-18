// Screenshot key pages (public + per role) at desktop & mobile width for visual review,
// and report any horizontal overflow. Usage: node scripts/shots.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "fs";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const OUT = "../shots/review";
mkdirSync(OUT, { recursive: true });
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const PUBLIC = ["/", "/talenta", "/lowongan", "/perusahaan", "/showcase", "/tentang", "/login", "/register"];
const ROLES = { "siswa@vocaz.id": ["/student"], "perusahaan@vocaz.id": ["/company", "/company/recruitment"], "bkk@vocaz.id": ["/school"], "lsp@vocaz.id": ["/institution"], "admin@vocaz.id": ["/admin"] };
const name = (path, vp) => `${OUT}/${(path === "/" ? "home" : path.slice(1).replaceAll("/", "-"))}-${vp}.png`;
const problems = [];

async function shoot(p, path, vp) {
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  // scroll through once: `content-visibility:auto` sections only render near the viewport
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(600);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) problems.push(`${path} @${vp}: horizontal overflow ${over}px`);
  await p.screenshot({ path: name(path, vp), fullPage: true });
}

const b = await chromium.launch({ channel: "msedge" });
for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
  // intro (first visit)
  const intro = await b.newContext({ viewport });
  const ip = await intro.newPage();
  await ip.goto(BASE + "/", { waitUntil: "networkidle" });
  await ip.waitForTimeout(1500);
  await ip.screenshot({ path: `${OUT}/intro-${vp}.png` });
  await intro.close();

  const ctx = await b.newContext({ viewport, reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("vocaz:intro:never", "1"));
  const p = await ctx.newPage();
  for (const path of PUBLIC) await shoot(p, path, vp);
  await ctx.close();

  for (const [email, paths] of Object.entries(ROLES)) {
    const rc = await b.newContext({ viewport, reducedMotion: "reduce" });
    const rp = await rc.newPage();
    await rp.goto(`${BASE}/login`);
    await rp.fill('input[name="email"]', email);
    await rp.fill('input[name="password"]', "password123");
    await Promise.all([rp.waitForURL((u) => !u.pathname.startsWith("/login")), rp.click('button[type="submit"]')]);
    for (const path of paths) await shoot(rp, path, vp);
    await rc.close();
  }
}
await b.close();
console.log(problems.length ? problems.join("\n") : "no horizontal overflow");
