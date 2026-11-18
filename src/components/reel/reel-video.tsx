"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Play, Volume2, VolumeX } from "lucide-react";
import { countVideoView } from "@/server/common-actions";

/** Sound is one setting for the whole feed: unmute once, every next video plays with sound. */
const SoundCtx = createContext<{ muted: boolean; toggle: () => void }>({ muted: true, toggle: () => {} });

export function ReelProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(true); // browsers only allow autoplay while muted
  return <SoundCtx.Provider value={{ muted, toggle: () => setMuted((m) => !m) }}>{children}</SoundCtx.Provider>;
}

// one view per video per page session
const counted = new Set<string>();

/**
 * One slide's player. Nothing is downloaded until the slide is actually on screen:
 * until then only the poster image shows. Plays while ≥60% visible, pauses and rewinds otherwise.
 */
export function ReelVideo({ id, src, poster, title, eager }: { id: string; src: string; poster?: string | null; title: string; eager?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const { muted, toggle } = useContext(SoundCtx);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false); // src attached after the first activation
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);

  // visible enough → active (also true inside nested scrollers: the viewport intersection accounts for clipping)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        const on = e.intersectionRatio >= 0.6;
        setActive(on);
        if (!on) setUserPaused(reduced); // leaving resets a manual pause (reduced motion: never autoplay)
        else if (reduced) setUserPaused(true);
        if (on) {
          // the first video waits for the page to finish loading, so it never competes with the initial render
          if (document.readyState === "complete") setLoaded(true);
          else window.addEventListener("load", () => setLoaded(true), { once: true });
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = muted;
    if (active && loaded && !userPaused && !document.hidden) v.play().catch(() => {});
    else {
      v.pause();
      if (!active && v.currentTime) v.currentTime = 0;
    }
  }, [active, loaded, userPaused, muted]);

  // stop when the tab is hidden, resume when it comes back
  useEffect(() => {
    const onVis = () => {
      const v = video.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else if (active && loaded && !userPaused) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, loaded, userPaused]);

  return (
    <div ref={box} className="absolute inset-0">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" width={640} height={360} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <video
        ref={video}
        src={loaded ? src : undefined}
        // externally hosted demo videos are requested without credentials, so their CDN cannot set third-party cookies
        crossOrigin={/^https?:/.test(src) ? "anonymous" : undefined}
        preload="none"
        muted
        loop
        playsInline
        aria-label={title}
        className="absolute inset-0 h-full w-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
          if (v.currentTime >= 2 && !counted.has(id)) {
            counted.add(id);
            countVideoView(id).catch(() => {});
          }
        }}
      />
      <button type="button" onClick={() => setUserPaused((p) => !p)} aria-label={playing ? `Jeda video: ${title}` : `Putar video: ${title}`} className="absolute inset-0 flex items-center justify-center">
        {active && !playing && (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white ring-8 ring-white/15">
            <Play className="ml-1 h-7 w-7" fill="currentColor" />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
        aria-pressed={!muted}
        className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      <span aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/20">
        <span ref={bar} className="block h-full origin-left scale-x-0 bg-accent-400" />
      </span>
    </div>
  );
}

/**
 * ▲▼ buttons (+ ↑/↓ keys in page mode). Without `scope` the page itself is the scroller
 * (document-level snap); with `scope` it drives the element with that id (the phone frame on the homepage).
 */
export function ReelNav({ scope, className }: { scope?: string; className?: string }) {
  const move = (dir: 1 | -1) => {
    if (scope) {
      const el = document.getElementById(scope);
      el?.scrollBy({ top: dir * el.clientHeight, behavior: "smooth" });
      return;
    }
    const slide = document.querySelector<HTMLElement>("[data-reel-slide]");
    if (slide) window.scrollBy({ top: dir * slide.offsetHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (scope) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable], [role=dialog]") || e.altKey || e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const slide = document.querySelector<HTMLElement>("[data-reel-slide]");
      if (slide) window.scrollBy({ top: (e.key === "ArrowDown" ? 1 : -1) * slide.offsetHeight, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scope]);

  const btn = "flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[var(--shadow-card)] transition hover:bg-brand-50 hover:text-brand-700";
  return (
    <div className={className}>
      <button type="button" onClick={() => move(-1)} aria-label="Video sebelumnya" className={btn}>
        <ChevronUp className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => move(1)} aria-label="Video berikutnya" className={btn}>
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
