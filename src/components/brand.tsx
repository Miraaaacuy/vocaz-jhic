import Link from "@/components/link";
import { SPONSORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ white, className, href = "/", priority }: { white?: boolean; className?: string; href?: string | null; priority?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={white ? "/brand/logo-white.webp" : "/brand/logo.webp"}
      alt="VocAZ — Vocational Career A-Z"
      width={400}
      height={121}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn("h-10 w-auto", className)}
    />
  );
  return href ? (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="VocAZ — beranda">
      {img}
    </Link>
  ) : (
    img
  );
}

/** 5 logo wajib (aturan lomba JHIC) */
export function SponsorStrip({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-8 gap-y-4", className)}>
      {SPONSORS.map((s) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.name}
          src={s.src}
          alt={s.name}
          title={s.name}
          width={s.w}
          height={s.h}
          loading="lazy"
          decoding="async"
          className={cn("w-auto object-contain", compact ? "h-7" : "h-10 sm:h-12")}
        />
      ))}
    </div>
  );
}
