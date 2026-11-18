import type { LucideIcon } from "lucide-react";

/** Rounded green banner for public directory pages (Talenta, Lowongan, …) */
export function PublicHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stats?: { label: string; value: string | number }[];
}) {
  return (
    <section className="px-3 pt-3 sm:px-4">
      <div className="mesh-dark relative mx-auto max-w-7xl overflow-hidden rounded-[36px] text-white shadow-[var(--shadow-pop)]">
        <span aria-hidden className="absolute -top-24 -left-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="bg-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Icon className="absolute top-1/2 right-10 hidden h-52 w-52 -translate-y-1/2 -rotate-6 text-white/[0.07] lg:block" strokeWidth={1.1} aria-hidden />
        <div className="relative px-6 pt-12 pb-20 sm:px-10 sm:pt-14 sm:pb-24 lg:px-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-accent-200 ring-1 ring-white/15">
            <Icon className="h-3.5 w-3.5" aria-hidden /> {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-[-0.03em] sm:text-[42px] lg:text-[54px]">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">{description}</p>
          {stats.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.09] px-4 py-3 ring-1 ring-white/15">
                  <p className="text-2xl leading-none font-extrabold tabular-nums">{typeof s.value === "number" ? s.value.toLocaleString("id-ID") : s.value}</p>
                  <p className="mt-1 text-xs text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
