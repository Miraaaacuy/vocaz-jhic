import Link from "@/components/link";
import { ArrowRight, BadgeCheck, CheckCheck, Eye, MapPin, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import type { videoInclude } from "@/server/queries";
import { Avatar, ButtonLink, Chip } from "../ui";
import { TalentBadges } from "../badges";
import { strArr, timeAgo } from "@/lib/utils";
import { ReelNav, ReelProvider, ReelVideo } from "./reel-video";

export type ReelRow = Prisma.ShowcaseVideoGetPayload<{ include: typeof videoInclude }>;

/** One-row GET filter (search + optional select) — kept short so the first video is on screen and playing right away */
export function ReelFilter({ action, q, placeholder, select }: { action: string; q?: string; placeholder: string; select?: { name: string; label: string; value?: string; options: string[] } }) {
  return (
    <form action={action} role="search" className="mb-4 flex items-center gap-2">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder={placeholder} className="field h-11 rounded-full! bg-white pl-11" />
      </label>
      {select && (
        <select name={select.name} aria-label={select.label} defaultValue={select.value ?? ""} className="field h-11 w-auto! max-w-[38%] rounded-full! bg-white py-2! pr-8 text-sm sm:max-w-none">
          <option value="">{select.label}</option>
          {select.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      <button aria-label="Terapkan filter" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-[var(--shadow-glow)] transition hover:from-brand-700 hover:to-brand-800">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

/**
 * TikTok-style feed: the *page* is the scroller (document-level scroll snap, see globals.css),
 * so there is no nested scroll area to get stuck in on phones. `top` = height of the sticky
 * bar above the feed (76 public navbar, 64 dashboard top bar).
 */
export function ReelFeed({ top, children, nextHref, prevHref }: { top: number; children: React.ReactNode; nextHref?: string; prevHref?: string }) {
  return (
    <ReelProvider>
      <section data-reel-feed aria-label="Feed video showcase" style={{ ["--reel-top" as string]: `${top}px` }}>
        {children}
        <div className="reel-snap flex flex-col items-center gap-3 py-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <CheckCheck className="h-6 w-6" />
          </span>
          <p className="font-semibold text-ink">{nextHref ? "Masih ada video lain" : "Kamu sudah melihat semua video di sini"}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {prevHref && (
              <ButtonLink href={prevHref} variant="secondary">
                ‹ Sebelumnya
              </ButtonLink>
            )}
            {nextHref && (
              <ButtonLink href={nextHref}>
                Video berikutnya <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            )}
          </div>
        </div>
      </section>
      <ReelNav className="fixed top-1/2 right-5 z-20 hidden -translate-y-1/2 flex-col gap-3 xl:flex" />
    </ReelProvider>
  );
}

/**
 * One full-height slide: the video with its overlay, plus a side column.
 * `info` only shows on desktop (beside the video); `actions` always shows —
 * beside the video on desktop, laid over its bottom edge on phones.
 */
export function ReelSlide({
  v,
  first,
  profileHref,
  badge,
  info,
  actions,
}: {
  v: ReelRow;
  first?: boolean;
  profileHref: string;
  /** top-right of the video, e.g. a MatchBadge */
  badge?: React.ReactNode;
  info?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const s = v.student;
  const verified = s.schoolVerified || s.certificates.length > 0;
  return (
    <article data-reel-slide className="reel-slide" aria-label={v.title}>
      <div className="relative mx-auto flex h-full max-w-5xl items-center justify-center gap-6 py-3 lg:py-5">
        <div className="relative aspect-[9/16] h-full max-w-full overflow-hidden rounded-[28px] bg-ink shadow-[var(--shadow-pop)] ring-1 ring-black/10">
          <ReelVideo id={v.id} src={v.videoUrl} poster={v.thumbnailUrl} title={v.title} eager={first} />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 pr-16">
            {verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" /> Terverifikasi
              </span>
            ) : (
              <span />
            )}
            {badge}
          </div>
          {/* text sits above the action row on phones (pb-20), flush on desktop */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pt-16 pb-20 text-white lg:pb-5">
            <Link href={profileHref} className="pointer-events-auto inline-flex max-w-full items-center gap-2.5">
              <Avatar src={s.user.avatarUrl} name={s.user.name} size={38} className="ring-2 ring-white/70" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{s.user.name}</span>
                <span className="block truncate text-xs text-white/80">{s.headline || s.major || "Talenta SMK"}</span>
              </span>
            </Link>
            <p className="mt-2.5 line-clamp-2 text-[15px] leading-snug font-semibold">{v.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {strArr(v.skills)
                .slice(0, 3)
                .map((k) => (
                  <span key={k} className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                    {k}
                  </span>
                ))}
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-white/80">
                <Eye className="h-3.5 w-3.5" /> {v.views.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-6 z-10 lg:static lg:inset-auto lg:flex lg:max-h-full lg:w-[380px] lg:shrink-0 lg:flex-col">
          <div className="card hidden min-h-0 flex-1 overflow-y-auto p-5 lg:block">
            {info ?? <ReelInfo v={v} profileHref={profileHref} />}
          </div>
          {actions && <div className="flex gap-2 lg:mt-3 [&>*]:flex-1">{actions}</div>}
        </div>
      </div>
    </article>
  );
}

/** Default desktop side panel: who made the video and what it shows */
export function ReelInfo({ v, profileHref, children }: { v: ReelRow; profileHref: string; children?: React.ReactNode }) {
  const s = v.student;
  return (
    <>
      <Link href={profileHref} className="group flex items-center gap-3">
        <Avatar src={s.user.avatarUrl} name={s.user.name} size={52} />
        <span className="min-w-0">
          <span className="block truncate text-lg font-bold text-ink group-hover:text-brand-700">{s.user.name}</span>
          <span className="block truncate text-sm text-muted">{s.headline || s.major || "Talenta SMK"}</span>
        </span>
      </Link>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{[s.city, s.school?.name].filter(Boolean).join(" · ") || "Indonesia"}</span>
      </p>
      <div className="mt-3">
        <TalentBadges schoolVerified={s.schoolVerified} certTypes={s.certificates.map((c) => c.type)} small />
      </div>
      <h2 className="mt-5 text-lg leading-snug font-bold text-ink">{v.title}</h2>
      <p className="mt-1 text-xs text-muted">
        {v.views.toLocaleString("id-ID")} kali ditonton · {timeAgo(v.createdAt)}
      </p>
      {v.description && <p className="mt-3 text-sm leading-relaxed text-body">{v.description}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {strArr(v.skills).map((k) => (
          <Chip key={k}>{k}</Chip>
        ))}
      </div>
      {children}
    </>
  );
}
