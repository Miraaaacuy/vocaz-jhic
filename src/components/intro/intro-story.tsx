"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { SceneEcosystem, SceneHire, SceneIntro, SceneMatch, SceneProblem, SceneStart, SceneVerified, SceneVideo } from "./scenes";
import { BACKDROP_CLS, BOTTOM_CLS, FIRST_LABEL, FIRST_TEXT, FirstTitle, GRID_CLS, IntroLogo, SKIP_CLS, SceneLabel, SceneTitle, TEXT_CLS, TOP_CLS } from "./intro-copy";

const SCENE_MS = 4200;
export const INTRO_NEVER_KEY = "vocaz:intro:never";
export const INTRO_SEEN_KEY = "vocaz:intro:seen";

type Scene = { label: string; title: React.ReactNode; text: string; Visual: React.ComponentType<{ onEnter: () => void }> };

const SCENES: Scene[] = [
  {
    label: FIRST_LABEL,
    title: <FirstTitle />,
    text: FIRST_TEXT,
    Visual: SceneProblem,
  },
  {
    label: "Kenalan dulu",
    title: (
      <>
        Ini <span className="text-brand-300">VocAZ</span> — Vocational Career A‑Z.
      </>
    ),
    text: "Platform karier vokasi yang mengubah kompetensi siswa SMK menjadi profil yang terverifikasi dan mudah ditemukan.",
    Visual: SceneIntro,
  },
  {
    label: "Satu ekosistem",
    title: (
      <>
        Menghubungkan <span className="text-brand-300">semua pihak</span> dalam satu jaringan.
      </>
    ),
    text: "Siswa, perusahaan, sekolah/BKK, dan lembaga sertifikasi bekerja di platform yang sama — tanpa data tercecer.",
    Visual: SceneEcosystem,
  },
  {
    label: "Profil terverifikasi",
    title: (
      <>
        Kompetensi yang <span className="text-brand-300">bisa dipercaya</span>.
      </>
    ),
    text: "Badge diterbitkan oleh pihak berwenang: BKK sekolah, lembaga LSP–BNSP, dan sertifikasi industri — bukan klaim sepihak.",
    Visual: SceneVerified,
  },
  {
    label: "Video Talent Showcase",
    title: (
      <>
        Tunjukkan skill-nya, <span className="text-brand-300">bukan cuma CV-nya</span>.
      </>
    ),
    text: "Dari live coding sampai teknik pengelasan — recruiter melihat kemampuan nyata lewat video singkat.",
    Visual: SceneVideo,
  },
  {
    label: "Smart Talent Match",
    title: (
      <>
        Skor kecocokan <span className="text-brand-300">yang transparan</span>.
      </>
    ),
    text: "Setiap kandidat dinilai 0–100% dari skill, jurusan, sertifikasi, pengalaman, lokasi, dan profil — lengkap dengan alasannya.",
    Visual: SceneMatch,
  },
  {
    label: "Rekrut & penempatan",
    title: (
      <>
        Dari lamaran sampai diterima — <span className="text-brand-300">terpantau BKK</span>.
      </>
    ),
    text: "Recruiter memproses pelamar, siswa mendapat notifikasi, dan sekolah langsung melihat hasil penempatan alumninya.",
    Visual: SceneHire,
  },
  {
    label: "Mulai sekarang",
    title: (
      <>
        Temukan Pekerjaan. <span className="text-brand-300">Tunjukkan Kompetensi.</span>
      </>
    ),
    text: "Gratis untuk siswa. Bergabung bersama sekolah, lembaga sertifikasi, dan perusahaan di ekosistem VocAZ.",
    Visual: SceneStart,
  },
];

function safeSet(storage: "local" | "session", key: string) {
  try {
    (storage === "local" ? localStorage : sessionStorage).setItem(key, "1");
  } catch {
    /* storage unavailable (private mode) — intro simply shows again next time */
  }
}

export default function IntroStory() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const [gone, setGone] = useState(false);
  // the very first scene is already painted by the SSR curtain, so it appears without entrance animations
  const [moved, setMoved] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const last = SCENES.length - 1;

  const close = useCallback((never = false) => {
    safeSet("session", INTRO_SEEN_KEY);
    if (never) safeSet("local", INTRO_NEVER_KEY);
    setClosing(true);
    setTimeout(() => {
      delete document.documentElement.dataset.intro;
      setGone(true);
      // drop ?intro=1 from the address bar so a refresh doesn't replay it
      if (location.search.includes("intro=")) history.replaceState(null, "", location.pathname);
    }, 450);
  }, []);

  const go = useCallback(
    (i: number) => {
      setMoved(true);
      setIndex(Math.max(0, Math.min(last, i)));
    },
    [last],
  );

  // focus the skip button once, after first paint (avoids a forced layout during hydration)
  useEffect(() => {
    const id = requestAnimationFrame(() => skipRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  // keyboard
  useEffect(() => {
    if (gone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gone, index, go, close]);

  if (gone) return null;
  const scene = SCENES[index];
  const round = "inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pengenalan VocAZ"
      className={cn("vocaz-intro fixed inset-0 z-[200] flex flex-col overflow-hidden bg-[#061c1a] text-white transition duration-500", closing && "pointer-events-none translate-y-[-3%] opacity-0")}
    >
      {/* backdrop: soft dots + gradient glows (cheap to paint, unlike large blur filters) */}
      <div className="bg-dots-light absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)]" />
      <div className={BACKDROP_CLS} />

      {/* top: brand + skip */}
      <div className={TOP_CLS}>
        <IntroLogo />
        <button ref={skipRef} onClick={() => close()} className={SKIP_CLS}>
          Lewati intro <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* scene: visual left, copy right (stacked copy-first on phones) */}
      <div className="relative flex flex-1 items-center overflow-y-auto">
        <div key={index} className={GRID_CLS}>
          <div className="lg:order-2" aria-live="polite">
            <SceneLabel n={index + 1} animate={moved}>
              {scene.label}
            </SceneLabel>
            <SceneTitle animate={moved}>{scene.title}</SceneTitle>
            <p className={cn("intro-rise d-3", TEXT_CLS)}>{scene.text}</p>
          </div>
          <div className="lg:order-1">
            <scene.Visual onEnter={() => close()} />
          </div>
        </div>
      </div>

      {/* bottom: scene dots (the active one is a filling capsule) + transport controls */}
      <div className={BOTTOM_CLS}>
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.06] p-1.5">
          <button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Adegan sebelumnya" className={cn(round, "hidden sm:inline-flex")}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center px-1">
            {SCENES.map((s, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Adegan ${i + 1}: ${s.label}`}
                aria-current={i === index ? "step" : undefined}
                className={cn("group flex h-9 items-center justify-center", i === index ? "w-12" : "w-6")}
              >
                <span className={cn("relative block h-2 overflow-hidden rounded-full", i === index ? "w-10 bg-white/20" : i < index ? "w-2 bg-brand-300" : "w-2 bg-white/25 group-hover:bg-white/60")}>
                  {i === index && (
                    <span
                      key={index}
                      className="intro-progress absolute inset-0 rounded-full bg-gradient-to-r from-brand-300 to-accent-400"
                      style={{ animationDuration: `${SCENE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                      // last scene stays on screen until the visitor chooses
                      onAnimationEnd={() => index < last && go(index + 1)}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Lanjutkan" : "Jeda"} className={round}>
            {paused ? <Play className="h-4 w-4" fill="currentColor" /> : <Pause className="h-4 w-4" fill="currentColor" />}
          </button>
          <button onClick={() => go(index + 1)} disabled={index === last} aria-label="Adegan berikutnya" className={cn(round, "hidden sm:inline-flex")}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button onClick={() => close(true)} className="text-xs text-white/55 underline-offset-4 transition hover:text-white hover:underline">
          Jangan tampilkan lagi
        </button>
      </div>
    </div>
  );
}
