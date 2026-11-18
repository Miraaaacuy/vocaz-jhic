import Link from "@/components/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  MapPin,
  MessageSquare,
  Play,
  PlayCircle,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { talentInclude, toTalentCard } from "@/lib/match-data";
import { jobCardInclude, platformStats, videoInclude } from "@/server/queries";
import { Avatar, ButtonLink, Card, SectionTitle } from "@/components/ui";
import { CompanyCard, JobCard, TalentCard } from "@/components/cards";
import { ReelNav, ReelProvider, ReelVideo } from "@/components/reel/reel-video";
import { MatchBadge } from "@/components/badges";
import { IntroGate } from "@/components/intro/intro-gate";

// Runs before paint: decide whether the intro overlay is shown (no flash for returning visitors).
// ?intro=1 forces it (used by the "Lihat intro" links).
const INTRO_SCRIPT = `(function(){try{var f=new URLSearchParams(location.search).get("intro")==="1";if(f||(!localStorage.getItem("vocaz:intro:never")&&!sessionStorage.getItem("vocaz:intro:seen")))document.documentElement.dataset.intro="1"}catch(e){}})();`;

const POPULAR_SKILLS = [
  "React",
  "Laravel",
  "Las SMAW",
  "Mikrotik",
  "Figma",
  "Adobe Illustrator",
  "Engine Tune Up",
  "PLC",
  "CNC",
  "Digital Marketing",
  "Front Office",
  "Pastry",
  "Flutter",
  "Fiber Optik",
  "Microsoft Excel",
  "Video Editing",
];

const MATCH_BARS = [
  ["Keahlian", 95],
  ["Program keahlian", 100],
  ["Sertifikasi BNSP", 100],
  ["Pengalaman", 88],
] as const;

const HERO_QUICK = ["Frontend Developer", "Magang", "Teknik Pemesinan", "Admin"];

// one card per role; each hue is distinct so the four audiences read at a glance
const ROLES = [
  {
    href: "/register?role=student",
    icon: GraduationCap,
    title: "Siswa & Alumni SMK",
    cta: "Buat profil",
    points: ["Profil terverifikasi sekolah & LSP", "Video showcase untuk pamer skill", "Lowongan yang cocok otomatis"],
    card: "from-brand-50",
    tile: "from-brand-500 to-brand-700",
    ink: "text-brand-700",
  },
  {
    href: "/register?role=company",
    icon: Building2,
    title: "Perusahaan",
    cta: "Pasang lowongan",
    points: ["Smart Talent Match dengan alasan", "Pelamar terurut dari yang paling cocok", "Hubungi kandidat lewat Messages"],
    card: "from-accent-50",
    tile: "from-accent-500 to-accent-700",
    ink: "text-accent-700",
  },
  {
    href: "/register?role=school",
    icon: School,
    title: "Sekolah / BKK",
    cta: "Daftarkan sekolah",
    points: ["Verifikasi status siswa", "Pantau penempatan alumni", "Rekomendasikan siswa ke mitra"],
    card: "from-sky-50",
    tile: "from-sky-500 to-sky-700",
    ink: "text-sky-700",
  },
  {
    href: "/register?role=institution",
    icon: Award,
    title: "Lembaga Sertifikasi",
    cta: "Daftarkan lembaga",
    points: ["Verifikasi sertifikat kompetensi", "Badge LSP–BNSP di profil siswa", "Rekam jejak sertifikat yang terbit"],
    card: "from-violet-50",
    tile: "from-violet-500 to-violet-700",
    ink: "text-violet-700",
  },
];

export default async function HomePage() {
  const [stats, talents, videos, jobs, companies, hero, faces] = await Promise.all([
    platformStats(),
    db.studentProfile.findMany({
      where: { hidden: false, isPublic: true, schoolVerified: true, certificates: { some: { status: "VERIFIED" } } },
      include: talentInclude,
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    db.showcaseVideo.findMany({ where: { status: "PUBLISHED" }, include: videoInclude, orderBy: { views: "desc" }, take: 5 }),
    db.job.findMany({ where: { status: "ACTIVE" }, include: jobCardInclude, orderBy: { publishedAt: "desc" }, take: 6 }),
    db.company.findMany({
      where: { verificationStatus: "VERIFIED", hidden: false },
      include: { _count: { select: { jobs: { where: { status: "ACTIVE" } } } } },
      take: 3,
      orderBy: { verifiedAt: "desc" },
    }),
    db.studentProfile.findFirst({ where: { user: { email: "siswa@vocaz.id" } }, include: { user: true, school: true } }),
    db.user.findMany({ where: { role: "STUDENT", avatarUrl: { not: null } }, select: { name: true, avatarUrl: true }, take: 5, orderBy: { createdAt: "asc" } }),
  ]);
  const bentoVideo = videos[0];

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <IntroGate />

      {/* ───── HERO ───── */}
      <section className="relative -mt-[76px] overflow-hidden pt-[76px]">
        <div className="mesh-brand absolute inset-0" />
        {/* slow drifting glow (transform only; desktop only so phones do not pay for it) */}
        <div aria-hidden className="hero-aurora absolute -top-40 right-[-10rem] hidden h-[38rem] w-[52rem] lg:block" />
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <span aria-hidden className="absolute top-24 -left-24 hidden h-72 w-72 rounded-full border border-brand-200/60 lg:block" />
        <span aria-hidden className="absolute top-40 -left-10 hidden h-40 w-40 rounded-full border border-accent-200/70 lg:block" />

        <div className="container-page relative grid items-center gap-14 pt-12 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 py-1 pr-3.5 pl-1 text-xs font-semibold text-brand-800 shadow-sm">
              <span className="rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-bold text-white">BARU</span>
              Smart Talent Match untuk rekrutmen vokasi
            </span>
            <h1 className="mt-6 text-[38px] leading-[1.06] font-extrabold tracking-[-0.03em] text-ink sm:text-[52px] lg:text-[46px] xl:text-[58px]">
              <span className="block sm:whitespace-nowrap">Temukan Pekerjaan.</span>
              <span className="block pb-1 sm:whitespace-nowrap">
                <span className="text-gradient">Tunjukkan </span>
                <span className="relative inline-block">
                  <span className="text-gradient-warm">Kompetensi.</span>
                  <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full text-accent-400">
                    <path d="M3 9c48-7 110-8 150-5s98 4 144-1" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">
              Platform karier untuk siswa SMK — bangun profil yang <b className="font-semibold text-ink">diverifikasi sekolah & lembaga sertifikasi</b>, pamerkan skill lewat video, dan temukan lowongan yang paling cocok.
            </p>

            <form action="/lowongan" role="search" className="mt-8 flex flex-col gap-2 rounded-[24px] border border-white bg-white/95 p-2 shadow-[var(--shadow-pop)] ring-1 ring-line/60 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Posisi, skill, atau keyword</span>
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                <input name="q" placeholder="Posisi, skill, atau keyword" className="field h-12 rounded-2xl border-transparent bg-subtle pl-11 focus:bg-white" />
              </label>
              <label className="relative sm:w-36">
                <span className="sr-only">Kota</span>
                <MapPin className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                <input name="city" placeholder="Kota" className="field h-12 rounded-2xl border-transparent bg-subtle pl-11 focus:bg-white" />
              </label>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-600 to-brand-700 px-6 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition hover:from-brand-700 hover:to-brand-800 active:scale-[0.98]">
                <Search className="h-4 w-4" /> Cari Lowongan
              </button>
            </form>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted">
              <span className="font-semibold">Populer:</span>
              {HERO_QUICK.map((q) => (
                <Link key={q} href={`/lowongan?q=${encodeURIComponent(q)}`} className="rounded-full bg-white/80 px-2.5 py-1 font-medium text-body ring-1 ring-line transition hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200">
                  {q}
                </Link>
              ))}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {faces.map((f) => (
                    <Avatar key={f.name} src={f.avatarUrl} name={f.name} size={36} className="ring-2 ring-white" />
                  ))}
                </div>
                <p className="text-sm leading-tight text-muted">
                  <b className="text-ink">{stats.students}+ talenta</b>
                  <br />
                  sudah bergabung
                </p>
              </div>
              <div className="hidden h-9 w-px bg-line sm:block" />
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-body">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" /> Terverifikasi BNSP
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" /> Gratis untuk siswa
                </span>
                {/* full page load so the intro script runs */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/?intro=1" className="inline-flex items-center gap-1.5 font-semibold text-accent-700 hover:underline">
                  <PlayCircle className="h-4 w-4" /> Lihat intro VocAZ
                </a>
              </div>
            </div>
          </div>

          {/* hero visual */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div aria-hidden className="absolute -inset-3 rotate-3 rounded-[40px] bg-gradient-to-br from-brand-200 via-teal-100 to-accent-200 opacity-70" />
            <div className="relative overflow-hidden rounded-[32px] shadow-[0_40px_80px_-30px_rgb(8_37_36/0.45)] ring-4 ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-900.webp"
                srcSet="/images/hero-560.webp 560w, /images/hero-900.webp 900w"
                sizes="(min-width: 1024px) 45vw, 92vw"
                width={900}
                height={600}
                fetchPriority="high"
                decoding="async"
                alt="Siswa SMK belajar coding bersama"
                className="aspect-[4/3.3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/55 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-ink">
                <PlayCircle className="h-5 w-5 text-accent-600" /> Video Talent Showcase
              </div>
            </div>

            <Card className="float-slow absolute -bottom-10 -left-4 w-[270px] p-4 shadow-[var(--shadow-pop)] sm:-left-10 sm:w-[300px]">
              <div className="flex items-center gap-3">
                <Avatar src={hero?.user.avatarUrl} name={hero?.user.name ?? "Muhammad Ilham"} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{hero?.user.name ?? "Muhammad Ilham"}</p>
                  <p className="truncate text-xs text-muted">{hero?.headline ?? "Frontend Developer"}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  [GraduationCap, hero?.school?.name ?? "SMK Nusantara 1 Malang", "VERIFIED"],
                  [Award, "BNSP Certification", "LEVEL 3"],
                ].map(([Icon, label, tag], i) => {
                  const I = Icon as typeof Award;
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-subtle px-2.5 py-2">
                      <I className="h-4 w-4 shrink-0 text-brand-600" />
                      <span className="flex-1 truncate text-xs font-medium text-ink">{label as string}</span>
                      <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-800">{tag as string}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="float-slower absolute -top-6 -right-3 hidden w-[230px] p-4 shadow-[var(--shadow-pop)] sm:block lg:-right-8">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-accent-600" /> Smart Match
                </p>
                <MatchBadge score={94} size="sm" />
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-body">
                {["Skill React & JavaScript", "Pengalaman 2 tahun", "Sertifikat BNSP relevan"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> {t}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="absolute -right-2 bottom-16 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold shadow-[var(--shadow-pop)] lg:flex">
              <ShieldCheck className="h-5 w-5 text-brand-600" /> Verified Company
            </div>
          </div>
        </div>
      </section>

      {/* ───── STATS ───── */}
      <section className="container-page relative z-10 -mt-6">
        <div className="mesh-dark grid grid-cols-2 overflow-hidden rounded-[28px] shadow-[var(--shadow-pop)] ring-1 ring-white/10 md:grid-cols-4">
          {[
            [Users, stats.students, "Talenta SMK"],
            [Building2, stats.companies, "Perusahaan mitra"],
            [Briefcase, stats.jobs, "Lowongan aktif"],
            [Award, stats.verifiedCerts, "Sertifikat terverifikasi"],
          ].map(([Icon, n, label], i) => {
            const I = Icon as typeof Users;
            return (
              <div key={i} className="flex items-center gap-4 border-r border-b border-white/10 px-5 py-6 text-white max-md:even:border-r-0 max-md:[&:nth-child(n+3)]:border-b-0 sm:px-7 sm:py-7 md:border-b-0 md:last:border-r-0">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent-300 ring-1 ring-white/15">
                  <I className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-3xl leading-none font-extrabold tracking-tight tabular-nums sm:text-[40px]">{(n as number).toLocaleString("id-ID")}</p>
                  <p className="mt-1.5 text-sm text-white/75">{label as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── SKILL MARQUEE ───── */}
      <section className="py-10" aria-label="Skill populer">
        <div className="marquee overflow-hidden">
          <div className="marquee-track flex w-max gap-3">
            {[...POPULAR_SKILLS, ...POPULAR_SKILLS].map((s, i) => (
              <Link
                key={i}
                href={`/talenta?q=${encodeURIComponent(s)}`}
                tabIndex={i >= POPULAR_SKILLS.length ? -1 : undefined}
                aria-hidden={i >= POPULAR_SKILLS.length ? true : undefined}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-body transition before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── BENTO: WHY VOCAZ ───── */}
      <section className="cv-auto pb-20 sm:pb-24">
        <div className="container-page">
          <SectionTitle center eyebrow="Kenapa VocAZ" title="Rekrutmen vokasi berbasis kepercayaan" description="Setiap klaim di profil diverifikasi pihak berwenang, setiap rekomendasi punya alasan yang jelas." />
          <div className="reveal grid gap-5 lg:grid-cols-6">
            {/* Smart Match — big tile */}
            <div className="group relative overflow-hidden rounded-[28px] border border-line/70 bg-white p-7 shadow-[var(--shadow-card)] lg:col-span-4 lg:row-span-2 lg:flex lg:items-center lg:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(30rem_20rem_at_100%_0%,rgb(34_144_133/0.14),transparent_70%),radial-gradient(22rem_16rem_at_0%_100%,rgb(242_92_18/0.07),transparent_70%)]" />
              <div className="relative grid w-full gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-glow)]">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">Smart Talent Match</h3>
                  <p className="mt-3 max-w-md leading-relaxed text-body">
                    Skor kecocokan 0–100% dari 6 komponen: skill, jurusan, sertifikasi, pengalaman, lokasi, dan profil — lengkap dengan alasan yang bisa dibaca recruiter.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-body">
                    {["Urutan pelamar otomatis berdasarkan kecocokan", "Rekomendasi lowongan untuk siswa & BKK", "Bobot bisa diatur admin"].map((t) => (
                      <li key={t} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-600" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mx-auto w-full max-w-[260px] rounded-3xl bg-white p-5 shadow-[var(--shadow-pop)] ring-1 ring-line/70">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(var(--color-brand-600)_0_94%,var(--color-line)_94%_100%)]">
                    <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-extrabold text-ink">94%</span>
                      <span className="text-[10px] font-bold tracking-wider text-brand-700 uppercase">Sangat cocok</span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2.5">
                    {MATCH_BARS.map(([l, v]) => (
                      <div key={l}>
                        <div className="mb-1 flex justify-between text-[11px] font-medium text-muted">
                          <span>{l}</span>
                          <span>{v}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-line">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-teal-500" style={{ width: `${v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Video showcase tile */}
            <Link href="/showcase" className="group relative min-h-[240px] overflow-hidden rounded-[28px] bg-brand-950 p-7 text-white lg:col-span-2">
              {bentoVideo?.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bentoVideo.thumbnailUrl} alt="" width={640} height={360} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-transparent" />
              <span className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg transition group-hover:scale-110">
                <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
              </span>
              <div className="relative flex h-full flex-col justify-end">
                <h3 className="text-xl font-bold">Video Talent Showcase</h3>
                <p className="mt-1.5 text-sm text-white/75">Lihat skill nyata — dari live coding sampai pengelasan.</p>
              </div>
            </Link>

            {/* Verification tile */}
            <div className="rounded-[28px] border border-line/70 bg-gradient-to-b from-teal-50/70 to-white p-7 shadow-[var(--shadow-card)] lg:col-span-2">
              <h3 className="text-xl font-bold text-ink">Verifikasi berlapis</h3>
              <p className="mt-1.5 text-sm text-muted">Badge diterbitkan pihak berwenang, bukan klaim sepihak.</p>
              <div className="mt-5 space-y-2">
                {[
                  [School, "School Verified", "bg-sky-50 text-sky-700"],
                  [BadgeCheck, "Competency Verified", "bg-teal-50 text-teal-700"],
                  [Award, "LSP – BNSP Verified", "bg-accent-50 text-accent-700"],
                ].map(([Icon, t, tone]) => {
                  const I = Icon as typeof Award;
                  return (
                    <div key={t as string} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold ${tone}`}>
                      <I className="h-4 w-4" /> {t as string}
                      <CheckCircle2 className="ml-auto h-4 w-4 opacity-70" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Placement tile */}
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent-600 to-accent-800 p-7 text-white shadow-[0_24px_48px_-20px_rgb(197_74_6/0.55)] lg:col-span-6 lg:px-10">
              <div className="bg-dots-light absolute inset-0" />
              <span aria-hidden className="absolute -top-16 -right-10 h-56 w-56 rounded-full border border-white/20" />
              <span aria-hidden className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full border border-white/10" />
              <div className="relative flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-white/85">Rekrut &amp; penempatan</p>
                  <h3 className="mt-1 max-w-xl text-2xl leading-tight font-extrabold tracking-[-0.02em] sm:text-3xl">Dari lamaran sampai diterima, semuanya terpantau BKK sekolah.</h3>
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20">
                    <CheckCircle2 className="h-4 w-4" /> {stats.hired} siswa sudah diterima kerja lewat VocAZ
                  </p>
                </div>
                <ButtonLink href="/lowongan" variant="white" className="shrink-0">
                  Cari lowongan <ArrowUpRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOUR ROLES ───── */}
      <section className="cv-auto pb-20 sm:pb-24">
        <div className="container-page">
          <SectionTitle center eyebrow="Satu ekosistem" title="Dibuat untuk empat peran" description="Siswa, perusahaan, sekolah/BKK, dan lembaga sertifikasi bekerja di platform yang sama." />
          <div className="reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <Link key={r.href} href={r.href} className="group block h-full">
                <div className={`card card-hover flex h-full flex-col bg-gradient-to-b to-white to-60% p-6 ${r.card}`}>
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${r.tile}`}>
                    <r.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-ink">{r.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-body">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${r.ink}`} /> {p}
                      </li>
                    ))}
                  </ul>
                  <span className={`mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold ${r.ink}`}>
                    {r.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FEATURED TALENTS ───── */}
      <section className="cv-auto bg-white py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionTitle eyebrow="Featured Talents" title="Talenta SMK Terverifikasi" description="Siswa dengan profil lengkap, terverifikasi sekolah, dan bersertifikat kompetensi." />
            <ButtonLink href="/talenta" variant="secondary" className="mb-8 shrink-0">
              Lihat semua talenta <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="reveal grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {talents.map((t) => (
              <TalentCard key={t.id} t={toTalentCard(t)} href={`/talenta/${t.slug}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── VIDEO SHOWCASE: a phone frame with a mini scroll feed ───── */}
      <section className="cv-auto mesh-dark relative overflow-hidden py-20 text-white sm:py-24">
        <div className="bg-dots-light absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-accent-300 uppercase">Video Talent Showcase</p>
            <h2 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] sm:text-4xl lg:text-5xl">Lihat skill‑nya, bukan cuma CV‑nya</h2>
            <p className="mt-4 max-w-xl text-white/75 sm:text-lg">Siswa menunjukkan kemampuan nyata lewat video singkat — dari live coding sampai teknik pengelasan. Scroll di layar ponsel untuk pindah ke video berikutnya.</p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/85">
              {["Satu video satu layar, langsung diputar", "Setiap video terhubung ke profil terverifikasi", "Recruiter melihat skor kecocokan di tiap video"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-300" /> {t}
                </li>
              ))}
            </ul>
            <ButtonLink href="/showcase" variant="white" size="lg" className="mt-8">
              Buka Video Showcase <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <ReelProvider>
            <div className="mx-auto flex items-center gap-4">
              <div className="relative h-[520px] w-[280px] rounded-[44px] bg-black p-2.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/20 sm:h-[580px] sm:w-[310px]">
                {/* videos only download once this frame is really on screen (see ReelVideo) */}
                <div id="home-reel" role="region" aria-label="Cuplikan video showcase, scroll untuk pindah video" tabIndex={0} className="scrollbar-none h-full snap-y snap-mandatory overflow-y-auto rounded-[34px]">
                  {videos.map((v) => (
                    <article key={v.id} className="relative h-full snap-start snap-always" aria-label={v.title}>
                      <ReelVideo id={v.id} src={v.videoUrl} poster={v.thumbnailUrl} title={v.title} />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-14">
                        <p className="line-clamp-2 text-sm leading-snug font-bold">{v.title}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <Avatar src={v.student.user.avatarUrl} name={v.student.user.name} size={24} className="ring-1 ring-white/60" />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/90">{v.student.user.name}</span>
                          <Link href={`/showcase/${v.id}`} aria-label={`Buka video: ${v.title}`} className="pointer-events-auto rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-800 transition hover:bg-brand-50">
                            Buka
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <ReelNav scope="home-reel" className="hidden flex-col gap-3 sm:flex" />
            </div>
          </ReelProvider>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="cv-auto py-20 sm:py-24">
        <div className="container-page">
          <SectionTitle center eyebrow="Cara Kerja" title="Dari profil ke pekerjaan dalam 4 langkah" />
          <ol className="reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [GraduationCap, "Bangun profil", "Isi data diri, skill, pengalaman PKL, dan portfolio."],
              [Upload, "Verifikasi & showcase", "Sekolah & LSP memverifikasi, kamu unggah video skill."],
              [Sparkles, "Smart Match", "Sistem menghitung % kecocokanmu dengan setiap lowongan."],
              [MessageSquare, "Dihubungi & direkrut", "Recruiter menghubungi lewat Messages hingga kamu diterima."],
            ].map(([Icon, title, desc], i) => {
              const I = Icon as typeof Award;
              return (
                <li key={i} className="card relative p-6">
                  <span aria-hidden className="absolute top-4 right-5 text-5xl leading-none font-extrabold text-brand-100 tabular-nums">
                    0{i + 1}
                  </span>
                  <span className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${i === 3 ? "from-accent-500 to-accent-700" : "from-brand-500 to-brand-700"}`}>
                    <I className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-ink">{title as string}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc as string}</p>
                  {i < 3 && (
                    <span aria-hidden className="absolute top-1/2 -right-[22px] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-600 shadow-[var(--shadow-card)] ring-1 ring-line lg:flex">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ───── JOBS ───── */}
      <section className="cv-auto bg-white py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionTitle eyebrow="Lowongan Terbaru" title="Peluang karier untuk lulusan SMK" description="Full time, magang, hingga PKL dari perusahaan terverifikasi." />
            <ButtonLink href="/lowongan" variant="secondary" className="mb-8 shrink-0">
              Semua lowongan <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="reveal grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} href={`/lowongan/${j.id}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── COMPANIES ───── */}
      <section className="cv-auto py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionTitle eyebrow="Perusahaan" title="Dipercaya industri" description="Perusahaan dengan status Verified Company telah melewati review dokumen legal." />
            <ButtonLink href="/perusahaan" variant="secondary" className="mb-8 shrink-0">
              Semua perusahaan <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="reveal grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <CompanyCard key={c.id} c={{ ...c, activeJobs: c._count.jobs }} href={`/perusahaan/${c.slug}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="cv-auto px-4 pb-20 sm:px-6 lg:px-8">
        <div className="reveal relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-brand-800 shadow-[var(--shadow-pop)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cta-1400.webp" alt="" width={1400} height={934} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-800/95 to-brand-600/85" />
          <div className="absolute inset-0 bg-[radial-gradient(28rem_18rem_at_90%_10%,rgb(242_92_18/0.35),transparent_70%)]" />
          <span aria-hidden className="absolute -top-24 -left-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative grid items-center gap-8 px-8 py-16 sm:px-14 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
            <div className="text-white">
              <h2 className="text-3xl leading-tight font-extrabold tracking-[-0.02em] sm:text-5xl">Kariermu Dimulai dari Profil yang Tepat.</h2>
              <p className="mt-3 max-w-xl text-white/85">Bergabung dengan siswa, sekolah, dan perusahaan yang membangun ekosistem rekrutmen vokasi berbasis kepercayaan di VocAZ.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="/register?role=student" variant="accent" size="lg">
                Buat Profil Sekarang
              </ButtonLink>
              <ButtonLink href="/register?role=company" size="lg" className="border border-white/60 bg-transparent hover:bg-white/10">
                Pasang Lowongan
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
