import Link from "@/components/link";
import { ArrowRight, Briefcase, Clock, Eye, MapPin, Play, Users } from "lucide-react";
import type { CompanyVerificationStatus, JobType, WorkMode } from "@prisma/client";
import { Avatar, Card, Chip } from "./ui";
import { MatchBadge, TalentBadges, VerifiedCompanyMark } from "./badges";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { cn, salaryRange, strArr, timeAgo } from "@/lib/utils";

export type TalentCardData = {
  slug: string;
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  major?: string | null;
  city?: string | null;
  schoolName?: string | null;
  schoolVerified?: boolean;
  skills: string[];
  certTypes: string[];
  hasVideo?: boolean;
};

/** Round arrow that fills with the brand colour when its card is hovered */
function ArrowChip() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition duration-300 group-hover:bg-brand-600 group-hover:text-white">
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </span>
  );
}

export function TalentCard({ t, href, match, locked }: { t: TalentCardData; href: string; match?: number; locked?: boolean }) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="card-hover flex h-full flex-col bg-gradient-to-b from-brand-50/70 to-white to-45% p-5">
        <div className="flex items-start gap-4">
          {/* gradient ring: emerald → brand when the school verified this student */}
          <span className={cn("relative shrink-0 rounded-full bg-gradient-to-br p-[3px]", t.schoolVerified ? "from-teal-400 via-brand-500 to-accent-400" : "from-line-strong to-line")}>
            <Avatar src={t.avatarUrl} name={t.name} size={64} className="ring-2 ring-white" />
            {t.hasVideo && (
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-600 text-white ring-2 ring-white">
                <Play className="ml-px h-3 w-3" fill="currentColor" aria-hidden />
                <span className="sr-only">Punya video showcase</span>
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-[17px] font-bold text-ink transition group-hover:text-brand-700">{t.name}</p>
            <p className="truncate text-sm font-medium text-body">{t.headline || t.major || "Talenta SMK"}</p>
            {t.schoolName && <p className="mt-0.5 truncate text-xs text-muted">{t.schoolName}</p>}
          </div>
          {match !== undefined && <MatchBadge score={match} size="sm" className="shrink-0" />}
        </div>
        <div className="mt-4">
          <TalentBadges schoolVerified={t.schoolVerified} certTypes={t.certTypes} small />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {t.skills.slice(0, 4).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
          {t.skills.length > 4 && <Chip className="bg-brand-50 text-brand-700 ring-brand-100">+{t.skills.length - 4}</Chip>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.city || "Indonesia"}</span>
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-brand-700">
            {locked ? "Lihat profil" : "Profil"} <ArrowChip />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export type JobCardData = {
  id: string;
  title: string;
  type: JobType;
  workMode: WorkMode;
  city?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  showSalary?: boolean;
  requiredSkills: unknown;
  publishedAt?: Date | null;
  createdAt: Date;
  company: { name: string; logoUrl?: string | null; verificationStatus: CompanyVerificationStatus };
  _count?: { applications: number };
};

/** published within the last 3 days */
const isNew = (d: Date) => Date.now() - new Date(d).getTime() < 3 * 864e5;

export function JobCard({ job, href, match, compact }: { job: JobCardData; href: string; match?: number; compact?: boolean }) {
  const skills = strArr(job.requiredSkills);
  const pill = "inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-body";
  return (
    <Link href={href} className="group block h-full">
      <Card className={cn("card-hover flex h-full flex-col overflow-hidden", compact ? "p-4" : "p-5")}>
        <span aria-hidden className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-gradient-to-b from-brand-500 to-accent-500 opacity-0 transition duration-300 group-hover:opacity-100" />
        <div className="flex items-start gap-3">
          <Avatar src={job.company.logoUrl} name={job.company.name} size={compact ? 44 : 48} square className="ring-1 ring-line/70" />
          <div className="min-w-0 flex-1">
            <p className={cn("font-bold text-ink transition group-hover:text-brand-700", compact ? "line-clamp-2 text-sm leading-snug" : "line-clamp-1 text-[17px]")}>{job.title}</p>
            <p className="flex items-center gap-1 truncate text-sm text-muted">
              <span className="truncate">{job.company.name}</span>
              <VerifiedCompanyMark status={job.company.verificationStatus} />
            </p>
          </div>
          {match !== undefined && <MatchBadge score={match} size="sm" className="shrink-0" />}
        </div>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {isNew(job.publishedAt ?? job.createdAt) && <span className="inline-flex items-center rounded-full bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-800">Baru</span>}
          <span className={pill}>
            <MapPin className="h-3.5 w-3.5 text-muted" /> {job.city || "-"} · {WORK_MODE_LABEL[job.workMode]}
          </span>
          <span className={pill}>
            <Briefcase className="h-3.5 w-3.5 text-muted" /> {JOB_TYPE_LABEL[job.type]}
          </span>
        </div>
        {!compact && skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((s) => (
              <Chip key={s} className="bg-white">
                {s}
              </Chip>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="rounded-xl bg-brand-50 px-3 py-1.5 text-sm font-extrabold text-brand-800 ring-1 ring-brand-100">
            {job.showSalary === false ? "Gaji kompetitif" : salaryRange(job.salaryMin, job.salaryMax)}
          </span>
          <span className="inline-flex items-center gap-3 text-xs text-muted">
            {!compact && job._count && <span>{job._count.applications} pelamar</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeAgo(job.publishedAt ?? job.createdAt)}
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}

export type CompanyCardData = {
  slug: string;
  name: string;
  logoUrl?: string | null;
  industry?: string | null;
  city?: string | null;
  province?: string | null;
  description?: string | null;
  verificationStatus: CompanyVerificationStatus;
  activeJobs: number;
};

export function CompanyCard({ c, href }: { c: CompanyCardData; href: string }) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="card-hover flex h-full flex-col overflow-hidden">
        <div className="mesh-dark relative h-20">
          <div className="bg-dots-light absolute inset-0 opacity-60" />
          <span aria-hidden className="absolute -top-10 -right-6 h-28 w-28 rounded-full border border-white/15" />
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5">
          <div className="relative z-10 -mt-8">
            <Avatar src={c.logoUrl} name={c.name} size={60} square className="bg-white shadow-[var(--shadow-card)] ring-4 ring-white" />
          </div>
          <p className="mt-3 flex items-center gap-1 text-[17px] font-bold text-ink transition group-hover:text-brand-700">
            <span className="truncate">{c.name}</span>
            <VerifiedCompanyMark status={c.verificationStatus} />
          </p>
          {c.industry && <p className="mt-1.5 inline-flex max-w-full self-start truncate rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-body ring-1 ring-line/70 ring-inset">{c.industry}</p>}
          {c.description && <p className="mt-3 line-clamp-2 text-sm text-body">{c.description}</p>}
          <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-muted">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.city}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-semibold whitespace-nowrap text-brand-700 ring-1 ring-brand-100">
                <Briefcase className="h-3.5 w-3.5" /> {c.activeJobs} lowongan aktif
              </span>
              <ArrowChip />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Video preview without downloading the video: poster image when available,
 * otherwise a metadata-only preview for self-hosted uploads (never for third-party URLs).
 */
export function VideoThumb({ thumbnailUrl, videoUrl, alt, className }: { thumbnailUrl?: string | null; videoUrl: string; alt: string; className?: string }) {
  if (thumbnailUrl)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbnailUrl} alt={alt} width={640} height={360} loading="lazy" decoding="async" className={className} />;
  if (videoUrl.startsWith("/api/files/")) return <video src={`${videoUrl}#t=1.5`} preload="metadata" muted playsInline aria-label={alt} className={className} />;
  return <div aria-label={alt} role="img" className={cn("bg-gradient-to-br from-brand-700 to-brand-950", className)} />;
}

export type VideoCardData = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  videoUrl: string;
  views: number;
  skills: unknown;
  student: { slug: string; major?: string | null; user: { name: string; avatarUrl?: string | null } };
};

export function VideoCard({ v, href, match }: { v: VideoCardData; href: string; match?: number }) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[9/13] overflow-hidden rounded-3xl bg-ink shadow-[var(--shadow-card)] ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-pop)]">
        <VideoThumb thumbnailUrl={v.thumbnailUrl} videoUrl={v.videoUrl} alt={v.title} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/25" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
          <Eye className="h-3 w-3" /> {v.views.toLocaleString("id-ID")}
          <span className="sr-only"> kali ditonton</span>
        </span>
        <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg ring-8 ring-white/20 transition duration-300 group-hover:scale-110 group-hover:ring-white/30">
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        </span>
        {match !== undefined && <MatchBadge score={match} size="sm" className="absolute top-3 right-3" />}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="line-clamp-2 text-sm leading-snug font-bold">{v.title}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar src={v.student.user.avatarUrl} name={v.student.user.name} size={24} className="ring-1 ring-white/60" />
            <span className="truncate text-xs font-medium text-white/90">{v.student.user.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
