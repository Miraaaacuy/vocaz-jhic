// Bagikan VocAZ lewat link publik SEMENTARA (Cloudflare quick tunnel).
// Pakai  : node scripts/share.mjs        (hentikan dengan Ctrl+C)
// Syarat : build production sudah ada (.next-prod) dan MySQL/XAMPP menyala.
// Catatan: link hanya hidup selama skrip ini berjalan dan laptop terhubung internet;
//          alamatnya acak dan berganti setiap kali dijalankan.
import { spawn } from "child_process";
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs";
import net from "net";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.SHARE_PORT ?? "3001";
const server = path.join(root, ".next-prod", "standalone", "server.js");

if (!existsSync(server)) {
  console.error("Build production belum ada. Jalankan dulu (Git Bash):\n  NEXT_DIST_DIR=.next-prod npm run build\n  cp -r public .next-prod/standalone/ && cp -r .next-prod/static .next-prod/standalone/.next-prod/");
  process.exit(1);
}

const portBusy = await new Promise((resolve) => {
  const s = net.connect(Number(PORT), "127.0.0.1");
  s.once("connect", () => (s.destroy(), resolve(true)));
  s.once("error", () => resolve(false));
});
if (portBusy) {
  console.error(`Port ${PORT} sedang dipakai. Tutup dulu server yang berjalan di port itu, atau pakai port lain: SHARE_PORT=3002 node scripts/share.mjs`);
  process.exit(1);
}

// cloudflared: pakai yang terpasang, atau unduh sekali ke .tools/ (Windows)
let cloudflared = "cloudflared";
if (process.platform === "win32") {
  cloudflared = path.join(root, ".tools", "cloudflared.exe");
  if (!existsSync(cloudflared)) {
    console.log("Mengunduh cloudflared (sekali saja, ±60 MB)…");
    mkdirSync(path.dirname(cloudflared), { recursive: true });
    const res = await fetch("https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe");
    if (!res.ok || !res.body) {
      console.error("Gagal mengunduh cloudflared:", res.status);
      process.exit(1);
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(cloudflared));
  }
}

let app;
let url;
const stop = () => {
  tunnel.kill();
  app?.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log("Membuka tunnel…");
const tunnel = spawn(cloudflared, ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${PORT}`], { stdio: ["ignore", "pipe", "pipe"] });
tunnel.on("exit", (code) => {
  console.error(`Tunnel berhenti (kode ${code}). Link tidak aktif lagi.`);
  app?.kill();
  process.exit(code ?? 1);
});

const onData = (buf) => {
  const m = String(buf).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!m || url) return;
  url = m[0];
  // server dijalankan setelah alamat publik diketahui, supaya AUTH_URL (login, tautan) memakai alamat itu
  app = spawn(process.execPath, ["--env-file=.env", server], { cwd: root, env: { ...process.env, PORT, HOSTNAME: "127.0.0.1", AUTH_URL: url, AUTH_TRUST_HOST: "true" }, stdio: ["ignore", "ignore", "inherit"] });
  app.on("exit", (code) => {
    console.error(`Server VocAZ berhenti (kode ${code}).`);
    tunnel.kill();
    process.exit(code ?? 1);
  });
  writeFileSync(path.join(root, "..", "share-url.txt"), url + "\n");
  console.log(`\n  VocAZ bisa dibuka di:\n\n    ${url}\n\n  Link aktif selama jendela ini terbuka. Tekan Ctrl+C untuk menutupnya.\n`);
};
tunnel.stdout.on("data", onData);
tunnel.stderr.on("data", onData);
