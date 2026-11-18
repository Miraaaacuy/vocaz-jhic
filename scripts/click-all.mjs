// Clicks every internal link (sidebar, tabs, cards, buttons-as-links) for every demo role
// and checks that client-side navigation lands on the right URL without console errors.
// Usage: node scripts/click-all.mjs [baseUrl] [maxPerRole]
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const MAX = Number(process.argv[3] ?? 70);
const ROLES = [
  [null, "/"],
  ["siswa@vocaz.id", "/student"],
  ["perusahaan@vocaz.id", "/company"],
  ["bkk@vocaz.id", "/school"],
  ["lsp@vocaz.id", "/institution"],
  ["admin@vocaz.id", "/admin"],
];

const browser = await chromium.launch({ channel: "msedge" });
const failures = [];
let totalOk = 0;

// collapse ids/slugs so we test each route *type* a few times, not every record
const routeKey = (path) =>
  path
    .split("/")
    .map((s) => (/^c[a-z0-9]{20,}$/.test(s) || /-\d{3,}$/.test(s) || /^[a-z0-9-]+-[a-z0-9]{5}$/.test(s) ? ":id" : s))
    .join("/");

for (const [email, home] of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  // the first-visit intro overlay would cover the page — mark it as dismissed
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("vocaz:intro:never", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  let errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // media from external demo CDNs may be blocked/slow in headless — not an app bug
    if (/Failed to load resource.*(pexels|unsplash|randomuser)/i.test(t) || /net::ERR_(ABORTED|BLOCKED)/.test(t)) return;
    errors.push("console: " + t.slice(0, 160));
  });

  if (email) {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click('button[type="submit"]')]);
  }

  const tested = new Map(); // routeKey -> count
  const visited = new Set();
  const queue = [home];
  let okRole = 0;

  while (queue.length && okRole + failures.filter((f) => f.role === (email ?? "guest")).length < MAX) {
    const src = queue.shift();
    if (visited.has(src)) continue;
    visited.add(src);
    await page.goto(BASE + src, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const links = await page.$$eval("a[href]", (as) =>
      as
        .filter((a) => {
          const r = a.getBoundingClientRect();
          const st = getComputedStyle(a);
          // skip the history-based back button and the constantly moving marquee chips (not stable click targets)
          return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && a.target !== "_blank" && !a.hasAttribute("data-back") && !a.closest(".marquee");
        })
        .map((a) => a.getAttribute("href")),
    );
    const unique = [...new Set(links)].filter((h) => h && h.startsWith("/") && !h.startsWith("/api/") && !h.startsWith("//") && !h.includes("#"));
    for (const href of unique) {
      const target = new URL(href, BASE);
      const key = routeKey(target.pathname);
      if ((tested.get(key) ?? 0) >= 2 || target.pathname + target.search === src) continue;
      tested.set(key, (tested.get(key) ?? 0) + 1);

      // make sure we start from the source page
      if (new URL(page.url()).pathname + new URL(page.url()).search !== src) {
        await page.goto(BASE + src, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => {});
      }
      errors = [];
      const loc = page.locator(`a[href="${href}"]:not([data-back]):visible`).first();
      if (!(await loc.count())) continue;
      const t0 = Date.now();
      let ok = true;
      let reason = "";
      try {
        await loc.scrollIntoViewIfNeeded();
        await loc.click({ timeout: 5000 });
        // role pages redirect some public detail links (e.g. /lowongan/:id → /student/career/jobs/:id)
        await page.waitForURL((u) => u.pathname !== new URL(BASE + src).pathname || u.search !== new URL(BASE + src).search, { timeout: 4000 });
        await page.waitForLoadState("domcontentloaded");
        const title = await page.title();
        if (/404|tidak ditemukan/i.test(await page.locator("body").innerText().then((t) => t.slice(0, 400)))) {
          ok = false;
          reason = "halaman 404";
        }
        if (/error/i.test(title)) {
          ok = false;
          reason = "error page";
        }
      } catch (e) {
        ok = false;
        reason = e.message.split("\n")[0].slice(0, 120);
      }
      if (errors.length) {
        ok = false;
        reason = (reason ? reason + " | " : "") + errors.join(" ; ");
      }
      const role = email ?? "guest";
      if (ok) {
        okRole++;
        totalOk++;
        const landed = new URL(page.url()).pathname;
        if (landed.startsWith(home === "/" ? "/" : home) && !visited.has(landed) && queue.length < 40) queue.push(landed + new URL(page.url()).search);
      } else {
        failures.push({ role, src, href, reason, ms: Date.now() - t0 });
        console.log(`❌ [${role}] ${src} → ${href}: ${reason}`);
      }
    }
  }
  console.log(`✔ ${email ?? "guest"}: ${okRole} link OK, ${failures.filter((f) => f.role === (email ?? "guest")).length} gagal`);
  await ctx.close();
}

await browser.close();
console.log(`\nTOTAL: ${totalOk} link OK, ${failures.length} gagal`);
process.exit(failures.length ? 1 : 0);
