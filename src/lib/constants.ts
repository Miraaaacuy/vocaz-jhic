import type {
  ApplicationStatus,
  CertificateType,
  CertPreference,
  CompanyVerificationStatus,
  ExperienceType,
  InstitutionType,
  JobStatus,
  JobType,
  PartnerType,
  Role,
  SeekingStatus,
  SkillLevel,
  VerifyStatus,
  WorkMode,
} from "@prisma/client";

export const APP_NAME = "VocAZ";
export const APP_TAGLINE = "Show your skill on video, launch your career here";

// Customer service WhatsApp (0857-5535-3206) — international format for wa.me links
export const CS_WHATSAPP = "6285755353206";
export const CS_WHATSAPP_TEXT = "Halo CS VocAZ, saya butuh bantuan.";

// intrinsic sizes of the optimised WebP files (see scripts/optimize-images.mjs) — used to prevent layout shift
export const SPONSORS = [
  { name: "JHIC 2.0", src: "/sponsors/jhic.webp", w: 158, h: 96 },
  { name: "Jagoan Hosting", src: "/sponsors/jagoan-hosting.webp", w: 306, h: 96 },
  { name: "Komdigi", src: "/sponsors/komdigi.webp", w: 133, h: 96 },
  { name: "Garuda Spark", src: "/sponsors/garuda-spark.webp", w: 176, h: 96 },
  { name: "Ngalup", src: "/sponsors/ngalup.webp", w: 606, h: 96 },
];

/** Program keahlian SMK, grouped by rumpun (used for partial major match) */
export const MAJOR_GROUPS: Record<string, string[]> = {
  "Teknologi Informasi": [
    "Rekayasa Perangkat Lunak",
    "Teknik Komputer dan Jaringan",
    "Sistem Informatika, Jaringan dan Aplikasi",
    "Desain Komunikasi Visual",
    "Animasi",
    "Pengembangan Perangkat Lunak dan Gim",
  ],
  "Teknik Mesin & Otomotif": [
    "Teknik Kendaraan Ringan",
    "Teknik Sepeda Motor",
    "Teknik Pemesinan",
    "Teknik Pengelasan",
    "Teknik Mekatronika",
  ],
  "Teknik Elektro": ["Teknik Instalasi Tenaga Listrik", "Teknik Elektronika Industri", "Teknik Audio Video"],
  "Bisnis & Manajemen": [
    "Akuntansi dan Keuangan Lembaga",
    "Otomatisasi dan Tata Kelola Perkantoran",
    "Bisnis Daring dan Pemasaran",
    "Manajemen Perkantoran dan Layanan Bisnis",
  ],
  "Pariwisata & Kuliner": ["Perhotelan", "Kuliner", "Usaha Layanan Pariwisata", "Tata Busana", "Tata Kecantikan"],
  Kesehatan: ["Farmasi", "Keperawatan", "Teknologi Laboratorium Medik"],
};

export const MAJORS = Object.values(MAJOR_GROUPS).flat();

export function majorGroup(major: string | null | undefined) {
  if (!major) return null;
  for (const [g, list] of Object.entries(MAJOR_GROUPS)) if (list.includes(major)) return g;
  return null;
}

export const INDUSTRIES = [
  "Teknologi Informasi",
  "Manufaktur",
  "Otomotif",
  "Perhotelan & Pariwisata",
  "Keuangan & Perbankan",
  "Retail & E-Commerce",
  "Kesehatan",
  "Kreatif & Media",
  "Telekomunikasi",
  "Konstruksi",
  "Logistik",
  "Energi",
];

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];

export const PROVINCES = [
  "Jawa Timur",
  "Jawa Tengah",
  "Jawa Barat",
  "DKI Jakarta",
  "DI Yogyakarta",
  "Banten",
  "Bali",
  "Sumatera Utara",
  "Sumatera Barat",
  "Sulawesi Selatan",
  "Kalimantan Timur",
];

export const CITIES: Record<string, string> = {
  Malang: "Jawa Timur",
  Surabaya: "Jawa Timur",
  Sidoarjo: "Jawa Timur",
  Kediri: "Jawa Timur",
  Batu: "Jawa Timur",
  Semarang: "Jawa Tengah",
  Solo: "Jawa Tengah",
  Bandung: "Jawa Barat",
  Bekasi: "Jawa Barat",
  Bogor: "Jawa Barat",
  Jakarta: "DKI Jakarta",
  Yogyakarta: "DI Yogyakarta",
  Tangerang: "Banten",
  Denpasar: "Bali",
  Medan: "Sumatera Utara",
  Makassar: "Sulawesi Selatan",
  Balikpapan: "Kalimantan Timur",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Siswa / Talent",
  COMPANY: "Perusahaan",
  SCHOOL: "Sekolah / BKK",
  INSTITUTION: "Lembaga Sertifikasi",
  ADMIN: "Super Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student",
  COMPANY: "/company",
  SCHOOL: "/school",
  INSTITUTION: "/institution",
  ADMIN: "/admin",
};

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  INTERNSHIP: "Magang",
  PKL: "PKL",
  CONTRACT: "Kontrak",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  CLOSED: "Ditutup",
};

export const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Dilamar",
  REVIEW: "Ditinjau",
  SHORTLISTED: "Shortlist",
  INTERVIEW: "Interview",
  OFFERED: "Penawaran",
  HIRED: "Diterima",
  REJECTED: "Ditolak",
  WITHDRAWN: "Dibatalkan",
};

export const APP_STATUS_TONE: Record<ApplicationStatus, Tone> = {
  APPLIED: "neutral",
  REVIEW: "info",
  SHORTLISTED: "info",
  INTERVIEW: "warning",
  OFFERED: "warning",
  HIRED: "success",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
};

export const PIPELINE: ApplicationStatus[] = ["APPLIED", "REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  BEGINNER: "Pemula",
  INTERMEDIATE: "Menengah",
  ADVANCED: "Mahir",
};

export const SEEKING_LABEL: Record<SeekingStatus, string> = {
  OPEN_TO_WORK: "Terbuka untuk kerja",
  LOOKING_PKL: "Mencari PKL / Magang",
  NOT_LOOKING: "Tidak sedang mencari",
};

export const EXPERIENCE_TYPE_LABEL: Record<ExperienceType, string> = {
  PKL: "PKL",
  INTERNSHIP: "Magang",
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  FREELANCE: "Freelance",
  PROJECT: "Proyek",
};

export const CERT_TYPE_LABEL: Record<CertificateType, string> = {
  BNSP: "LSP – BNSP",
  INDUSTRY: "Sertifikasi Industri",
  TRAINING: "Pelatihan",
};

export const CERT_PREF_LABEL: Record<CertPreference, string> = {
  ANY: "Tidak wajib",
  BNSP: "Wajib BNSP",
  INDUSTRY: "Sertifikasi industri",
};

export const VERIFY_STATUS_LABEL: Record<VerifyStatus, string> = {
  PENDING: "Menunggu",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export const COMPANY_VERIFY_LABEL: Record<CompanyVerificationStatus, string> = {
  UNVERIFIED: "Belum diverifikasi",
  PENDING: "Sedang ditinjau",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export const INSTITUTION_TYPE_LABEL: Record<InstitutionType, string> = {
  LSP_BNSP: "LSP / BNSP",
  INDUSTRY: "Sertifikasi Industri",
  TRAINING: "Lembaga Pelatihan",
};

export const PARTNER_TYPE_LABEL: Record<PartnerType, string> = {
  MOU: "MoU Kerja Sama",
  PKL: "Tempat PKL",
  RECRUITMENT: "Rekrutmen",
  TEACHING_FACTORY: "Teaching Factory",
};

export const DOC_TYPES = [
  { value: "NIB", label: "NIB (Nomor Induk Berusaha)" },
  { value: "NPWP", label: "NPWP Perusahaan" },
  { value: "AKTA", label: "Akta Pendirian" },
  { value: "SIUP", label: "SIUP / Izin Usaha" },
  { value: "DOMISILI", label: "Surat Keterangan Domisili" },
  { value: "OTHER", label: "Dokumen Pendukung Lain" },
];

export const REPORT_REASONS = [
  "Konten tidak pantas",
  "Informasi palsu / menyesatkan",
  "Spam atau penipuan",
  "Pelanggaran hak cipta",
  "Lainnya",
];

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";
