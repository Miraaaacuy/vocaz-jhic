import Link from "@/components/link";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type React from "react";
import type { Tone } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

/* ─────────────── Button ─────────────── */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        // gradients stay within brand-600…800 / accent-600…700 so white text keeps ≥ 4.5:1 contrast
        primary:
          "bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),var(--shadow-glow)] hover:from-brand-700 hover:to-brand-800 hover:-translate-y-px",
        accent:
          "bg-gradient-to-b from-accent-600 to-accent-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_10px_24px_-10px_rgb(197_74_6/0.6)] hover:from-accent-700 hover:to-accent-800 hover:-translate-y-px",
        dark: "bg-brand-900 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] hover:bg-brand-950",
        secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
        outline: "border border-brand-600 text-brand-700 bg-surface hover:bg-brand-50",
        ghost: "text-body hover:bg-subtle hover:text-ink",
        teal: "bg-teal-600 text-white hover:bg-teal-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        white: "bg-white text-brand-700 hover:bg-brand-50",
        link: "text-brand-600 hover:underline px-0! py-0! h-auto!",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export function Button({ className, variant, size, ...props }: BtnProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  href,
  className,
  variant,
  size,
  children,
  ...rest
}: { href: string; className?: string; children: React.ReactNode } & VariantProps<typeof buttonVariants> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      {children}
    </Link>
  );
}

/* ─────────────── Form fields ─────────────── */
export function Field({
  label,
  hint,
  children,
  className,
  required,
}: {
  label?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-brand-600">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("field", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={cn("field resize-y", props.className)} />;
}

export function Select({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: (string | { value: string; label: string })[];
  placeholder?: string;
}) {
  return (
    <select {...props} className={cn("field appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", props.className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378716c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  );
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-body">
      <input type="checkbox" {...props} className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong" />
      <span>{label}</span>
    </label>
  );
}

/* ─────────────── Card ─────────────── */
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
  icon: Icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** optional icon shown in a tinted tile before the title */
  icon?: LucideIcon;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-6", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[17px] leading-snug font-bold tracking-tight text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─────────────── Badge ─────────────── */
const toneClass: Record<Tone, string> = {
  neutral: "bg-subtle text-body ring-line",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  icon: Icon,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-body ring-1 ring-line/70 ring-inset", className)}>
      {children}
    </span>
  );
}

/* ─────────────── Avatar ─────────────── */
const avatarColors = ["bg-brand-100 text-brand-700", "bg-teal-100 text-teal-700", "bg-amber-100 text-amber-700", "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700"];

export function Avatar({
  src,
  name,
  size = 40,
  className,
  square,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  square?: boolean;
}) {
  const color = avatarColors[(name.charCodeAt(0) + name.length) % avatarColors.length];
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.36) };
  const shape = square ? "rounded-xl" : "rounded-full";
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} loading="lazy" decoding="async" style={style} className={cn(shape, "shrink-0 object-cover bg-subtle", className)} />;
  return (
    <span style={style} className={cn(shape, "inline-flex shrink-0 items-center justify-center font-bold", color, className)}>
      {initials(name)}
    </span>
  );
}

/* ─────────────── Layout helpers ─────────────── */
export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-brand-600">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** Gradient greeting banner for role dashboards */
export function WelcomeBanner({ title, description, action, tone = "brand" }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; tone?: "brand" | "teal" | "dark" }) {
  // every stop is dark enough for white body text (≥ 4.5:1)
  const bg = {
    brand: "bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600",
    teal: "bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700",
    dark: "mesh-dark",
  }[tone];
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date());
  return (
    <div className={cn("relative mb-6 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-pop)] sm:p-8", bg)}>
      <div className="bg-dots-light absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,transparent,black)]" />
      <div className="absolute inset-0 bg-[radial-gradient(26rem_16rem_at_100%_0%,rgb(242_92_18/0.34),transparent_70%)]" />
      <span aria-hidden className="absolute -top-20 -right-12 h-60 w-60 rounded-full border border-white/15" />
      <span aria-hidden className="absolute -top-8 right-20 h-36 w-36 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> {today}
          </p>
          <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-white/85 sm:text-base">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** Tiny trend line for a StatCard — pass real series only */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const w = 84;
  const h = 32;
  const max = Math.max(...data, 1);
  const line = data.map((v, i) => `${i ? "L" : "M"}${((i / (data.length - 1)) * w).toFixed(1)} ${(h - 3 - (v / max) * (h - 7)).toFixed(1)}`).join(" ");
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} fill="none" className={cn("h-8 w-[84px] shrink-0", className)}>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="currentColor" opacity="0.16" />
      <path d={line} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const statTones = {
  brand: { card: "from-brand-50", tile: "from-brand-500 to-brand-700", ink: "text-brand-600" },
  teal: { card: "from-teal-50", tile: "from-teal-500 to-teal-700", ink: "text-teal-600" },
  amber: { card: "from-amber-50", tile: "from-amber-400 to-accent-600", ink: "text-amber-600" },
  sky: { card: "from-sky-50", tile: "from-sky-500 to-sky-700", ink: "text-sky-600" },
  dark: { card: "from-brand-50", tile: "from-brand-600 to-brand-900", ink: "text-brand-700" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "brand",
  hint,
  variant,
  spark,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: number;
  tone?: keyof typeof statTones;
  hint?: string;
  /** "solid" = dark featured card (one per row keeps a dashboard from looking uniform); tone "dark" implies it */
  variant?: "soft" | "solid";
  /** real time series for the mini trend line, oldest → newest */
  spark?: number[];
}) {
  const t = statTones[tone];
  const solid = variant ? variant === "solid" : tone === "dark";
  return (
    <Card className={cn("relative overflow-hidden p-5", solid ? "mesh-dark border-transparent text-white shadow-[var(--shadow-pop)]" : cn("bg-gradient-to-br to-white to-70%", t.card))}>
      {/* watermark icon; skipped when a sparkline already occupies that corner */}
      {Icon && !spark && <Icon aria-hidden strokeWidth={1.5} className={cn("pointer-events-none absolute -right-5 -bottom-6 h-28 w-28 -rotate-12", solid ? "text-white opacity-[0.08]" : cn(t.ink, "opacity-[0.08]"))} />}
      <div className="relative flex items-start justify-between gap-2">
        {Icon && (
          <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm", solid ? "bg-white/15 ring-1 ring-white/20" : cn("bg-gradient-to-br", t.tile))}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              solid ? "bg-white/15 text-white" : trend > 0 ? "bg-emerald-100 text-emerald-800" : trend < 0 ? "bg-red-100 text-red-700" : "bg-subtle text-muted",
            )}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className={cn("relative mt-4 text-sm font-medium", solid ? "text-white/80" : "text-muted")}>{label}</p>
      <div className="relative mt-1 flex items-end justify-between gap-3">
        <p className={cn("text-[30px] leading-none font-extrabold tracking-tight tabular-nums sm:text-[34px]", !solid && "text-ink")}>{value}</p>
        {spark && <Sparkline data={spark} className={solid ? "text-accent-300" : t.ink} />}
      </div>
      {hint && <p className={cn("relative mt-2 text-xs", solid ? "text-white/75" : "text-muted")}>{hint}</p>}
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="relative mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-brand-200/70">
          <span aria-hidden className="absolute -inset-3 rounded-[28px] border border-dashed border-brand-200/80" />
          <Icon className="h-7 w-7" />
        </span>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "teal" | "emerald" }) {
  const bar = { brand: "from-brand-700 to-brand-400", teal: "from-teal-700 to-teal-400", emerald: "from-emerald-600 to-emerald-400" }[tone];
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-subtle", className)}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function SectionTitle({ eyebrow, title, description, center }: { eyebrow?: string; title: string; description?: string; center?: boolean }) {
  return (
    <div className={cn("mb-8", center && "text-center")}>
      {eyebrow && (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-wide text-brand-700 ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          {eyebrow}
        </p>
      )}
      <h2 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">{title}</h2>
      {description && <p className={cn("mt-2 text-muted", center && "mx-auto max-w-2xl")}>{description}</p>}
    </div>
  );
}

export function Tabs({ tabs, active }: { tabs: { href: string; label: string; count?: number }[]; active: string }) {
  return (
    <div className="scrollbar-none -mx-1 mb-6 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-2xl bg-subtle p-1 ring-1 ring-line/60 ring-inset">
        {tabs.map((t) => {
          const on = t.href === active;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition",
                on ? "bg-white text-brand-700 shadow-[var(--shadow-card)]" : "text-muted hover:text-ink",
              )}
            >
              {t.label}
              {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-xs", on ? "bg-brand-600 text-white" : "bg-white text-muted")}>{t.count}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-5 [&_td]:py-4 [&_th]:px-5 [&_th]:py-3 [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-brand-800 [&_thead]:bg-brand-50/70 [&_tbody_tr]:border-t [&_tbody_tr]:border-line/70 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-brand-50/40">
        {children}
      </table>
    </div>
  );
}

export function DescList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{i.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink break-words">{i.value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Pagination({ page, totalPages, makeHref }: { page: number; totalPages: number; makeHref: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          ‹ Sebelumnya
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={makeHref(p)}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold transition",
              p === page ? "bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-[var(--shadow-glow)]" : "text-body hover:bg-subtle",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Berikutnya ›
        </Link>
      )}
    </nav>
  );
}
