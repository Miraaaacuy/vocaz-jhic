import Link from "@/components/link";
import { ArrowRight, Briefcase, ChevronRight, Clock, MapPin, PartyPopper, PlusCircle, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, UserPlus, Users, UserSearch, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { preferenceRequirement, scoreTalents, talentInclude } from "@/lib/match-data";
import { BarChartCard } from "@/components/charts";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, WelcomeBanner, StatCard } from "@/components/ui";
import { MatchBadge, TalentBadges } from "@/components/badges";
import { COMPANY_VERIFY_LABEL, JOB_TYPE_LABEL } from "@/lib/constants";
import { dailyCounts, pct, timeAgo } from "@/lib/utils";

export default async function CompanyDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { company, user } = await requireCompany();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [jobs, totalApps, newToday, lastWeekApps, saved, recentApps, pref, candidates] = await Promise.all([
    db.job.findMany({ where: { companyId: company.id, status: "ACTIVE" }, include: { _count: { select: { applications: true } } }, orderBy: { publishedAt: "desc" } }),
    db.application.count({ where: { job: { companyId: company.id } } }),
    db.application.count({ where: { job: { companyId: company.id }, createdAt: { gte: startToday } } }),
    db.application.count({ where: { job: { companyId: company.id }, createdAt: { gte: weekAgo } } }),
    db.savedTalent.count({ where: { companyId: company.id } }),
    db.application.findMany({
      where: { job: { companyId: company.id } },
      include: { job: { select: { title: true, id: true } }, student: { include: { user: true, certificates: { where: { status: "VERIFIED" }, select: { type: true } }, skills: { include: { skill: true }, take: 3 } } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.talentPreference.findUnique({ where: { companyId: company.id } }),
    db.studentProfile.findMany({ where: { hidden: false, seekingStatus: { not: "NOT_LOOKING" } }, include: talentInclude, take: 150 }),
  ]);
  const top = (await scoreTalents(candidates, preferenceRequirement(pref))).slice(0, 3);
  const chart = jobs.slice(0, 8).map((j) => ({ name: j.title.length > 16 ? j.title.slice(0, 15) + "…" : j.title, value: j._count.applications }));
  // applications per day for the last 14 days → sparkline on the "Total Pelamar" card
  const recentDates = await db.application.findMany({ where: { job: { companyId: company.id }, createdAt: { gte: new Date(Date.now() - 14 * 86400000) } }, select: { createdAt: true } });
  const appsPerDay = dailyCounts(recentDates.map((a) => a.createdAt));
  const verifiedApplicants = await db.application.count({ where: { job: { companyId: company.id }, student: { certificates: { some: { status: "VERIFIED", type: "BNSP" } } } } });
  const schoolVerifiedApplicants = await db.application.count({ where: { job: { companyId: company.id }, student: { schoolVerified: true } } });

  return (
    <>
      {welcome && (
        <Card className="mb-6 flex flex-col gap-4 border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          <PartyPopper className="h-8 w-8 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">Pendaftaran selesai! Akun {company.name} siap digunakan.</p>
            <p className="text-sm text-emerald-800/80">Lengkapi profil perusahaan, atur Talent Preferences, dan pasang lowongan pertama Anda.</p>
          </div>
          <ButtonLink href="/company/recruitment/new" size="sm" variant="success">
            Pasang lowongan
          </ButtonLink>
        </Card>
      )}
      <WelcomeBanner tone="brand" title={`Selamat Datang, ${company.name} 👋`} description={`Berikut ringkasan aktivitas rekrutmen Anda hari ini, ${user.name?.split(" ")[0]}.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Lowongan Aktif" value={jobs.length} icon={Briefcase} />
        <StatCard label="Total Pelamar" value={totalApps} icon={Users} trend={totalApps ? Math.round((lastWeekApps / Math.max(1, totalApps - lastWeekApps)) * 100) : 0} spark={appsPerDay} hint="Pelamar baru per hari, 14 hari terakhir" />
        <StatCard label="Talent Pool" value={saved} icon={UserSearch} tone="teal" />
        <StatCard label="Pelamar Baru (Hari Ini)" value={newToday} icon={UserPlus} tone="dark" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Ringkasan Rekrutmen" description="Jumlah pelamar per lowongan aktif" action={<Badge>30 hari terakhir</Badge>} />
            <div className="p-4">{chart.length ? <BarChartCard data={chart} /> : <EmptyState icon={Briefcase} title="Belum ada lowongan aktif" />}</div>
          </Card>

          <Card>
            <CardHeader
              title="Lowongan Aktif"
              action={
                <Link href="/company/recruitment" className="text-sm font-semibold text-brand-600 hover:underline">
                  Lihat Semua
                </Link>
              }
            />
            <ul className="space-y-3 p-4">
              {jobs.slice(0, 4).map((j) => (
                <li key={j.id}>
                  <Link href={`/company/recruitment/${j.id}`} className="flex items-center gap-4 rounded-xl border border-line px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/30">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{j.title}</p>
                      <p className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {j.city}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {JOB_TYPE_LABEL[j.type]}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">{j._count.applications}</p>
                      <p className="text-xs text-muted">Pelamar</p>
                    </div>
                    <Badge tone="success">Aktif</Badge>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
              {jobs.length === 0 && <EmptyState icon={Briefcase} title="Belum ada lowongan aktif" action={<ButtonLink href="/company/recruitment/new">Post Job</ButtonLink>} />}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Pelamar Terbaru"
              action={
                <Link href="/company/recruitment" className="text-sm font-semibold text-brand-600 hover:underline">
                  Lihat Pipeline
                </Link>
              }
            />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {recentApps.map((a) => (
                <div key={a.id} className="rounded-xl border border-line bg-canvas p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={a.student.user.avatarUrl} name={a.student.user.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{a.student.user.name}</p>
                      <p className="truncate text-xs text-muted">{a.job.title}</p>
                    </div>
                    <MatchBadge score={a.matchScore} size="sm" />
                  </div>
                  <div className="mt-2">
                    <TalentBadges schoolVerified={a.student.schoolVerified} certTypes={a.student.certificates.map((c) => c.type)} small />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted">Melamar {timeAgo(a.createdAt)}</span>
                    <Link href={`/company/recruitment/${a.job.id}?app=${a.id}`} className="font-semibold text-brand-600 hover:underline">
                      Tinjau Profil
                    </Link>
                  </div>
                </div>
              ))}
              {recentApps.length === 0 && <p className="text-sm text-muted">Belum ada pelamar.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-ink">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["/company/recruitment/new", PlusCircle, "Post Job", true],
                ["/company/talent-match", ScanSearch, "Find Talent", false],
                ["/company/recruitment", Users, "Applicants", false],
                ["/company/profile", Building2, "Profil", false],
              ].map(([href, Icon, label, primary]) => {
                const I = Icon as typeof Users;
                return (
                  <Link
                    key={href as string}
                    href={href as string}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-semibold transition ${primary ? "border-brand-700 bg-brand-700 text-white hover:bg-brand-800" : "border-line bg-canvas text-body hover:border-brand-200 hover:bg-brand-50"}`}
                  >
                    <I className="h-5 w-5" /> {label as string}
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-50 to-canvas p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink">
                <Sparkles className="h-4 w-4 text-brand-600" /> Smart Talent Match
              </h3>
              <p className="mt-1 text-xs text-muted">Kandidat paling cocok dengan Talent Preferences Anda.</p>
            </div>
            <ul className="space-y-2 p-4">
              {top.map(({ talent, match }) => (
                <li key={talent.id}>
                  <Link href={`/company/talent-match/${talent.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:border-brand-200">
                    <Avatar src={talent.user.avatarUrl} name={talent.user.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{talent.user.name}</p>
                      <p className="truncate text-xs text-muted">{talent.headline}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{match.score}% Match</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 pb-4">
              <ButtonLink href="/company/talent-match" variant="outline" className="w-full">
                Jelajahi Smart Match <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-ink">Keamanan & Verifikasi</h3>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-canvas p-3">
              {company.verificationStatus === "VERIFIED" ? <ShieldCheck className="h-6 w-6 text-teal-600" /> : <ShieldAlert className="h-6 w-6 text-amber-500" />}
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{COMPANY_VERIFY_LABEL[company.verificationStatus]}</p>
                {company.verificationStatus !== "VERIFIED" && (
                  <Link href="/company/verification" className="text-xs font-semibold text-brand-600 hover:underline">
                    {company.verificationStatus === "PENDING" ? "Lihat status" : "Ajukan verifikasi"} →
                  </Link>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">Kualitas profil dari himpunan pelamar Anda</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {pct(Math.max(verifiedApplicants, schoolVerifiedApplicants), totalApps)}% <span className="text-sm font-medium text-muted">Verified</span>
            </p>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-subtle">
              <div className="bg-emerald-600" style={{ width: `${pct(verifiedApplicants, totalApps)}%` }} />
              <div className="bg-brand-700" style={{ width: `${Math.max(0, pct(schoolVerifiedApplicants, totalApps) - pct(verifiedApplicants, totalApps))}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> BNSP Certified ({pct(verifiedApplicants, totalApps)}%)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-brand-700" /> Sekolah ({pct(schoolVerifiedApplicants, totalApps)}%)
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
