import Link from "@/components/link";
import {
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Phone,
  Play,
  School,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import type { FullTalent } from "@/server/queries";
import type { MatchResult } from "@/lib/match";
import { Avatar, Badge, ButtonLink, Card, Chip, Progress } from "../ui";
import { VideoThumb } from "../cards";
import { BnspBadge, CompetencyBadge, IndustryBadge, MatchBadge, SchoolVerifiedBadge } from "../badges";
import { CERT_TYPE_LABEL, EXPERIENCE_TYPE_LABEL, SEEKING_LABEL, SKILL_LEVEL_LABEL } from "@/lib/constants";
import { experienceMonths } from "@/lib/match-data";
import { cn, fmtDate, fmtMonthYear, formatDuration, strArr } from "@/lib/utils";

export function MatchPanel({ match, title = "Mengapa kandidat ini sesuai" }: { match: MatchResult; title?: string }) {
  return (
    <Card className="overflow-hidden border-brand-100">
      <div className="flex items-center gap-4 bg-gradient-to-r from-brand-50 to-canvas px-5 py-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-brand-800">{title}</p>
          <p className="text-xs text-muted">Smart Talent Match · {match.label}</p>
        </div>
        <MatchBadge score={match.score} />
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2">
        <ul className="space-y-2">
          {match.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {r.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />}
              <span className={r.ok ? "text-body" : "text-muted"}>{r.text}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2.5">
          {match.breakdown.map((b) => (
            <div key={b.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-body">{b.label}</span>
                <span className="text-muted">
                  {b.score}/{b.max}
                </span>
              </div>
              <Progress value={(b.score / b.max) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Section({ icon: Icon, title, children, action }: { icon: typeof Briefcase; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Icon className="h-5 w-5 text-brand-600" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Locked({ loginHref, text }: { loginHref: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-canvas px-6 py-8 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Lock className="h-5 w-5" />
      </span>
      <p className="max-w-sm text-sm text-muted">{text}</p>
      <ButtonLink href={loginHref} size="sm">
        Masuk / Daftar
      </ButtonLink>
    </div>
  );
}

export function TalentProfileView({
  t,
  mode,
  actions,
  match,
  loginHref = "/login",
  videoHref,
}: {
  t: FullTalent;
  mode: "public" | "full";
  actions?: React.ReactNode;
  match?: MatchResult;
  loginHref?: string;
  videoHref?: (id: string) => string;
}) {
  const certTypes = t.certificates.map((c) => c.type);
  const expMonths = experienceMonths(t.experiences);
  const competency = t.skills.some((s) => s.verified);
  const isFull = mode === "full";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        {/* Header */}
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-brand-700 via-brand-500 to-accent-500 sm:h-32" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Avatar src={t.user.avatarUrl} name={t.user.name} size={104} className="ring-4 ring-white" />
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-ink">{t.user.name}</h1>
              <p className="mt-0.5 text-body">{t.headline || t.major}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                {t.school && (
                  <span className="inline-flex items-center gap-1">
                    <School className="h-4 w-4" /> {t.school.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> {t.major} · Lulus {t.graduationYear}
                </span>
                {t.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {t.city}
                    {t.willingRelocate && " · bersedia relokasi"}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {certTypes.includes("BNSP") && <BnspBadge />}
                {certTypes.includes("INDUSTRY") && <IndustryBadge />}
                {t.schoolVerified && <SchoolVerifiedBadge />}
                {competency && <CompetencyBadge />}
                <Badge tone={t.seekingStatus === "NOT_LOOKING" ? "neutral" : "success"}>{SEEKING_LABEL[t.seekingStatus]}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {match && <MatchPanel match={match} />}

        {t.bio && (
          <Section icon={Sparkles} title="Tentang">
            <p className="leading-relaxed whitespace-pre-line text-body">{t.bio}</p>
          </Section>
        )}

        {t.videos.length > 0 && (
          <Section icon={Play} title="Video Talent Showcase">
            <div className="grid gap-4 sm:grid-cols-2">
              {t.videos.slice(0, isFull ? 6 : 2).map((v) => (
                <Link key={v.id} href={videoHref ? videoHref(v.id) : `/showcase/${v.id}`} className="group relative block overflow-hidden rounded-xl bg-ink">
                  <VideoThumb thumbnailUrl={v.thumbnailUrl} videoUrl={v.videoUrl} alt={v.title} className="aspect-video w-full object-cover opacity-90 transition group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-600">
                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                  </span>
                  <p className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white">{v.title}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section icon={Briefcase} title="Pengalaman">
          {!isFull ? (
            <Locked loginHref={loginHref} text={`${t.experiences.length} pengalaman (${formatDuration(expMonths)}) — masuk sebagai perusahaan atau siswa untuk melihat detail lengkap.`} />
          ) : t.experiences.length === 0 ? (
            <p className="text-sm text-muted">Belum ada pengalaman yang ditambahkan.</p>
          ) : (
            <ol className="relative space-y-6 border-l border-line pl-6">
              {t.experiences.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute top-1 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-500 bg-white" />
                  <p className="font-semibold text-ink">{e.title}</p>
                  <p className="text-sm text-body">
                    {e.company} · <span className="text-muted">{EXPERIENCE_TYPE_LABEL[e.type]}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {fmtMonthYear(e.startDate)} – {e.endDate ? fmtMonthYear(e.endDate) : "Sekarang"} {e.location && `· ${e.location}`}
                  </p>
                  {e.description && <p className="mt-1.5 text-sm text-body">{e.description}</p>}
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section icon={GraduationCap} title="Pendidikan">
          <div className="space-y-4">
            {t.educations.map((e) => (
              <div key={e.id} className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <School className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{e.institution}</p>
                  <p className="text-sm text-body">
                    {e.degree} {e.field && `· ${e.field}`}
                  </p>
                  <p className="text-xs text-muted">
                    {e.startYear} – {e.endYear ?? "Sekarang"}
                  </p>
                  {isFull && e.description && <p className="mt-1 text-sm text-body">{e.description}</p>}
                </div>
              </div>
            ))}
            {t.educations.length === 0 && <p className="text-sm text-muted">Belum ada data pendidikan.</p>}
          </div>
        </Section>

        <Section icon={Trophy} title="Portfolio">
          {t.portfolio.length === 0 ? (
            <p className="text-sm text-muted">Belum ada portfolio.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {t.portfolio.slice(0, isFull ? 20 : 2).map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-line">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.title} className="aspect-[16/9] w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="font-semibold text-ink">{p.title}</p>
                    {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {strArr(p.tags).map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </div>
                    {isFull && p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                        Lihat proyek <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isFull && t.portfolio.length > 2 && <p className="mt-3 text-sm text-muted">+{t.portfolio.length - 2} portfolio lainnya setelah masuk.</p>}
        </Section>

        {t.achievements.length > 0 && (
          <Section icon={Award} title="Prestasi">
            <ul className="space-y-3">
              {t.achievements.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <p className="font-semibold text-ink">{a.title}</p>
                    <p className="text-sm text-muted">
                      {a.issuer} {a.date && `· ${fmtMonthYear(a.date)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">Keahlian</h3>
          <div className="space-y-2.5">
            {t.skills.map((s) => (
              <div key={s.skillId} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-body">
                  {s.skill.name}
                  {s.verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-label="Terverifikasi" />}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    s.level === "ADVANCED" ? "bg-brand-50 text-brand-700" : s.level === "INTERMEDIATE" ? "bg-amber-50 text-amber-700" : "bg-subtle text-muted",
                  )}
                >
                  {SKILL_LEVEL_LABEL[s.level]}
                </span>
              </div>
            ))}
            {t.skills.length === 0 && <p className="text-sm text-muted">Belum ada skill.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">Keamanan & Verifikasi</h3>
          <div className="space-y-3">
            {t.certificates.map((c) => (
              <div key={c.id} className="rounded-xl border border-line bg-canvas p-3">
                <div className="flex items-start gap-2">
                  <Award className={cn("mt-0.5 h-5 w-5 shrink-0", c.type === "BNSP" ? "text-amber-500" : c.type === "INDUSTRY" ? "text-blue-600" : "text-teal-600")} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-muted">{c.institution?.name ?? c.issuer}</p>
                    <p className="mt-1 text-xs text-muted">
                      {CERT_TYPE_LABEL[c.type]} · {fmtDate(c.issuedAt, "MMM yyyy")}
                    </p>
                    {isFull && <p className="mt-0.5 font-mono text-[11px] text-muted">No. {c.number}</p>}
                  </div>
                </div>
              </div>
            ))}
            {t.certificates.length === 0 && <p className="text-sm text-muted">Belum ada sertifikat terverifikasi.</p>}
            <div className="flex items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-xs">
              <School className="h-4 w-4 text-sky-600" />
              {t.schoolVerified ? "Status siswa diverifikasi oleh sekolah" : "Status siswa belum diverifikasi sekolah"}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">Kontak</h3>
          {isFull ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-body">
                <Mail className="h-4 w-4 text-muted" /> {t.user.email}
              </p>
              {t.githubUrl && (
                <a href={t.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> GitHub
                </a>
              )}
              {t.linkedinUrl && (
                <a href={t.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {t.websiteUrl && (
                <a href={t.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> Website
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> ••••••@••••.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> 08•• •••• ••••
              </p>
              <ButtonLink href={loginHref} size="sm" variant="outline" className="mt-2 w-full">
                <Lock className="h-3.5 w-3.5" /> Masuk untuk menghubungi
              </ButtonLink>
            </div>
          )}
        </Card>
      </aside>
    </div>
  );
}
