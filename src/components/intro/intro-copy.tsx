// Pieces shared by the server-rendered curtain (paints instantly → fast LCP) and the lazily
// loaded intro, so both lay the first scene out identically and the hand-over is seamless.
export const FIRST_LABEL = "Kenapa perlu VocAZ?";
export const FIRST_TEXT = "Nilai di spreadsheet, sertifikat sulit dicek, lamaran lewat WhatsApp — industri sulit menemukan talenta vokasi yang tepat.";
export const TEXT_CLS = "mt-4 hidden max-w-lg text-base leading-relaxed text-white/65 sm:block sm:text-lg";

export function FirstTitle() {
  return (
    <>
      1,6 juta lulusan SMK tiap tahun. <span className="text-brand-300">CV saja tidak cukup.</span>
    </>
  );
}

// layout classes used by both shells
export const TOP_CLS = "relative flex items-center justify-between gap-3 px-5 pt-5 sm:px-10 sm:pt-7";
export const SKIP_CLS = "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20";
export const GRID_CLS = "mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-6 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16";
export const BOTTOM_CLS = "relative flex flex-col items-center gap-3 px-5 pb-5 sm:pb-7";
export const BACKDROP_CLS =
  "absolute inset-0 bg-[radial-gradient(38rem_26rem_at_8%_-5%,rgb(34_144_133/0.38),transparent_70%),radial-gradient(36rem_28rem_at_100%_105%,rgb(242_92_18/0.16),transparent_70%),radial-gradient(26rem_20rem_at_60%_45%,rgb(16_185_129/0.10),transparent_70%)]";

export function IntroLogo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo-white.webp" width={400} height={121} alt="VocAZ" className="h-8 w-auto sm:h-9" />;
}

/** Numbered chip above the headline, e.g. "01 · Kenapa perlu VocAZ?" */
export function SceneLabel({ n, animate, children }: { n: number; animate?: boolean; children: React.ReactNode }) {
  return (
    <p
      className={`${animate ? "intro-rise " : ""}inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 py-1 pr-3.5 pl-1 text-xs font-semibold text-accent-200 sm:text-sm`}
    >
      <span className="rounded-full bg-accent-600 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">{String(n).padStart(2, "0")}</span>
      {children}
    </p>
  );
}

/** Headline; when animated it rises out from behind a mask line instead of fading in */
export function SceneTitle({ as: Tag = "h2", animate, children }: { as?: "h2" | "p"; animate?: boolean; children: React.ReactNode }) {
  return (
    <Tag className="mt-4 text-[28px] leading-[1.12] font-extrabold tracking-tight sm:mt-5 sm:text-5xl lg:text-[54px]">
      <span className="block overflow-hidden pb-1.5">
        <span className={animate ? "intro-reveal block" : "block"}>{children}</span>
      </span>
    </Tag>
  );
}
