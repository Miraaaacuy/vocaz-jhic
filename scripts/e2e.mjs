// End-to-end check of the main cross-role flows using the installed Edge browser.
// Usage: node scripts/e2e.mjs [baseUrl]   (requires the app running + seeded DB)
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const SHOTS = "../shots";
mkdirSync(SHOTS, { recursive: true });
const MYSQL = process.env.MYSQL ?? "C:/xampp/mysql/bin/mysql.exe -u root vocaz -N -e";
const q = (sql) => execSync(`${MYSQL} "${sql}"`).toString().trim();

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(["✅", name]);
    console.log("✅", name);
  } catch (e) {
    results.push(["❌", name, e.message.split("\n")[0]]);
    console.log("❌", name, "—", e.message.split("\n")[0]);
  }
};

async function as(email, fn, viewport = { width: 1366, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  // the first-visit intro overlay would cover the page — mark it as dismissed
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("vocaz:intro:never", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  if (email) {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }), page.click('button[type="submit"]')]);
  }
  try {
    await fn(page);
  } finally {
    await ctx.close();
  }
}
const shot = (page, name, full = true) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
const toast = (page, text) => page.getByText(text, { exact: false }).first().waitFor({ timeout: 20000 });

const heroStudent = q("select s.id from StudentProfile s join User u on u.id=s.userId where u.email='siswa@vocaz.id'");
const jobToApply = q(
  `select j.id from Job j join Company c on c.id=j.companyId where c.slug like 'pt-teknologi-nusantara%' and j.status='ACTIVE' and j.id not in (select jobId from Application where studentId='${heroStudent}') limit 1`,
);

// 1 ─ guest restrictions
await step("Guest: tombol Lamar di lowongan publik mengarah ke login", () =>
  as(null, async (p) => {
    await p.goto(`${BASE}/lowongan/${jobToApply}`);
    await shot(p, "01-public-job");
    await p.getByRole("link", { name: /Lamar Sekarang/ }).click();
    await p.waitForURL(/\/login/);
  }),
);

await step("Guest: beranda tampil di mobile (375px) dengan 5 logo sponsor", () =>
  as(
    null,
    async (p) => {
      await p.goto(BASE);
      const n = await p.locator('footer img[src^="/sponsors/"]').count();
      if (n !== 5) throw new Error(`logo sponsor di footer = ${n}`);
      await shot(p, "02-home-mobile");
    },
    { width: 375, height: 800 },
  ),
);

// 2 ─ student applies + uploads certificate
await step("Siswa: melamar lowongan (skor match tercatat)", () =>
  as("siswa@vocaz.id", async (p) => {
    await shot(p, "03-student-dashboard");
    await p.goto(`${BASE}/student/career/jobs/${jobToApply}`);
    await shot(p, "04-student-job-match");
    await p.getByRole("button", { name: /Lamar Sekarang/ }).click();
    await p.fill('textarea[name="coverLetter"]', "Saya sangat tertarik dengan posisi ini dan siap belajar.");
    await p.getByRole("button", { name: "Kirim Lamaran" }).click();
    await toast(p, "Lamaran terkirim");
    const score = q(`select matchScore from Application where jobId='${jobToApply}' and studentId='${heroStudent}'`);
    if (!score) throw new Error("application not saved");
    console.log("   match score:", score);
  }),
);

await step("Siswa: upload sertifikat untuk diverifikasi LSP", () =>
  as("siswa@vocaz.id", async (p) => {
    await p.goto(`${BASE}/student/profile/certifications`);
    await p.getByRole("button", { name: /Upload Sertifikat/ }).click();
    await p.fill('input[name="name"]', "Sertifikat Kompetensi Junior Web Developer (E2E)");
    await p.fill('input[name="number"]', "LSP-E2E-0001");
    const inst = q("select id from Institution where name like 'LSP Teknologi%'");
    await p.selectOption('select[name="institutionId"]', inst);
    await p.fill('input[name="issuedAt"]', "2026-08-01");
    await p.setInputFiles('input[name="file"]', "public/demo/sertifikat-contoh.pdf");
    await p.getByRole("button", { name: "Kirim untuk verifikasi" }).click();
    await toast(p, "dikirim untuk diverifikasi");
  }),
);

// 3 ─ institution verifies
await step("Lembaga: memverifikasi sertifikat → badge BNSP", () =>
  as("lsp@vocaz.id", async (p) => {
    const cert = q("select id from Certificate where number='LSP-E2E-0001' order by createdAt desc limit 1");
    await p.goto(`${BASE}/institution/verification/${cert}`);
    await shot(p, "05-institution-review");
    await p.fill('textarea[name="note"]', "Data sesuai arsip lembaga.");
    await p.getByRole("button", { name: /Verifikasi/ }).last().click();
    await toast(p, "Sertifikat diverifikasi");
    if (q(`select status from Certificate where id='${cert}'`) !== "VERIFIED") throw new Error("status not VERIFIED");
  }),
);

// 4 ─ company: talent match, contact, hire
await step("Perusahaan: Smart Talent Match menampilkan skor & alasan", () =>
  as("perusahaan@vocaz.id", async (p) => {
    await shot(p, "06-company-dashboard");
    await p.goto(`${BASE}/company/talent-match?job=${jobToApply}`);
    await p.getByText("% Match").first().waitFor();
    await shot(p, "07-talent-match");
    await p.goto(`${BASE}/company/showcase`);
    await p.getByText("Mengapa kandidat ini sesuai").first().waitFor();
    await shot(p, "08-showcase-feed", false);
  }),
);

await step("Perusahaan: hubungi talent → percakapan terbuka", () =>
  as("perusahaan@vocaz.id", async (p) => {
    const slug = q(`select slug from StudentProfile where id='${heroStudent}'`);
    await p.goto(`${BASE}/company/talent-match/${slug}`);
    await p.getByRole("button", { name: "Message" }).first().click();
    await p.fill('textarea[name="message"]', "Halo Ilham, pesan E2E dari recruiter 👋");
    await Promise.all([p.waitForURL(/\/company\/messages\?c=/, { waitUntil: "commit" }),p.getByRole("button", { name: /Kirim & buka percakapan/ }).click()]);
    await p.getByText("pesan E2E dari recruiter").first().waitFor();
    await shot(p, "09-messages", false);
  }),
);

await step("Siswa: menerima pesan & membalas (real-time polling)", () =>
  as("siswa@vocaz.id", async (p) => {
    await p.goto(`${BASE}/student/messages`);
    await p.getByText("pesan E2E dari recruiter").first().click();
    await p.fill("textarea", "Terima kasih Pak, saya bersedia!");
    await p.keyboard.press("Enter");
    await p.waitForTimeout(2500);
    const n = q("select count(*) from Message where body='Terima kasih Pak, saya bersedia!'");
    if (n === "0") throw new Error("reply not stored");
  }),
);

await step("Perusahaan: ubah status pelamar → Diterima (HIRED)", () =>
  as("perusahaan@vocaz.id", async (p) => {
    const app = q(`select id from Application where jobId='${jobToApply}' and studentId='${heroStudent}'`);
    await p.goto(`${BASE}/company/recruitment/${jobToApply}?app=${app}`);
    await shot(p, "10-applicant-pipeline");
    await p.selectOption('select[name="status"]', "HIRED");
    await p.getByRole("button", { name: /Simpan & kirim notifikasi/ }).click();
    await toast(p, "Status diperbarui");
    if (q(`select status from Application where id='${app}'`) !== "HIRED") throw new Error("not hired");
  }),
);

// 5 ─ school sees placement
await step("BKK: penempatan siswa muncul di Career Monitoring", () =>
  as("bkk@vocaz.id", async (p) => {
    await shot(p, "11-school-dashboard");
    await p.goto(`${BASE}/school/career/placement`);
    await p.getByText("Muhammad Ilham").first().waitFor();
    await shot(p, "12-school-placement");
  }),
);

// 6 ─ admin: company verification + moderation
await step("Admin: approve verifikasi perusahaan", () =>
  as("admin@vocaz.id", async (p) => {
    await shot(p, "13-admin-dashboard");
    const c = q("select id from Company where verificationStatus='PENDING' limit 1");
    await p.goto(`${BASE}/admin/company-verification/${c}`);
    await p.fill('textarea[name="note"]', "Dokumen lengkap (E2E).");
    await p.getByRole("button", { name: /Approve/ }).click();
    await toast(p, "Perusahaan diverifikasi");
    if (q(`select verificationStatus from Company where id='${c}'`) !== "VERIFIED") throw new Error("not verified");
  }),
);

await step("Admin: sembunyikan video yang dilaporkan → hilang dari publik", () =>
  as("admin@vocaz.id", async (p) => {
    const r = q("select id from Report where status='OPEN' and targetType='VIDEO' limit 1");
    const vid = q(`select targetId from Report where id='${r}'`);
    await p.goto(`${BASE}/admin/moderation/${r}`);
    await p.getByRole("button", { name: /Sembunyikan konten/ }).click();
    await toast(p, "Konten disembunyikan");
    if (q(`select status from ShowcaseVideo where id='${vid}'`) !== "HIDDEN") throw new Error("video not hidden");
    const res = await p.request.get(`${BASE}/showcase/${vid}`, { maxRedirects: 0 });
    // hidden video → 404 on the public page
    if (res.status() !== 404) throw new Error(`expected 404, got ${res.status()}`);
  }),
);

await browser.close();
console.log("\n──────── RINGKASAN ────────");
for (const r of results) console.log(r.join(" "));
process.exit(results.some((r) => r[0] === "❌") ? 1 : 0);
