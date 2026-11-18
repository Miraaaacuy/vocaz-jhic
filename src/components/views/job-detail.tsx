import Link from "@/components/link";
import { Award, Briefcase, Building2, CalendarClock, CheckCircle2, Eye, GraduationCap, MapPin, Users, Wallet } from "lucide-react";
import type { Company, Job } from "@prisma/client";
import type { MatchResult } from "@/lib/match";
import { Avatar, Badge, Card, Chip } from "../ui";
import { VerifiedCompanyMark } from "../badges";
import { MatchPanel } from "./talent-profile";
import { CERT_PREF_LABEL, JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { fmtDate, formatDuration, salaryRange, splitList, strArr, timeAgo } from "@/lib/utils";

export function JobDetailView({
  job,
  companyHref,
  actions,
  match,
  applicants,
}: {
  job: Job & { company: Company & { _count?: { jobs: number } } };
  companyHref: string;
  actions?: React.ReactNode;
  match?: MatchResult;
  applicants?: number;
}) {
  const req = strArr(job.requiredSkills);
  const nice = strArr(job.niceSkills);
  const majors = strArr(job.majors);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar src={job.company.logoUrl} name={job.company.name} size={64} square />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{JOB_TYPE_LABEL[job.type]}</Badge>
                <Badge>{WORK_MODE_LABEL[job.workMode]}</Badge>
                {job.status !== "ACTIVE" && <Badge tone="danger">{job.status === "CLOSED" ? "Ditutup" : "Draft"}</Badge>}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">{job.title}</h1>
              <Link href={companyHref} className="mt-1 inline-flex items-center gap-1.5 font-medium text-body hover:text-brand-600">
                {job.company.name} <VerifiedCompanyMark status={job.company.verificationStatus} />
              </Link>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {job.city}, {job.province}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" /> {job.showSalary ? salaryRange(job.salaryMin, job.salaryMax) : "Gaji kompetitif"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" /> Diposting {timeAgo(job.publishedAt ?? job.createdAt)}
                </span>
              </div>
            </div>
          </div>
          {actions && <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">{actions}</div>}
        </Card>

        {match && <MatchPanel match={match} title="Kecocokan profilmu dengan lowongan ini" />}

        <Card className="space-y-7 p-5 sm:p-7">
          <Block title="Deskripsi Pekerjaan">
            <p className="leading-relaxed whitespace-pre-line text-body">{job.description}</p>
          </Block>
          {job.responsibilities && (
            <Block title="Tanggung Jawab">
              <Bullets items={splitList(job.responsibilities)} />
            </Block>
          )}
          {job.requirements && (
            <Block title="Kualifikasi">
              <Bullets items={splitList(job.requirements)} />
            </Block>
          )}
          <Block title="Skill yang Dibutuhkan">
            <div className="flex flex-wrap gap-2">
              {req.map((s) => (
                <span key={s} className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                  {s}
                </span>
              ))}
            </div>
            {nice.length > 0 && (
              <>
                <p className="mt-4 mb-2 text-sm font-medium text-muted">Nilai tambah:</p>
                <div className="flex flex-wrap gap-2">
                  {nice.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </>
            )}
          </Block>
          {job.benefits && (
            <Block title="Benefit">
              <Bullets items={splitList(job.benefits)} />
            </Block>
          )}
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-ink">Ringkasan</h3>
          <ul className="space-y-3.5 text-sm">
            <Info icon={Briefcase} label="Departemen" value={job.department || "-"} />
            <Info icon={GraduationCap} label="Program keahlian" value={majors.join(", ") || "Semua jurusan"} />
            <Info icon={Award} label="Sertifikasi" value={CERT_PREF_LABEL[job.certification]} />
            <Info icon={Users} label="Pengalaman minimal" value={job.minExperienceMonths ? formatDuration(job.minExperienceMonths) : "Fresh graduate"} />
            <Info icon={Users} label="Kuota" value={`${job.quota} orang`} />
            <Info icon={CalendarClock} label="Batas lamaran" value={fmtDate(job.deadline)} />
            <Info icon={Eye} label="Dilihat" value={`${job.views.toLocaleString("id-ID")} kali${applicants !== undefined ? ` · ${applicants} pelamar` : ""}`} />
          </ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Avatar src={job.company.logoUrl} name={job.company.name} size={48} square />
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-semibold text-ink">
                <span className="truncate">{job.company.name}</span> <VerifiedCompanyMark status={job.company.verificationStatus} />
              </p>
              <p className="text-sm text-muted">{job.company.industry}</p>
            </div>
          </div>
          {job.company.description && <p className="mt-3 line-clamp-4 text-sm text-body">{job.company.description}</p>}
          <Link href={companyHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
            <Building2 className="h-4 w-4" /> Lihat profil perusahaan
          </Link>
        </Card>
      </aside>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2 text-body">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium text-ink">{value}</p>
      </div>
    </li>
  );
}
