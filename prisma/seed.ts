import { PrismaClient, type ApplicationStatus, type CertificateType, type ExperienceType, type JobType, type SkillLevel, type WorkMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ── deterministic PRNG so every seed run yields the same demo data ──
let _s = 20261001;
const rand = () => {
  _s = (_s * 1664525 + 1013904223) % 4294967296;
  return _s / 4294967296;
};
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
const pickN = <T,>(a: T[], n: number) => [...a].sort(() => rand() - 0.5).slice(0, n);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const monthsAgo = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const CITY_PROV: Record<string, string> = {
  Malang: "Jawa Timur",
  Surabaya: "Jawa Timur",
  Sidoarjo: "Jawa Timur",
  Batu: "Jawa Timur",
  Kediri: "Jawa Timur",
  Semarang: "Jawa Tengah",
  Bandung: "Jawa Barat",
  Bekasi: "Jawa Barat",
  Jakarta: "DKI Jakarta",
  Yogyakarta: "DI Yogyakarta",
};

// ───────────────────────── MAJORS → skills ─────────────────────────
const RPL = "Rekayasa Perangkat Lunak";
const TKJ = "Teknik Komputer dan Jaringan";
const DKV = "Desain Komunikasi Visual";
const TKR = "Teknik Kendaraan Ringan";
const LAS = "Teknik Pengelasan";
const TPM = "Teknik Pemesinan";
const MEK = "Teknik Mekatronika";
const AKL = "Akuntansi dan Keuangan Lembaga";
const HTL = "Perhotelan";
const KUL = "Kuliner";
const BDP = "Bisnis Daring dan Pemasaran";

const MAJOR_SKILLS: Record<string, string[]> = {
  [RPL]: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "PHP", "Laravel", "MySQL", "Git", "HTML/CSS", "Tailwind CSS", "Flutter", "Python", "REST API", "Figma"],
  [TKJ]: ["Jaringan Komputer", "Mikrotik", "Cisco", "Linux", "Troubleshooting", "Fiber Optik", "Server Administration", "Cloud Computing", "Keamanan Jaringan"],
  [DKV]: ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Desain Grafis", "UI/UX", "Video Editing", "Premiere Pro", "Fotografi", "Motion Graphics"],
  [TKR]: ["Perawatan Mesin", "Kelistrikan Otomotif", "Engine Tune Up", "Chasis & Pemindah Daya", "Diagnostic Scanner", "K3"],
  [LAS]: ["Las SMAW", "Las MIG/MAG", "Las TIG", "Membaca Gambar Teknik", "K3"],
  [TPM]: ["Mesin Bubut", "CNC", "AutoCAD", "Membaca Gambar Teknik", "K3"],
  [MEK]: ["PLC", "Pneumatik", "Arduino", "Elektronika Dasar", "AutoCAD", "K3"],
  [AKL]: ["Microsoft Excel", "Akuntansi Dasar", "MYOB", "Perpajakan", "Accurate"],
  [HTL]: ["Front Office", "Housekeeping", "Bahasa Inggris", "Customer Service", "Food & Beverage Service"],
  [KUL]: ["Pastry", "Food Production", "Food Safety", "Food & Beverage Service", "K3"],
  [BDP]: ["Digital Marketing", "Social Media", "Copywriting", "Canva", "Customer Service", "SEO"],
};

const SKILL_CATEGORY: Record<string, string> = {};
for (const [m, list] of Object.entries(MAJOR_SKILLS)) for (const s of list) SKILL_CATEGORY[s] ??= m;

const HEADLINE: Record<string, string[]> = {
  [RPL]: ["Frontend Developer", "Fullstack Web Developer", "Backend Developer", "Mobile Developer (Flutter)", "Junior Software Engineer"],
  [TKJ]: ["Network Technician", "IT Support Specialist", "Junior Network Engineer", "System Administrator"],
  [DKV]: ["Graphic Designer", "UI/UX Designer", "Video Editor & Motion Designer", "Visual Content Creator"],
  [TKR]: ["Mekanik Otomotif", "Teknisi Kendaraan Ringan", "Service Advisor Junior"],
  [LAS]: ["Welder SMAW/MIG", "Juru Las Bersertifikat", "Fabrication Welder"],
  [TPM]: ["Operator CNC", "Machinist", "Drafter Mesin"],
  [MEK]: ["Teknisi Mekatronika", "PLC Programmer Junior", "Maintenance Technician"],
  [AKL]: ["Staff Akuntansi", "Admin Keuangan", "Junior Accountant"],
  [HTL]: ["Front Office Agent", "Room Attendant", "Guest Service Agent"],
  [KUL]: ["Commis Cook", "Pastry Cook", "Kitchen Helper"],
  [BDP]: ["Digital Marketing Specialist", "Social Media Admin", "Content Writer"],
};

const VIDEOS: Record<string, { url: string; title: string }[]> = {
  [RPL]: [
    { url: "https://videos.pexels.com/video-files/5495845/5495845-hd_1280_720_30fps.mp4", title: "Membangun REST API dengan Node.js dalam 60 detik" },
    { url: "https://videos.pexels.com/video-files/6330778/6330778-hd_1280_720_30fps.mp4", title: "Live coding: Dashboard React + Tailwind" },
    { url: "https://videos.pexels.com/video-files/6330779/6330779-hd_1280_720_30fps.mp4", title: "Refactor kode Laravel jadi lebih bersih" },
    { url: "https://videos.pexels.com/video-files/2516162/2516162-hd_1280_720_24fps.mp4", title: "Demo aplikasi kasir Flutter untuk UMKM" },
  ],
  [TKJ]: [{ url: "https://videos.pexels.com/video-files/3129671/3129671-hd_1280_720_30fps.mp4", title: "Konfigurasi jaringan kantor dengan Mikrotik" }],
  [DKV]: [
    { url: "https://videos.pexels.com/video-files/7989707/7989707-hd_1280_720_25fps.mp4", title: "Proses desain logo UMKM dari sketsa ke final" },
    { url: "https://videos.pexels.com/video-files/4465903/4465903-hd_1280_720_50fps.mp4", title: "Digital illustration dengan pen tablet" },
    { url: "https://videos.pexels.com/video-files/5475072/5475072-hd_720_1280_30fps.mp4", title: "Speed drawing karakter maskot sekolah" },
  ],
  [LAS]: [
    { url: "https://videos.pexels.com/video-files/6467725/6467725-hd_1280_720_25fps.mp4", title: "Teknik las SMAW posisi 3G" },
    { url: "https://videos.pexels.com/video-files/4941357/4941357-hd_1280_720_50fps.mp4", title: "Pengelasan MIG pada plat baja 6mm" },
    { url: "https://videos.pexels.com/video-files/14314931/14314931-hd_1280_720_50fps.mp4", title: "Fabrikasi rangka besi di bengkel sekolah" },
  ],
  [TKR]: [{ url: "https://videos.pexels.com/video-files/8986474/8986474-hd_1280_720_30fps.mp4", title: "Pengecekan mesin & tune up kendaraan" }],
  [KUL]: [{ url: "https://videos.pexels.com/video-files/3196344/3196344-hd_1280_720_25fps.mp4", title: "Membuat pizza artisan dari adonan sendiri" }],
};

// ───────────────────────── names ─────────────────────────
const MALE = ["Muhammad", "Ahmad", "Rizky", "Dimas", "Fajar", "Bagus", "Aditya", "Naufal", "Reza", "Farhan", "Yoga", "Galih", "Ilham", "Bima", "Arif", "Hendra", "Kevin", "Raka", "Satria", "Wahyu"];
const FEMALE = ["Siti", "Aulia", "Nabila", "Putri", "Dewi", "Anisa", "Maya", "Rina", "Salsabila", "Intan", "Citra", "Fitri", "Ayu", "Lestari", "Zahra", "Nadia", "Tiara", "Kirana"];
const LAST = ["Pratama", "Saputra", "Wijaya", "Hidayat", "Nugroho", "Santoso", "Ramadhan", "Kurniawan", "Maharani", "Permata", "Lestari", "Firmansyah", "Setiawan", "Anggraini", "Kusuma", "Wibowo", "Rahmawati", "Putra"];

async function main() {
  console.log("🧹 Membersihkan data lama…");
  // order matters for FK constraints
  await db.$transaction([
    db.message.deleteMany(),
    db.conversationParticipant.deleteMany(),
    db.conversation.deleteMany(),
    db.notification.deleteMany(),
    db.report.deleteMany(),
    db.activityLog.deleteMany(),
    db.application.deleteMany(),
    db.savedJob.deleteMany(),
    db.savedTalent.deleteMany(),
    db.job.deleteMany(),
    db.certificate.deleteMany(),
    db.showcaseVideo.deleteMany(),
    db.portfolioItem.deleteMany(),
    db.achievement.deleteMany(),
    db.experience.deleteMany(),
    db.education.deleteMany(),
    db.studentSkill.deleteMany(),
    db.skill.deleteMany(),
    db.connection.deleteMany(),
    db.studentProfile.deleteMany(),
    db.industryPartner.deleteMany(),
    db.talentPreference.deleteMany(),
    db.companyVerification.deleteMany(),
    db.companyDocument.deleteMany(),
    db.companyMember.deleteMany(),
    db.company.deleteMany(),
    db.school.deleteMany(),
    db.institution.deleteMany(),
    db.systemSetting.deleteMany(),
    db.user.deleteMany(),
  ]);

  const hash = await bcrypt.hash("password123", 10);

  // ───────── skills ─────────
  const allSkills = Object.keys(SKILL_CATEGORY);
  await db.skill.createMany({ data: allSkills.map((name) => ({ name, category: SKILL_CATEGORY[name] })) });
  const skillRows = await db.skill.findMany();
  const skillId = Object.fromEntries(skillRows.map((s) => [s.name, s.id]));

  // ───────── admin ─────────
  const admin = await db.user.create({
    data: { email: "admin@vocaz.id", passwordHash: hash, name: "Super Admin VocAZ", role: "ADMIN", avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg" },
  });

  // ───────── settings ─────────
  await db.systemSetting.createMany({
    data: [
      { key: "match.weights", value: { skills: 40, major: 15, certification: 15, experience: 15, location: 10, profile: 5 } },
      { key: "platform", value: { name: "VocAZ", maintenance: false, allowRegistration: true, maxVideoMB: 100 } },
      { key: "moderation", value: { autoHideThreshold: 3, requireVideoReview: false } },
      { key: "verification", value: { requiredDocs: ["NIB", "NPWP"], certAutoApprove: false } },
    ],
  });

  // ───────── institutions ─────────
  console.log("🏅 Lembaga sertifikasi…");
  const instDefs = [
    { email: "lsp@vocaz.id", name: "LSP Teknologi Digital Nusantara", type: "LSP_BNSP" as const, city: "Malang", acc: "BNSP-LSP-1234-ID", scopes: ["Pemrograman Web", "Jaringan Komputer", "Desain Grafis", "Pengelasan", "Otomotif"], contact: "Drs. Hadi Susanto" },
    { email: "industri@vocaz.id", name: "Nusantara Industry Certification Center", type: "INDUSTRY" as const, city: "Jakarta", acc: "NICC-2024-017", scopes: ["Cloud Computing", "Networking", "Digital Marketing", "Akuntansi"], contact: "Ratna Kusumawati" },
    { email: "pelatihan@vocaz.id", name: "Balai Pelatihan Vokasi Mandiri", type: "TRAINING" as const, city: "Surabaya", acc: "BLK-JTM-0331", scopes: ["Perhotelan", "Kuliner", "Otomotif", "Mekatronika"], contact: "Agus Prasetyo" },
  ];
  const institutions = [];
  for (const d of instDefs) {
    const u = await db.user.create({ data: { email: d.email, passwordHash: hash, name: d.contact, role: "INSTITUTION" } });
    institutions.push(
      await db.institution.create({
        data: {
          userId: u.id,
          slug: slug(d.name),
          name: d.name,
          type: d.type,
          accreditationNumber: d.acc,
          city: d.city,
          address: `Jl. Veteran No. ${int(1, 120)}, ${d.city}`,
          website: `https://${slug(d.name).slice(0, 18)}.id`,
          description: `${d.name} adalah lembaga ${d.type === "LSP_BNSP" ? "sertifikasi profesi berlisensi BNSP" : d.type === "INDUSTRY" ? "sertifikasi industri" : "pelatihan vokasi"} yang berfokus pada peningkatan kompetensi tenaga kerja muda Indonesia.`,
          scopes: d.scopes,
        },
      }),
    );
  }
  const [lsp, nicc, blk] = institutions;

  // ───────── schools ─────────
  console.log("🏫 Sekolah / BKK…");
  const schoolDefs = [
    { email: "bkk@vocaz.id", name: "SMK Nusantara 1 Malang", city: "Malang", programs: [RPL, TKJ, DKV, TKR, AKL], head: "Bu Endang Sulistyowati" },
    { email: "bkk.surabaya@vocaz.id", name: "SMK Teknologi Surabaya", city: "Surabaya", programs: [LAS, TPM, MEK, TKR, RPL], head: "Pak Bambang Hermanto" },
    { email: "bkk.bandung@vocaz.id", name: "SMK Kreatif Bandung", city: "Bandung", programs: [DKV, RPL, BDP, AKL], head: "Bu Rina Marlina" },
    { email: "bkk.semarang@vocaz.id", name: "SMK Pariwisata Semarang", city: "Semarang", programs: [HTL, KUL, BDP], head: "Pak Joko Santoso" },
    { email: "bkk.jakarta@vocaz.id", name: "SMK Bina Karya Jakarta", city: "Jakarta", programs: [TKJ, RPL, AKL, BDP], head: "Bu Sri Wahyuni" },
  ];
  const schools = [];
  for (const d of schoolDefs) {
    const u = await db.user.create({ data: { email: d.email, passwordHash: hash, name: d.head, role: "SCHOOL" } });
    schools.push(
      await db.school.create({
        data: {
          userId: u.id,
          slug: slug(d.name),
          name: d.name,
          npsn: String(20500000 + int(1000, 9999)),
          city: d.city,
          province: CITY_PROV[d.city],
          address: `Jl. Pendidikan No. ${int(1, 99)}, ${d.city}`,
          website: `https://${slug(d.name)}.sch.id`,
          description: `${d.name} adalah sekolah menengah kejuruan dengan fokus pada pembelajaran berbasis industri (link & match), teaching factory, dan program PKL bersama mitra industri.`,
          programs: d.programs,
          bkkName: `BKK ${d.name}`,
          bkkHead: d.head,
          bkkEmail: d.email,
          bkkPhone: `08${int(1100000000, 1399999999)}`,
        },
      }),
    );
  }

  // ───────── companies ─────────
  console.log("🏢 Perusahaan…");
  const companyDefs = [
    { email: "perusahaan@vocaz.id", owner: "Andi Wijaya", pos: "HR Manager", name: "PT Teknologi Nusantara", industry: "Teknologi Informasi", city: "Malang", size: "51–200", status: "VERIFIED", desc: "Perusahaan pengembang perangkat lunak yang membangun solusi digital untuk pendidikan, UMKM, dan pemerintahan. Kami percaya talenta SMK mampu bersaing di industri teknologi." },
    { email: "hr@digitalkreatif.id", owner: "Sarah Amelia", pos: "Talent Acquisition", name: "PT Digital Kreatif Indonesia", industry: "Kreatif & Media", city: "Jakarta", size: "11–50", status: "VERIFIED", desc: "Creative agency yang menangani branding, konten digital, dan produksi video untuk brand nasional." },
    { email: "hr@otomotifmaju.id", owner: "Budi Hartono", pos: "HRD", name: "PT Otomotif Maju Bersama", industry: "Otomotif", city: "Surabaya", size: "201–500", status: "VERIFIED", desc: "Jaringan bengkel resmi dan pusat servis kendaraan ringan dengan 24 cabang di Jawa Timur." },
    { email: "hr@bajapresisi.id", owner: "Hendra Gunawan", pos: "Plant HR", name: "PT Baja Presisi Indonesia", industry: "Manufaktur", city: "Sidoarjo", size: "501–1000", status: "VERIFIED", desc: "Produsen komponen baja dan fabrikasi struktur untuk industri konstruksi dan energi." },
    { email: "hr@solusijaringan.id", owner: "Dwi Prasetyo", pos: "Owner", name: "CV Solusi Jaringan Mandiri", industry: "Telekomunikasi", city: "Malang", size: "11–50", status: "VERIFIED", desc: "Penyedia layanan instalasi jaringan, fiber optik, dan managed IT service untuk perkantoran dan sekolah." },
    { email: "hr@grandarjuna.id", owner: "Melati Kusuma", pos: "HR Supervisor", name: "Hotel Grand Arjuna Malang", industry: "Perhotelan & Pariwisata", city: "Malang", size: "201–500", status: "VERIFIED", desc: "Hotel bintang 4 di pusat Kota Malang dengan 180 kamar, ballroom, dan restoran internasional." },
    { email: "hr@rasanusantara.id", owner: "Yusuf Maulana", pos: "HR Manager", name: "PT Rasa Nusantara Kuliner", industry: "Perhotelan & Pariwisata", city: "Surabaya", size: "51–200", status: "VERIFIED", desc: "Grup restoran dan central kitchen yang menyajikan kuliner nusantara modern." },
    { email: "hr@niagadaring.id", owner: "Clara Wulandari", pos: "People Ops", name: "PT Niaga Daring Sejahtera", industry: "Retail & E-Commerce", city: "Bandung", size: "51–200", status: "VERIFIED", desc: "E-commerce enabler yang membantu UMKM berjualan online di berbagai marketplace." },
    { email: "hr@mekatronika.id", owner: "Irwan Setiadi", pos: "HR & GA", name: "PT Mekatronika Industri Jaya", industry: "Manufaktur", city: "Bekasi", size: "201–500", status: "VERIFIED", desc: "Integrator sistem otomasi industri: PLC, robotik, dan pemeliharaan mesin produksi." },
    { email: "hr@sinergifinansial.id", owner: "Diana Puspita", pos: "Partner", name: "KAP Sinergi Finansial", industry: "Keuangan & Perbankan", city: "Semarang", size: "11–50", status: "PENDING", desc: "Kantor akuntan publik yang melayani audit, perpajakan, dan konsultasi keuangan UMKM." },
    { email: "hr@cloudnesia.id", owner: "Rendy Saputra", pos: "CTO", name: "PT Cloudnesia Teknologi", industry: "Teknologi Informasi", city: "Bandung", size: "11–50", status: "PENDING", desc: "Startup cloud hosting & DevOps yang membantu bisnis migrasi ke cloud." },
    { email: "hr@logistikcepat.id", owner: "Taufik Hidayat", pos: "HR", name: "PT Logistik Cepat Indonesia", industry: "Logistik", city: "Surabaya", size: "501–1000", status: "UNVERIFIED", desc: "Perusahaan logistik dan ekspedisi dengan jaringan gudang di seluruh Jawa." },
  ] as const;

  const companies = [];
  for (const [i, d] of companyDefs.entries()) {
    const u = await db.user.create({
      data: { email: d.email, passwordHash: hash, name: d.owner, role: "COMPANY", avatarUrl: `https://randomuser.me/api/portraits/${i % 2 ? "women" : "men"}/${30 + i}.jpg`, createdAt: daysAgo(int(20, 180)) },
    });
    const c = await db.company.create({
      data: {
        slug: slug(d.name),
        name: d.name,
        industry: d.industry,
        size: d.size,
        city: d.city,
        province: CITY_PROV[d.city],
        address: `Jl. ${pick(["Soekarno Hatta", "Ahmad Yani", "Diponegoro", "Gatot Subroto", "Sudirman"])} No. ${int(1, 200)}, ${d.city}`,
        website: `https://www.${slug(d.name).replace(/^(pt|cv|kap)-/, "")}.co.id`,
        email: d.email,
        phone: `(0${int(21, 341)}) ${int(100000, 999999)}`,
        description: d.desc + " Kami aktif membuka kesempatan PKL, magang, dan rekrutmen lulusan SMK melalui VocAZ.",
        foundedYear: int(1995, 2019),
        nib: String(int(1000000000, 9999999999)) + "123",
        npwp: `0${int(1, 9)}.${int(100, 999)}.${int(100, 999)}.${int(1, 9)}-${int(100, 999)}.000`,
        verificationStatus: d.status,
        verifiedAt: d.status === "VERIFIED" ? daysAgo(int(20, 200)) : null,
        members: { create: { userId: u.id, role: "OWNER", position: d.pos } },
      },
    });
    if (d.status !== "UNVERIFIED") {
      await db.companyDocument.createMany({
        data: [
          { companyId: c.id, type: "NIB", fileName: "NIB.pdf", fileUrl: "/demo/dokumen-contoh.pdf" },
          { companyId: c.id, type: "NPWP", fileName: "NPWP-Perusahaan.pdf", fileUrl: "/demo/dokumen-contoh.pdf" },
          { companyId: c.id, type: "AKTA", fileName: "Akta-Pendirian.pdf", fileUrl: "/demo/dokumen-contoh.pdf" },
        ],
      });
      await db.companyVerification.create({
        data: {
          companyId: c.id,
          status: d.status,
          message: "Mohon verifikasi akun perusahaan kami. Dokumen legal terlampir.",
          reviewerId: d.status === "VERIFIED" ? admin.id : null,
          reviewNote: d.status === "VERIFIED" ? "Dokumen lengkap dan valid." : null,
          submittedAt: d.status === "VERIFIED" ? daysAgo(int(210, 260)) : daysAgo(int(1, 4)),
          reviewedAt: d.status === "VERIFIED" ? daysAgo(int(20, 200)) : null,
        },
      });
    }
    companies.push(c);
  }
  // second recruiter for demo company (Company Team)
  const rec2 = await db.user.create({
    data: { email: "rekruter@vocaz.id", passwordHash: hash, name: "Fitri Handayani", role: "COMPANY", avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
  });
  await db.companyMember.create({ data: { companyId: companies[0].id, userId: rec2.id, role: "RECRUITER", position: "Technical Recruiter" } });

  // talent preferences
  const prefByIndustry: Record<string, { skills: string[]; majors: string[] }> = {
    "Teknologi Informasi": { skills: ["JavaScript", "React", "Laravel", "MySQL", "Git"], majors: [RPL, TKJ] },
    "Kreatif & Media": { skills: ["Figma", "Adobe Illustrator", "Video Editing", "UI/UX"], majors: [DKV] },
    Otomotif: { skills: ["Perawatan Mesin", "Kelistrikan Otomotif", "Engine Tune Up"], majors: [TKR] },
    Manufaktur: { skills: ["Las SMAW", "Las MIG/MAG", "Membaca Gambar Teknik", "K3", "PLC"], majors: [LAS, TPM, MEK] },
    Telekomunikasi: { skills: ["Mikrotik", "Fiber Optik", "Jaringan Komputer", "Linux"], majors: [TKJ] },
    "Perhotelan & Pariwisata": { skills: ["Front Office", "Bahasa Inggris", "Food & Beverage Service", "Food Production"], majors: [HTL, KUL] },
    "Retail & E-Commerce": { skills: ["Digital Marketing", "Social Media", "Copywriting", "Canva"], majors: [BDP] },
    "Keuangan & Perbankan": { skills: ["Microsoft Excel", "Akuntansi Dasar", "Perpajakan"], majors: [AKL] },
    Logistik: { skills: ["Microsoft Excel", "Customer Service"], majors: [AKL, BDP] },
  };
  for (const c of companies) {
    const p = prefByIndustry[c.industry!];
    await db.talentPreference.create({
      data: {
        companyId: c.id,
        skills: p.skills,
        majors: p.majors,
        locations: [c.city!, c.province!],
        minExperienceMonths: pick([0, 3, 6]),
        certification: pick(["ANY", "ANY", "BNSP"] as const),
        jobTypes: ["FULL_TIME", "INTERNSHIP"],
      },
    });
  }

  // ───────── jobs ─────────
  console.log("💼 Lowongan…");
  type JobT = { title: string; dept: string; type: JobType; req: string[]; nice: string[]; majors: string[]; exp: number; cert: "ANY" | "BNSP" | "INDUSTRY"; sal: [number, number] };
  const JOBS: Record<string, JobT[]> = {
    "Teknologi Informasi": [
      { title: "Frontend Developer", dept: "Engineering", type: "FULL_TIME", req: ["JavaScript", "React", "HTML/CSS", "Git"], nice: ["TypeScript", "Tailwind CSS", "Next.js"], majors: [RPL], exp: 6, cert: "ANY", sal: [4500000, 7000000] },
      { title: "Backend Developer (Laravel)", dept: "Engineering", type: "FULL_TIME", req: ["PHP", "Laravel", "MySQL", "Git"], nice: ["REST API", "Node.js"], majors: [RPL], exp: 6, cert: "ANY", sal: [5000000, 7500000] },
      { title: "Magang Mobile Developer", dept: "Engineering", type: "INTERNSHIP", req: ["Flutter", "Git"], nice: ["REST API", "Figma"], majors: [RPL], exp: 0, cert: "ANY", sal: [1500000, 2500000] },
      { title: "IT Support", dept: "IT Operations", type: "FULL_TIME", req: ["Troubleshooting", "Jaringan Komputer", "Linux"], nice: ["Mikrotik"], majors: [TKJ, RPL], exp: 0, cert: "ANY", sal: [3800000, 5000000] },
      { title: "Junior DevOps Engineer", dept: "Infrastructure", type: "FULL_TIME", req: ["Linux", "Cloud Computing", "Git"], nice: ["Node.js", "Keamanan Jaringan"], majors: [TKJ, RPL], exp: 6, cert: "INDUSTRY", sal: [6000000, 9000000] },
    ],
    "Kreatif & Media": [
      { title: "UI/UX Designer", dept: "Design", type: "FULL_TIME", req: ["Figma", "UI/UX"], nice: ["Adobe Illustrator", "Desain Grafis"], majors: [DKV, RPL], exp: 6, cert: "ANY", sal: [4500000, 6500000] },
      { title: "Graphic Designer", dept: "Creative", type: "FULL_TIME", req: ["Adobe Photoshop", "Adobe Illustrator", "Desain Grafis"], nice: ["Motion Graphics"], majors: [DKV], exp: 0, cert: "ANY", sal: [4000000, 5500000] },
      { title: "Video Editor (Magang)", dept: "Production", type: "INTERNSHIP", req: ["Video Editing", "Premiere Pro"], nice: ["Motion Graphics", "Fotografi"], majors: [DKV], exp: 0, cert: "ANY", sal: [1500000, 2500000] },
    ],
    Otomotif: [
      { title: "Mekanik Kendaraan Ringan", dept: "Service", type: "FULL_TIME", req: ["Perawatan Mesin", "Engine Tune Up", "Kelistrikan Otomotif"], nice: ["Diagnostic Scanner"], majors: [TKR], exp: 6, cert: "BNSP", sal: [3800000, 5200000] },
      { title: "PKL Teknisi Bengkel", dept: "Service", type: "PKL", req: ["Perawatan Mesin"], nice: ["K3"], majors: [TKR], exp: 0, cert: "ANY", sal: [800000, 1200000] },
      { title: "Teknisi Kelistrikan Otomotif", dept: "Service", type: "FULL_TIME", req: ["Kelistrikan Otomotif", "Diagnostic Scanner"], nice: ["Engine Tune Up"], majors: [TKR, MEK], exp: 12, cert: "BNSP", sal: [4500000, 6000000] },
    ],
    Manufaktur: [
      { title: "Welder SMAW / MIG", dept: "Fabrication", type: "FULL_TIME", req: ["Las SMAW", "Las MIG/MAG", "K3"], nice: ["Membaca Gambar Teknik", "Las TIG"], majors: [LAS], exp: 6, cert: "BNSP", sal: [4200000, 6000000] },
      { title: "Operator CNC", dept: "Machining", type: "FULL_TIME", req: ["CNC", "Mesin Bubut", "Membaca Gambar Teknik"], nice: ["AutoCAD"], majors: [TPM], exp: 6, cert: "ANY", sal: [4200000, 5500000] },
      { title: "Maintenance Technician (PLC)", dept: "Maintenance", type: "FULL_TIME", req: ["PLC", "Pneumatik", "Elektronika Dasar"], nice: ["Arduino", "K3"], majors: [MEK], exp: 6, cert: "ANY", sal: [4800000, 6500000] },
      { title: "Magang Drafter AutoCAD", dept: "Engineering", type: "INTERNSHIP", req: ["AutoCAD", "Membaca Gambar Teknik"], nice: [], majors: [TPM, MEK], exp: 0, cert: "ANY", sal: [1800000, 2500000] },
    ],
    Telekomunikasi: [
      { title: "Teknisi Jaringan Fiber Optik", dept: "Field Ops", type: "FULL_TIME", req: ["Fiber Optik", "Jaringan Komputer"], nice: ["Mikrotik", "K3"], majors: [TKJ], exp: 0, cert: "ANY", sal: [3500000, 4800000] },
      { title: "Network Engineer Junior", dept: "NOC", type: "FULL_TIME", req: ["Mikrotik", "Cisco", "Jaringan Komputer"], nice: ["Linux", "Keamanan Jaringan"], majors: [TKJ], exp: 6, cert: "INDUSTRY", sal: [4500000, 6500000] },
    ],
    "Perhotelan & Pariwisata": [
      { title: "Front Office Agent", dept: "Front Office", type: "FULL_TIME", req: ["Front Office", "Bahasa Inggris", "Customer Service"], nice: [], majors: [HTL], exp: 0, cert: "ANY", sal: [3500000, 4500000] },
      { title: "Commis Cook", dept: "Kitchen", type: "FULL_TIME", req: ["Food Production", "Food Safety"], nice: ["Pastry"], majors: [KUL], exp: 6, cert: "ANY", sal: [3500000, 4500000] },
      { title: "Magang Housekeeping", dept: "Housekeeping", type: "INTERNSHIP", req: ["Housekeeping"], nice: ["Bahasa Inggris"], majors: [HTL], exp: 0, cert: "ANY", sal: [1200000, 1800000] },
    ],
    "Retail & E-Commerce": [
      { title: "Digital Marketing Staff", dept: "Marketing", type: "FULL_TIME", req: ["Digital Marketing", "Social Media", "Copywriting"], nice: ["SEO", "Canva"], majors: [BDP], exp: 0, cert: "ANY", sal: [3800000, 5000000] },
      { title: "Admin Marketplace", dept: "Operations", type: "FULL_TIME", req: ["Customer Service", "Microsoft Excel"], nice: ["Canva"], majors: [BDP, AKL], exp: 0, cert: "ANY", sal: [3300000, 4200000] },
    ],
    "Keuangan & Perbankan": [
      { title: "Staff Akuntansi Junior", dept: "Audit", type: "FULL_TIME", req: ["Akuntansi Dasar", "Microsoft Excel"], nice: ["Perpajakan", "MYOB"], majors: [AKL], exp: 0, cert: "ANY", sal: [3800000, 4800000] },
    ],
    Logistik: [{ title: "Admin Gudang", dept: "Warehouse", type: "FULL_TIME", req: ["Microsoft Excel"], nice: ["Customer Service"], majors: [AKL, BDP], exp: 0, cert: "ANY", sal: [3300000, 4000000] }],
  };

  const jobs = [];
  for (const [ci, c] of companies.entries()) {
    const templates = JOBS[c.industry!];
    const n = ci === 0 ? templates.length : Math.min(templates.length, int(2, 3));
    const chosen = ci === 0 ? templates : pickN(templates, n);
    for (const [ti, t] of chosen.entries()) {
      const status = ci === 11 ? "ACTIVE" : ti === chosen.length - 1 && ci % 3 === 0 && ci !== 0 ? "CLOSED" : "ACTIVE";
      const published = daysAgo(int(1, 40));
      const mode: WorkMode = c.industry === "Teknologi Informasi" ? pick(["ONSITE", "HYBRID", "REMOTE", "HYBRID"] as const) : "ONSITE";
      jobs.push(
        await db.job.create({
          data: {
            companyId: c.id,
            createdById: (await db.companyMember.findFirst({ where: { companyId: c.id, role: "OWNER" } }))!.userId,
            title: t.title,
            department: t.dept,
            type: t.type,
            workMode: mode,
            city: c.city,
            province: c.province,
            salaryMin: t.sal[0],
            salaryMax: t.sal[1],
            description: `${c.name} membuka posisi ${t.title} untuk bergabung dengan tim ${t.dept}. Kamu akan bekerja bersama tim berpengalaman, mendapatkan mentoring, dan berkesempatan mengembangkan karier di industri ${c.industry?.toLowerCase()}.`,
            responsibilities: [
              `Menjalankan tugas harian sebagai ${t.title} sesuai SOP perusahaan`,
              `Berkolaborasi dengan tim ${t.dept} untuk mencapai target`,
              "Membuat laporan pekerjaan secara berkala",
              "Terus belajar dan mengembangkan kompetensi teknis",
            ].join("\n"),
            requirements: [
              `Lulusan SMK ${t.majors.join(" / ")} atau sederajat`,
              `Menguasai ${t.req.join(", ")}`,
              t.exp ? `Pengalaman minimal ${t.exp} bulan (termasuk PKL/magang)` : "Fresh graduate dipersilakan melamar",
              t.cert === "BNSP" ? "Diutamakan memiliki sertifikat kompetensi BNSP" : "Memiliki sertifikat kompetensi menjadi nilai tambah",
              "Disiplin, jujur, dan mampu bekerja dalam tim",
            ].join("\n"),
            benefits: ["BPJS Kesehatan & Ketenagakerjaan", "Pelatihan & sertifikasi", "Tunjangan transport & makan", "Jenjang karier yang jelas"].join("\n"),
            requiredSkills: t.req,
            niceSkills: t.nice,
            majors: t.majors,
            minExperienceMonths: t.exp,
            certification: t.cert,
            quota: int(1, 5),
            deadline: new Date(Date.now() + int(10, 45) * 86400000),
            status,
            views: int(40, 900),
            publishedAt: published,
            closedAt: status === "CLOSED" ? daysAgo(2) : null,
            createdAt: published,
          },
        }),
      );
    }
  }
  // drafts for demo company
  await db.job.create({
    data: {
      companyId: companies[0].id,
      title: "Data Analyst Junior",
      department: "Data",
      type: "FULL_TIME",
      workMode: "HYBRID",
      city: "Malang",
      province: "Jawa Timur",
      salaryMin: 5000000,
      salaryMax: 7000000,
      description: "Draft lowongan Data Analyst untuk tim Data.",
      requiredSkills: ["Python", "MySQL", "Microsoft Excel"],
      niceSkills: [],
      majors: [RPL],
      status: "DRAFT",
    },
  });

  // ───────── students ─────────
  console.log("🎓 Siswa / talent…");
  const majorPlan: { major: string; school: number; count: number }[] = [
    { major: RPL, school: 0, count: 7 },
    { major: TKJ, school: 0, count: 3 },
    { major: DKV, school: 0, count: 2 },
    { major: TKR, school: 0, count: 2 },
    { major: AKL, school: 0, count: 1 },
    { major: LAS, school: 1, count: 4 },
    { major: TPM, school: 1, count: 2 },
    { major: MEK, school: 1, count: 2 },
    { major: TKR, school: 1, count: 2 },
    { major: RPL, school: 1, count: 1 },
    { major: DKV, school: 2, count: 3 },
    { major: RPL, school: 2, count: 2 },
    { major: BDP, school: 2, count: 2 },
    { major: HTL, school: 3, count: 3 },
    { major: KUL, school: 3, count: 2 },
    { major: BDP, school: 3, count: 1 },
    { major: TKJ, school: 4, count: 2 },
    { major: AKL, school: 4, count: 2 },
    { major: RPL, school: 4, count: 1 },
  ];

  const usedNames = new Set<string>();
  const students: { id: string; userId: string; major: string; schoolIdx: number; name: string }[] = [];
  let sIdx = 0;
  const videoCursor: Record<string, number> = {};
  let maleN = 1;
  let femaleN = 1;
  for (const plan of majorPlan) {
    for (let k = 0; k < plan.count; k++) {
      const isHero = sIdx === 0;
      const female = isHero ? false : rand() < 0.45;
      let name = isHero ? "Muhammad Ilham" : `${pick(female ? FEMALE : MALE)} ${pick(LAST)}`;
      while (usedNames.has(name)) name = `${pick(female ? FEMALE : MALE)} ${pick(LAST)}`;
      usedNames.add(name);
      const school = schools[plan.school];
      const city = rand() < 0.75 ? school.city! : pick(Object.keys(CITY_PROV));
      const email = isHero ? "siswa@vocaz.id" : `${slug(name).replace(/-/g, ".")}${sIdx}@siswa.vocaz.id`;
      const avatar = `https://randomuser.me/api/portraits/${female ? "women" : "men"}/${female ? femaleN++ : maleN++}.jpg`;
      const u = await db.user.create({ data: { email, passwordHash: hash, name, role: "STUDENT", avatarUrl: avatar, phone: `08${int(1100000000, 1399999999)}`, createdAt: daysAgo(int(5, 300)) } });

      const skillPool = MAJOR_SKILLS[plan.major];
      const nSkills = isHero ? 8 : int(3, Math.min(7, skillPool.length));
      const mySkills = isHero ? ["JavaScript", "React", "TypeScript", "Next.js", "Tailwind CSS", "Git", "HTML/CSS", "Node.js"] : pickN(skillPool, nSkills);
      const levels: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "INTERMEDIATE", "ADVANCED", "ADVANCED"];
      const gradYear = pick([2024, 2025, 2025, 2026, 2026, 2027]);
      const headline = isHero ? "Frontend Developer" : pick(HEADLINE[plan.major]);

      const sp = await db.studentProfile.create({
        data: {
          userId: u.id,
          slug: slug(name) + "-" + (1000 + sIdx),
          headline,
          bio: isHero
            ? "Pengembang frontend yang berdedikasi dengan pengalaman 2 tahun membangun aplikasi web yang responsif dan berorientasi pada pengguna. Berfokus pada ekosistem React dan JavaScript modern. Berkomitmen menulis kode yang bersih, mudah dipelihara, dan memberikan pengalaman pengguna yang luar biasa."
            : `Siswa ${plan.major} di ${school.name} yang antusias mengembangkan kemampuan di bidang ${mySkills.slice(0, 2).join(" dan ")}. Terbiasa bekerja dalam tim, disiplin, dan siap berkontribusi di dunia industri.`,
          birthDate: new Date(gradYear - 18, int(0, 11), int(1, 28)),
          gender: female ? "Perempuan" : "Laki-laki",
          city,
          province: CITY_PROV[city],
          willingRelocate: rand() < 0.5,
          major: plan.major,
          graduationYear: gradYear,
          nisn: String(int(1000000000, 9999999999)),
          schoolId: school.id,
          schoolVerified: isHero || rand() < 0.8,
          seekingStatus: gradYear >= 2027 ? "LOOKING_PKL" : pick(["OPEN_TO_WORK", "OPEN_TO_WORK", "OPEN_TO_WORK", "NOT_LOOKING"] as const),
          githubUrl: plan.major === RPL ? `https://github.com/${slug(name).replace(/-/g, "")}` : null,
          linkedinUrl: rand() < 0.5 ? `https://linkedin.com/in/${slug(name)}` : null,
          createdAt: u.createdAt,
          skills: {
            create: mySkills.map((s, i) => ({ skillId: skillId[s], level: isHero ? (i < 4 ? "ADVANCED" : "INTERMEDIATE") : pick(levels) })),
          },
          educations: {
            create: [
              { institution: school.name, degree: "SMK", field: plan.major, startYear: gradYear - 3, endYear: gradYear, description: `Program keahlian ${plan.major}. Rata-rata nilai produktif ${int(82, 95)}.` },
            ],
          },
          experiences: {
            create: isHero
              ? [
                  { title: "Frontend Developer", company: "PT Teknologi Nusantara", type: "PART_TIME", location: "Malang", startDate: monthsAgo(9), endDate: null, description: "Mengembangkan dashboard internal dengan React & Tailwind CSS." },
                  { title: "Junior Web Developer (PKL)", company: "Digital Studio", type: "PKL", location: "Malang", startDate: monthsAgo(24), endDate: monthsAgo(9), description: "Membangun landing page klien dan integrasi REST API." },
                ]
              : rand() < 0.8
                ? [
                    {
                      title: `${pick(["PKL", "Magang"])} ${headline}`,
                      company: pick(companies).name,
                      type: pick(["PKL", "PKL", "INTERNSHIP", "PROJECT"] as ExperienceType[]),
                      location: pick(Object.keys(CITY_PROV)),
                      startDate: monthsAgo(int(6, 14)),
                      endDate: monthsAgo(int(0, 3)),
                      description: `Terlibat dalam pekerjaan ${mySkills.slice(0, 2).join(" & ")} di bawah supervisi mentor industri.`,
                    },
                  ]
                : [],
          },
          achievements: {
            create:
              rand() < 0.5 || isHero
                ? [{ title: pick(["Juara 1 LKS Tingkat Kota", "Juara 2 LKS Provinsi", "Finalis Kompetisi Inovasi Vokasi", "Siswa Berprestasi Jurusan"]), issuer: pick(["Dinas Pendidikan", "Kemendikbudristek", school.name]), date: monthsAgo(int(2, 18)) }]
                : [],
          },
          portfolio: {
            create:
              rand() < 0.7 || isHero
                ? [
                    {
                      title: isHero ? "VocAZ Clone — Job Portal" : `Proyek ${mySkills[0]}`,
                      description: isHero ? "Portal lowongan kerja dengan Next.js, Prisma, dan autentikasi multi-role." : `Hasil karya proyek ${mySkills[0]} selama pembelajaran di sekolah dan PKL.`,
                      url: isHero ? "https://github.com/ilham/vocaz-clone" : null,
                      imageUrl: pick([
                        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
                        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
                        "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800",
                      ]),
                      tags: mySkills.slice(0, 3),
                    },
                  ]
                : [],
          },
        },
      });

      // certificates
      const certPlan: { type: CertificateType; inst: typeof lsp; status: "VERIFIED" | "PENDING" | "REJECTED" }[] = [];
      if (isHero) {
        certPlan.push({ type: "BNSP", inst: lsp, status: "VERIFIED" }, { type: "INDUSTRY", inst: nicc, status: "PENDING" });
      } else {
        const r = rand();
        if (r < 0.45) certPlan.push({ type: "BNSP", inst: lsp, status: "VERIFIED" });
        else if (r < 0.6) certPlan.push({ type: "INDUSTRY", inst: nicc, status: "VERIFIED" });
        else if (r < 0.72) certPlan.push({ type: "TRAINING", inst: blk, status: "VERIFIED" });
        if (rand() < 0.25) certPlan.push({ type: pick(["BNSP", "INDUSTRY"] as const), inst: pick([lsp, nicc]), status: pick(["PENDING", "PENDING", "REJECTED"] as const) });
      }
      for (const cp of certPlan) {
        const certName =
          cp.type === "BNSP" ? `Sertifikat Kompetensi ${plan.major}` : cp.type === "INDUSTRY" ? `${pick(["Certified", "Professional"])} ${mySkills[0]} Associate` : `Pelatihan ${mySkills[0]} Tingkat Dasar`;
        await db.certificate.create({
          data: {
            studentId: sp.id,
            institutionId: cp.inst.id,
            name: certName,
            type: cp.type,
            number: `${cp.type === "BNSP" ? "LSP" : cp.type === "INDUSTRY" ? "NICC" : "BLK"}-${gradYear}-${int(10000, 99999)}`,
            issuer: cp.inst.name,
            issuedAt: monthsAgo(int(1, 12)),
            expiresAt: cp.type !== "TRAINING" ? new Date(Date.now() + int(12, 36) * 30 * 86400000) : null,
            fileUrl: "/demo/sertifikat-contoh.pdf",
            relatedSkills: mySkills.slice(0, 3),
            status: cp.status,
            reviewNote: cp.status === "REJECTED" ? "Nomor sertifikat tidak ditemukan dalam database kami. Mohon unggah ulang dokumen yang jelas." : cp.status === "VERIFIED" ? "Data sesuai dengan arsip lembaga." : null,
            reviewedAt: cp.status !== "PENDING" ? daysAgo(int(2, 60)) : null,
            reviewedById: cp.status !== "PENDING" ? (await db.institution.findUnique({ where: { id: cp.inst.id } }))!.userId : null,
            createdAt: daysAgo(int(1, 70)),
          },
        });
        if (cp.status === "VERIFIED" && cp.type !== "TRAINING") {
          await db.studentSkill.updateMany({ where: { studentId: sp.id, skillId: { in: mySkills.slice(0, 3).map((s) => skillId[s]) } }, data: { verified: true } });
        }
      }

      // videos
      const vids = VIDEOS[plan.major];
      if (vids && (isHero || rand() < 0.85)) {
        const cur = videoCursor[plan.major] ?? 0;
        const v = isHero ? vids[1] : vids[cur % vids.length];
        videoCursor[plan.major] = cur + (isHero ? 0 : 1);
        await db.showcaseVideo.create({
          data: {
            studentId: sp.id,
            title: v.title,
            description: `Video showcase kemampuan ${mySkills.slice(0, 2).join(" & ")} oleh ${name}.`,
            videoUrl: v.url,
            // poster frame captured by scripts/capture-video-posters.mjs (avoids loading video data in lists)
            thumbnailUrl: `/images/videos/${v.url.match(/video-files\/(\d+)\//)![1]}.webp`,
            skills: mySkills.slice(0, 3),
            views: int(80, 2400),
            createdAt: daysAgo(int(1, 60)),
          },
        });
      }

      students.push({ id: sp.id, userId: u.id, major: plan.major, schoolIdx: plan.school, name });
      sIdx++;
    }
  }

  // ───────── applications ─────────
  console.log("📨 Lamaran…");
  const flow: ApplicationStatus[] = ["APPLIED", "APPLIED", "REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];
  const activeJobs = jobs.filter((j) => j.status !== "DRAFT");
  let appCount = 0;
  for (const s of students) {
    const relevant = activeJobs.filter((j) => (j.majors as string[]).includes(s.major));
    const n = s.userId === students[0].userId ? 3 : int(0, Math.min(3, relevant.length));
    for (const j of pickN(relevant, n)) {
      const status = s.userId === students[0].userId ? pick(["REVIEW", "INTERVIEW", "SHORTLISTED"] as ApplicationStatus[]) : pick(flow);
      const created = daysAgo(int(1, 30));
      await db.application.create({
        data: {
          jobId: j.id,
          studentId: s.id,
          coverLetter: `Dengan hormat, saya ${s.name} tertarik melamar posisi ${j.title}. Saya memiliki latar belakang ${s.major} dan siap berkontribusi.`,
          status,
          matchScore: int(55, 96),
          history: [{ status: "APPLIED", at: created.toISOString() }, ...(status !== "APPLIED" ? [{ status, at: daysAgo(int(0, 5)).toISOString() }] : [])],
          hiredAt: status === "HIRED" ? daysAgo(int(0, 10)) : null,
          createdAt: created,
        },
      });
      appCount++;
    }
  }

  // saved jobs & talents
  const hero = students[0];
  for (const j of pickN(activeJobs.filter((j) => (j.majors as string[]).includes(RPL)), 3)) {
    await db.savedJob.create({ data: { studentId: hero.id, jobId: j.id } }).catch(() => {});
  }
  for (const s of students.filter((s) => s.major === RPL || s.major === TKJ).slice(0, 4)) {
    await db.savedTalent.create({ data: { companyId: companies[0].id, studentId: s.id } });
  }

  // ───────── industry partners ─────────
  for (const [si, sc] of schools.entries()) {
    const rel = companies.filter((c) => {
      const p = prefByIndustry[c.industry!];
      return p.majors.some((m) => (schoolDefs[si].programs as string[]).includes(m));
    });
    for (const c of rel.slice(0, 4)) {
      await db.industryPartner.create({
        data: { schoolId: sc.id, companyId: c.id, name: c.name, type: pick(["MOU", "PKL", "RECRUITMENT", "TEACHING_FACTORY"] as const), since: monthsAgo(int(3, 36)), notes: "Kerja sama PKL dan rekrutmen lulusan." },
      });
    }
  }

  // ───────── conversations ─────────
  console.log("💬 Percakapan & notifikasi…");
  const companyOwner = (await db.companyMember.findFirst({ where: { companyId: companies[0].id, role: "OWNER" } }))!.userId;
  const convos = [
    {
      a: companyOwner,
      b: hero.userId,
      msgs: [
        [companyOwner, "Halo Ilham, kami dari PT Teknologi Nusantara. Kami tertarik dengan video showcase React kamu 👋"],
        [hero.userId, "Halo Pak Andi, terima kasih banyak! Saya senang sekali mendengarnya."],
        [companyOwner, "Apakah kamu bersedia mengikuti interview online hari Kamis jam 10.00 WIB?"],
        [hero.userId, "Bersedia, Pak. Mohon info link meeting-nya ya."],
        [companyOwner, "Siap, nanti kami kirimkan via email dan di sini. Sampai jumpa Kamis!"],
      ],
    },
    ...students.slice(1, 4).map((s) => ({
      a: companyOwner,
      b: s.userId,
      msgs: [
        [companyOwner, `Halo ${s.name.split(" ")[0]}, profil kamu cocok dengan kebutuhan tim kami. Boleh kita ngobrol?`],
        [s.userId, "Boleh, Pak. Terima kasih sudah menghubungi saya."],
      ],
    })),
  ];
  for (const [ci, c] of convos.entries()) {
    const conv = await db.conversation.create({
      data: {
        subject: "Rekrutmen",
        participants: { create: [{ userId: c.a, lastReadAt: new Date() }, { userId: c.b, lastReadAt: ci === 0 ? daysAgo(1) : null }] },
      },
    });
    let t = Date.now() - (ci + 1) * 3600000 * 5;
    for (const [sender, body] of c.msgs) {
      t += 60000 * int(2, 30);
      await db.message.create({ data: { conversationId: conv.id, senderId: sender, body, createdAt: new Date(t) } });
    }
    await db.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: new Date(t) } });
  }

  // ───────── notifications ─────────
  await db.notification.createMany({
    data: [
      { userId: hero.userId, type: "APPLICATION", title: "Status lamaran diperbarui", body: "Lamaran kamu untuk Frontend Developer masuk tahap Interview.", link: "/student/career/applications", createdAt: daysAgo(0) },
      { userId: hero.userId, type: "VERIFICATION", title: "Sertifikat terverifikasi", body: "Sertifikat Kompetensi RPL kamu telah diverifikasi oleh LSP Teknologi Digital Nusantara.", link: "/student/profile/certifications", createdAt: daysAgo(2) },
      { userId: hero.userId, type: "OPPORTUNITY", title: "Lowongan baru yang cocok untukmu", body: "Backend Developer (Laravel) di PT Teknologi Nusantara — 87% match.", link: "/student/career", createdAt: daysAgo(3) },
      { userId: companyOwner, type: "APPLICATION", title: "Pelamar baru", body: "3 pelamar baru untuk Frontend Developer.", link: "/company/recruitment", createdAt: daysAgo(0) },
      { userId: companyOwner, type: "SYSTEM", title: "Perusahaan terverifikasi", body: "Selamat! PT Teknologi Nusantara kini berstatus Verified Company.", link: "/company/verification", createdAt: daysAgo(30) },
      { userId: lsp.userId, type: "VERIFICATION", title: "Permintaan verifikasi baru", body: "Ada sertifikat baru yang menunggu verifikasi.", link: "/institution/verification", createdAt: daysAgo(1) },
      { userId: schools[0].userId, type: "APPLICATION", title: "Siswa diterima kerja", body: "Salah satu siswa kamu diterima bekerja melalui VocAZ.", link: "/school/career/placement", createdAt: daysAgo(1) },
      { userId: admin.id, type: "VERIFICATION", title: "Verifikasi perusahaan menunggu", body: "2 perusahaan mengajukan verifikasi.", link: "/admin/company-verification", createdAt: daysAgo(1) },
    ],
  });

  // ───────── reports ─────────
  const someVideos = await db.showcaseVideo.findMany({ take: 2, orderBy: { createdAt: "asc" }, include: { student: { include: { user: true } } } });
  const unverified = companies[11];
  await db.report.createMany({
    data: [
      { reporterId: companyOwner, targetType: "VIDEO", targetId: someVideos[0].id, targetLabel: someVideos[0].title, reason: "Informasi palsu / menyesatkan", details: "Video sepertinya bukan karya asli siswa.", createdAt: daysAgo(1) },
      { reporterId: hero.userId, targetType: "COMPANY", targetId: unverified.id, targetLabel: unverified.name, reason: "Spam atau penipuan", details: "Perusahaan meminta biaya pendaftaran saat interview.", createdAt: daysAgo(2) },
      { reporterId: hero.userId, targetType: "VIDEO", targetId: someVideos[1].id, targetLabel: someVideos[1].title, reason: "Konten tidak pantas", status: "DISMISSED", action: "Tidak ditemukan pelanggaran", resolvedById: admin.id, resolvedAt: daysAgo(5), createdAt: daysAgo(7) },
    ],
  });

  // ───────── activity log ─────────
  const acts = [
    ["COMPANY_VERIFIED", "PT Teknologi Nusantara diverifikasi oleh admin"],
    ["JOB_PUBLISHED", "PT Otomotif Maju Bersama mempublikasikan lowongan Mekanik Kendaraan Ringan"],
    ["CERT_VERIFIED", "LSP Teknologi Digital Nusantara memverifikasi 3 sertifikat"],
    ["USER_REGISTERED", "12 siswa baru bergabung dari SMK Nusantara 1 Malang"],
    ["APPLICATION_HIRED", "Siswa SMK Teknologi Surabaya diterima sebagai Welder di PT Baja Presisi Indonesia"],
    ["VIDEO_UPLOADED", "Video showcase baru: Live coding Dashboard React + Tailwind"],
    ["COMPANY_VERIFY_REQUEST", "PT Cloudnesia Teknologi mengajukan verifikasi"],
    ["REPORT_CREATED", "Laporan baru pada konten video showcase"],
  ];
  await db.activityLog.createMany({ data: acts.map(([action, message], i) => ({ action, message, userId: admin.id, createdAt: daysAgo(i * 0.6) })) });

  console.log(`\n✅ Seed selesai: ${students.length} siswa, ${companies.length} perusahaan, ${jobs.length + 1} lowongan, ${appCount} lamaran.\n`);
  console.log("Akun demo (password: password123)");
  console.table([
    { role: "Siswa", email: "siswa@vocaz.id" },
    { role: "Perusahaan", email: "perusahaan@vocaz.id" },
    { role: "Sekolah / BKK", email: "bkk@vocaz.id" },
    { role: "Lembaga Sertifikasi", email: "lsp@vocaz.id" },
    { role: "Super Admin", email: "admin@vocaz.id" },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
