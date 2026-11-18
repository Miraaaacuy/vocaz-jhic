# VocAZ — Vocational Career A-Z

> **Temukan Pekerjaan. Tunjukkan Kompetensi.**
> Ekosistem karier vokasi yang menghubungkan **Siswa SMK**, **Perusahaan**, **Sekolah/BKK**, **Lembaga Sertifikasi**, dan **Super Admin** dalam satu platform berbasis kepercayaan.

Dibuat untuk **JHIC 2.0** · Didukung oleh JHIC, Jagoan Hosting, Komdigi, Garuda Spark, dan Ngalup.

---

## ✨ Fitur utama

| Area | Fitur |
|---|---|
| 🌍 **Public** | Beranda (mini ecosystem), direktori Talenta SMK, Video Talent Showcase, Lowongan, Perusahaan, About. Guest bisa *explore & preview*; aksi Apply/Save/Contact/Connect → login |
| 🎓 **Siswa** | Dashboard (kelengkapan profil, career readiness, rekomendasi aksi), My Profile (data diri, pendidikan & pengalaman, skill & prestasi, portfolio, sertifikasi, preview), Career Hub (lowongan dengan **% match**, simpan, lamar, lacak status), Video Showcase (explore, my showcase, upload), Talent Network (connect), Messages, Notifikasi, Pengaturan |
| 🏢 **Perusahaan** | Dashboard + grafik, Rekrutmen (aktif/draft/riwayat, form lowongan, pipeline pelamar per tahap), **Smart Talent Match**, Video Showcase feed ala TikTok, Messages, Company Profile, Verifikasi (upload dokumen legal), Tim Rekruter, Talent Preferences |
| 🏫 **Sekolah / BKK** | Dashboard, verifikasi siswa (School Verified), Student Profile + career activity, Career Monitoring (Job Opportunities, Rekomendasi, Status Rekrutmen, Penempatan), Profil Sekolah, Mitra Industri |
| 🏅 **Lembaga Sertifikasi** | Dashboard, Verification Requests & History (verify/reject + catatan), Certificate Records & Detail, Profil Lembaga |
| 🛡️ **Super Admin** | Dashboard, User Management (suspend/aktifkan), Verifikasi Perusahaan (approve/reject), Moderasi Konten (sembunyikan/pulihkan/tangguhkan), Platform Monitoring, System Settings (bobot Smart Match, aturan verifikasi & moderasi, roles & permissions), Admin Profile |

### ⭐ Smart Talent Match
Skor kecocokan **0–100%** yang transparan & dapat dijelaskan (`src/lib/match.ts`, teruji di `match.test.ts`):

| Komponen | Bobot | Cara hitung |
|---|---|---|
| Keahlian | 40 | skill wajib dimiliki × faktor level (Pemula 0.6 · Menengah 0.8 · Mahir 1.0) + bonus skill nilai tambah |
| Program keahlian | 15 | sama = penuh · serumpun (mis. RPL↔TKJ) = sebagian |
| Sertifikasi terverifikasi | 15 | BNSP relevan > Industri > Pelatihan (hanya sertifikat berstatus *Verified*) |
| Pengalaman | 15 | bulan PKL/magang/kerja dibanding syarat minimal |
| Lokasi | 10 | kota sama > provinsi sama > bersedia relokasi · remote = penuh |
| Profil & showcase | 5 | video showcase, portfolio, kelengkapan profil |

Setiap skor disertai alasan ✓/✗ ("Memenuhi keahlian yang dibutuhkan: JavaScript", "Memiliki Sertifikasi BNSP yang relevan", dst.). Bobot dapat diatur Super Admin. Skor yang sama dipakai untuk: urutan pelamar, rekomendasi talent, rekomendasi lowongan siswa, dan rekomendasi BKK.

### 🔗 Alur lintas role
- **Siswa → Lembaga:** upload sertifikat → verification request → verify/reject → badge 🟡 *LSP–BNSP Verified* / 🔵 *Industry Certified* di profil.
- **Perusahaan → Admin:** register → upload dokumen legal → review → ✓ *Verified Company*.
- **Perusahaan → Siswa:** Smart Match / Video Showcase → Contact → Messages → Recruitment.
- **Siswa → BKK:** status lamaran & penempatan (HIRED) otomatis muncul di Career Monitoring sekolah.

---

## 🧱 Tech stack
- **Next.js 15** (App Router, Server Components, Server Actions) + **TypeScript**
- **Tailwind CSS v4** · lucide-react · Recharts · sonner
- **Prisma ORM** + **MySQL / MariaDB**
- **Auth.js v5** (credentials, JWT, proteksi route per role via middleware)
- Upload file ke disk server (mendukung HTTP Range untuk streaming video)
- **Vitest** untuk unit test Smart Match

## 🚀 Menjalankan secara lokal

Prasyarat: Node.js 20+, MySQL/MariaDB (mis. XAMPP).

```bash
npm install
cp .env.example .env          # sesuaikan DATABASE_URL
npx prisma migrate deploy     # buat tabel
npm run db:seed               # isi data demo
npm run dev                   # http://localhost:3000
```

Perintah lain: `npm run build` · `npm test` · `npm run lint` · `node scripts/e2e.mjs` (alur lintas-role) · `node scripts/click-all.mjs` (klik semua link tiap role).

> **Catatan:** `npm run dev` (Turbopack) mengompilasi setiap halaman saat pertama kali dibuka, jadi klik pertama ke halaman baru bisa terasa lambat — progress bar merah di atas layar menandakan halaman sedang dimuat. Untuk demo/penjurian gunakan build production:
> ```bash
> npm run build && npm run start
> ```

### 👤 Akun demo (password: `password123`)

| Role | Email |
|---|---|
| Siswa | `siswa@vocaz.id` |
| Perusahaan | `perusahaan@vocaz.id` (Owner) · `rekruter@vocaz.id` (Recruiter) |
| Sekolah / BKK | `bkk@vocaz.id` |
| Lembaga Sertifikasi | `lsp@vocaz.id` · `industri@vocaz.id` · `pelatihan@vocaz.id` |
| Super Admin | `admin@vocaz.id` |

Di halaman login tersedia tombol pengisian cepat akun demo.

## 🌐 Deploy
Lihat **[DEPLOY.md](DEPLOY.md)** untuk panduan deploy ke VPS Jagoan Hosting (Webuzo) dengan PM2 + reverse proxy + SSL.

## 📁 Struktur
```
prisma/            schema.prisma, migrations, seed.ts
src/app/(public)   halaman publik
src/app/(auth)     login & registrasi (wizard perusahaan 4 langkah)
src/app/student    area siswa        src/app/company     area perusahaan
src/app/school     area BKK          src/app/institution area lembaga
src/app/admin      area super admin  src/app/api         auth, file, polling pesan
src/components     UI, kartu, badge, views bersama (profil, lowongan, pesan…)
src/lib            auth, db, match (Smart Match), storage, notify, settings
src/server         server actions & query per domain
```

## 🖼️ Kredit media demo
Foto profil dari randomuser.me, gambar portfolio dari Unsplash, dan video showcase demo dari Pexels (lisensi gratis) — hanya untuk data contoh.
