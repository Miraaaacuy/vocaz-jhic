import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import slugifyLib from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string) {
  return slugifyLib(text, { lower: true, strict: true, locale: "id" });
}

export function uniqueSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeId });
}

export function fmtDate(date: Date | string | null | undefined, pattern = "d MMM yyyy") {
  if (!date) return "-";
  return format(new Date(date), pattern, { locale: localeId });
}

export function fmtMonthYear(date: Date | string | null | undefined) {
  return fmtDate(date, "MMM yyyy");
}

export function rupiah(n: number | null | undefined) {
  if (n == null) return "-";
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    return `Rp${jt % 1 === 0 ? jt : jt.toFixed(1)} jt`;
  }
  return "Rp" + n.toLocaleString("id-ID");
}

export function salaryRange(min?: number | null, max?: number | null) {
  if (!min && !max) return "Gaji dirahasiakan";
  if (min && max) return `${rupiah(min)} – ${rupiah(max)}`;
  return rupiah(min ?? max);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Safely read a Prisma Json column that stores string[] */
export function strArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

export function monthsBetween(start: Date, end: Date | null | undefined) {
  const e = end ?? new Date();
  return Math.max(0, (e.getFullYear() - start.getFullYear()) * 12 + (e.getMonth() - start.getMonth()));
}

export function formatDuration(months: number) {
  if (months < 12) return `${months} bln`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} thn ${m} bln` : `${y} thn`;
}

export function pct(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function splitList(text: string | null | undefined) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function parseCsv(text: FormDataEntryValue | null) {
  return String(text ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** How many of `dates` fall on each of the last `days` days (oldest → today) — feeds StatCard sparklines */
export function dailyCounts(dates: Date[], days = 14): number[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const out = Array.from({ length: days }, () => 0);
  for (const d of dates) {
    const i = Math.floor((d.getTime() - start.getTime()) / 86400000);
    if (i >= 0 && i < days) out[i]++;
  }
  return out;
}
