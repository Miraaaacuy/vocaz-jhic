// Runs Lighthouse (mobile + desktop) against a running production server and prints the scores.
// Usage: node scripts/lighthouse.mjs [baseUrl] [path1 path2 ...]
// Needs Chrome or Edge; set CHROME_PATH if it isn't found automatically.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:3001";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/talenta", "/lowongan", "/login"];
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const env = { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? (existsSync(edge) ? edge : undefined) };
mkdirSync("../shots/lh", { recursive: true });

for (const p of paths) {
  for (const mode of process.env.LH_MODES?.split(",") ?? ["mobile", "desktop"]) {
    const out = `../shots/lh/${p === "/" ? "home" : p.replaceAll("/", "")}-${mode}.json`;
    const args = ["-y", "lighthouse@13", base + p, "--quiet", "--chrome-flags=--headless=new", "--output=json", `--output-path=${out}`];
    if (mode === "desktop") args.push("--preset=desktop");
    // slow dev laptops: Lighthouse recommends a lower CPU multiplier (LH_CPU=2) so mobile scores match PageSpeed Insights servers
    else if (process.env.LH_CPU) args.push(`--throttling.cpuSlowdownMultiplier=${process.env.LH_CPU}`);
    try {
      execFileSync("npx", args, { env, stdio: "ignore", shell: true });
    } catch {
      /* lighthouse exits non-zero on some warnings; the report is still written */
    }
    const r = JSON.parse(readFileSync(out, "utf8"));
    const s = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
    const a = r.audits;
    console.log(
      `${p.padEnd(10)} ${mode.padEnd(8)} Perf ${String(s("performance")).padStart(3)}  A11y ${s("accessibility")}  BP ${s("best-practices")}  SEO ${s("seo")}  | LCP ${a["largest-contentful-paint"].displayValue}  TBT ${a["total-blocking-time"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}`,
    );
  }
}
