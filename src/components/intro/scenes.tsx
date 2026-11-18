"use client";

import { useEffect, useState } from "react";
import { Award, BadgeCheck, Bell, Briefcase, Building2, CheckCircle2, Eye, GraduationCap, Play, School, Search, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { SPONSORS } from "@/lib/constants";

/** Animated number from 0 → target (restarts when the scene remounts) */
function useCountUp(target: number, ms = 1400, delay = 300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay]);
  return v;
}

function Stage({ children, tag, tone = "brand" }: { children: React.ReactNode; tag?: string; tone?: "brand" | "danger" }) {
  return (
    <div className="intro-stage-in relative aspect-[4/5] w-full overflow-hidden rounded-[36px] bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent shadow-[0_30px_70px_-35px_rgb(0_0_0/0.8)] ring-1 ring-white/10 sm:aspect-[16/11]">
      {tag && (
        <p className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold text-white/85">
          <span className={`h-1.5 w-1.5 rounded-full ${tone === "danger" ? "bg-red-400" : "bg-brand-300"}`} />
          {tag}
        </p>
      )}
      {children}
    </div>
  );
}

// 1 ─ the problem: a recruiter searching without VocAZ — every result has a trust problem
export function SceneProblem() {
  const rows = [
    { src: "CV.pdf lewat email", warn: "Sertifikat belum dicek", d: "d-2" },
    { src: "Nilai di spreadsheet", warn: "Data tidak lengkap", d: "d-4" },
    { src: "Grup WhatsApp BKK", warn: "Kontak tidak jelas", d: "d-6" },
  ];
  return (
    <Stage tag="Tanpa VocAZ" tone="danger">
      <div className="absolute inset-0 flex flex-col justify-center gap-3 p-5 pt-14 sm:p-9 sm:pt-14">
        <div className="intro-rise flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-lg">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <span className="truncate">Cari lulusan SMK jurusan RPL…</span>
        </div>
        {rows.map((r) => (
          <div key={r.src} className={`intro-slide ${r.d} flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50">
              <UserRound className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block h-2 w-20 rounded-full bg-white/25" />
              <p className="mt-1.5 truncate text-xs text-white/55">{r.src}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-red-300 sm:text-[11px]">
              <TriangleAlert className="h-3 w-3" /> {r.warn}
            </span>
          </div>
        ))}
        <p className="intro-fade d-8 text-xs text-white/50">3 kandidat ditemukan · 0 yang bisa dipercaya langsung</p>
      </div>
    </Stage>
  );
}

// 2 ─ introduce VocAZ
export function SceneIntro() {
  return (
    <Stage tag="Vocational Career A–Z">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="intro-pop relative flex items-center justify-center px-6 py-4">
          <span className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgb(34_144_133/0.45),transparent)]" />
          <span className="intro-pulse absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-white.webp" width={400} height={121} alt="VocAZ" className="relative h-20 w-auto sm:h-28" />
        </div>
        <p className="intro-rise d-5 font-mono text-xs tracking-[0.22em] text-white/60 uppercase">Show your skill · launch your career</p>
      </div>
    </Stage>
  );
}

// 3 ─ one ecosystem: four roles orbiting VocAZ
const NODES = [
  { pos: "top-0 left-1/2", label: "Siswa", icon: GraduationCap, color: "bg-amber-300 text-amber-950", d: "d-2" },
  { pos: "top-1/2 left-full", label: "Perusahaan", icon: Building2, color: "bg-teal-300 text-teal-950", d: "d-3" },
  { pos: "top-full left-1/2", label: "Lembaga Sertifikasi", icon: Award, color: "bg-violet-300 text-violet-950", d: "d-4" },
  { pos: "top-1/2 left-0", label: "Sekolah / BKK", icon: School, color: "bg-sky-300 text-sky-950", d: "d-5" },
];
export function SceneEcosystem() {
  return (
    <Stage tag="Satu jaringan">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative aspect-square w-[58%] sm:h-[62%] sm:w-auto">
          {/* slowly turning dashed orbit — transform only */}
          <span className="intro-orbit absolute inset-0 rounded-full border-2 border-dashed border-brand-300/45" />
          <span className="absolute inset-[22%] rounded-full border border-white/10 bg-white/[0.03]" />
          <div className="intro-pop absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-black text-white shadow-[0_0_40px_rgb(34_144_133/0.6)] sm:h-20 sm:w-20 sm:text-xl">
            <span className="intro-pulse absolute inset-0 rounded-full" />
            VZ
          </div>
          {NODES.map((n) => (
            <div key={n.label} className={`intro-pop ${n.d} absolute ${n.pos} flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg ring-4 ring-[#0b2b28] ${n.color}`}>
                <n.icon className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white/90">{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

// 4 ─ verified profile
export function SceneVerified() {
  const badges = [
    { t: "School Verified", sub: "Diverifikasi BKK SMK", icon: School, c: "text-sky-300 border-sky-400/30 bg-sky-400/10", d: "d-3" },
    { t: "Competency Verified", sub: "Skill tervalidasi", icon: BadgeCheck, c: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10", d: "d-5" },
    { t: "LSP – BNSP Verified", sub: "Sertifikasi nasional", icon: Award, c: "text-amber-300 border-amber-400/30 bg-amber-400/10", d: "d-7" },
  ];
  return (
    <Stage tag="Verifikasi berlapis">
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="intro-rise w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/talent.webp" width={48} height={48} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20" />
            <div>
              <p className="font-bold text-white">Muhammad Ilham</p>
              <p className="text-xs text-white/60">Frontend Developer · SMK Nusantara 1 Malang</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {badges.map((b) => (
              <div key={b.t} className={`intro-slide ${b.d} flex items-center gap-3 rounded-xl border px-3 py-2.5 ${b.c}`}>
                <b.icon className="h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{b.t}</p>
                  <p className="text-[11px] text-white/55">{b.sub}</p>
                </div>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Stage>
  );
}

// 5 ─ video showcase
export function SceneVideo() {
  const views = useCountUp(2345, 2200, 500);
  return (
    <Stage tag="Video showcase">
      <div className="absolute inset-0 flex items-center justify-center gap-6 p-6">
        <div className="intro-pop relative aspect-[9/14] h-[82%] overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-560.webp" alt="" className="h-full w-full object-cover object-[70%_50%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">⚡ 94% Match</span>
          <span className="intro-pulse absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-600">
            <Play className="ml-1 h-6 w-6" fill="currentColor" />
          </span>
          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
            <p className="text-xs font-semibold">Live coding: Dashboard React</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/75">
              <Eye className="h-3 w-3" /> {views.toLocaleString("id-ID")} ditonton
            </p>
          </div>
        </div>
        <div className="hidden space-y-2 sm:block">
          {["Las SMAW 3G", "Konfigurasi Mikrotik", "Desain logo UMKM"].map((t, i) => (
            <div key={t} className={`intro-slide d-${i + 3} flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/80`}>
              <Play className="h-3.5 w-3.5 text-brand-300" fill="currentColor" /> {t}
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

// 6 ─ smart talent match
export function SceneMatch() {
  const score = useCountUp(94, 1600, 250);
  const bars = [
    ["Keahlian", 38, 40],
    ["Program keahlian", 15, 15],
    ["Sertifikasi", 15, 15],
    ["Pengalaman", 15, 15],
    ["Lokasi", 8, 10],
    ["Profil & video", 5, 5],
  ] as const;
  return (
    <Stage tag="6 komponen penilaian">
      <div className="absolute inset-0 grid content-center items-center gap-4 p-5 pt-12 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-8 sm:pt-12">
        <div className="intro-pop mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-brand-500/70 bg-brand-600/10 sm:h-44 sm:w-44">
          <span className="text-4xl font-black text-white sm:text-6xl">{score}%</span>
          <span className="text-[10px] font-semibold tracking-wider text-brand-300 uppercase sm:text-xs">Sangat cocok</span>
        </div>
        <div className="space-y-2.5">
          {bars.map(([l, v, max], i) => (
            <div key={l} className={`intro-rise d-${i + 1}`}>
              <div className="mb-1 flex justify-between text-[11px] text-white/70">
                <span>{l}</span>
                <span>
                  {v}/{max}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`intro-grow d-${i + 2} h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500`} style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="intro-fade d-8 flex items-center gap-1.5 pt-1 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Memenuhi skill React, JavaScript & sertifikasi BNSP
          </p>
        </div>
      </div>
    </Stage>
  );
}

// 7 ─ recruitment → placement
export function SceneHire() {
  const steps = ["Dilamar", "Ditinjau", "Interview", "Diterima"];
  return (
    <Stage tag="Terpantau BKK">
      <div className="absolute inset-0 flex flex-col justify-center gap-8 p-6 sm:p-10">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={`intro-pop d-${i * 2 + 1} flex flex-col items-center gap-2`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${i === 3 ? "bg-emerald-500 text-white shadow-[0_0_30px_rgb(16_185_129/0.6)]" : "bg-brand-600 text-white"}`}>
                  {i === 3 ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap text-white/80">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-2 mb-6 h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`intro-grow d-${i * 2 + 2} h-full bg-brand-400`} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="intro-slide d-8 ml-auto flex w-full max-w-xs items-start gap-3 rounded-2xl border border-white/10 bg-white p-3.5 text-ink shadow-2xl">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Siswa diterima kerja 🎉</p>
            <p className="text-xs text-muted">Muhammad Ilham · Frontend Developer di PT Teknologi Nusantara</p>
          </div>
        </div>
        <div className="intro-fade d-6 hidden items-center gap-2 text-xs text-white/60 sm:flex">
          <Briefcase className="h-4 w-4" /> Notifikasi otomatis ke siswa & BKK sekolah
        </div>
      </div>
    </Stage>
  );
}

// 8 ─ call to action (+ 5 mandatory sponsor logos)
export function SceneStart({ onEnter }: { onEnter: () => void }) {
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <Sparkles className="intro-pop h-10 w-10 text-brand-300" />
        <div className="intro-rise d-2 flex flex-col gap-3 sm:flex-row">
          <button onClick={onEnter} className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700">
            Masuk ke Website →
          </button>
          <a href="/register" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-bold text-white transition hover:bg-white/10">
            Daftar Gratis
          </a>
        </div>
        <div className="intro-rise d-4 w-full max-w-md rounded-2xl bg-white px-4 py-3">
          <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Didukung oleh</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {SPONSORS.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.name} src={s.src} alt={s.name} width={s.w} height={s.h} loading="lazy" decoding="async" className="h-7 w-auto object-contain" />
            ))}
          </div>
        </div>
      </div>
    </Stage>
  );
}
