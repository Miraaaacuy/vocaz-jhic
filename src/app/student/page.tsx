import Link from "@/components/link";
import { ArrowRight, Award, Bell, Bookmark, Briefcase, CheckCircle2, Circle, Eye, PartyPopper, Send, Sparkles, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { jobRequirement, profileCompletion, talentInclude, toMatchTalent, getWeights } from "@/lib/match-data";
import { computeMatch } from "@/lib/match";
import { jobCardInclude } from "@/server/queries";
import { APP_STATUS_LABEL, APP_STATUS_TONE, PIPELINE } from "@/lib/constants";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, WelcomeBanner, Progress, StatCard } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { cn, timeAgo } from "@/lib/utils";

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { user, student } = await requireStudent();
  const [talent, apps, savedCount, notifs, jobs, pendingCerts, weights] = await Promise.all([
    db.studentProfile.findUniqueOrThrow({ where: { id: student.id }, include: talentInclude }),
    db.application.findMany({ where: { studentId: student.id }, include: { job: { include: { company: true } } }, orderBy: { updatedAt: "desc" } }),
    db.savedJob.count({ where: { studentId: student.id } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.job.findMany({ where: { status: "ACTIVE" }, include: jobCardInclude, take: 60, orderBy: { publishedAt: "desc" } }),
    db.certificate.count({ where: { studentId: student.id, status: "PENDING" } }),
    getWeights(),
  ]);
  const completion = profileCompletion(talent);
  const mt = toMatchTalent(talent);
  const recommended = jobs
    .filter((j) => !apps.some((a) => a.jobId === j.id))
    .map((j) => ({ j, m: computeMatch(mt, jobRequirement(j), weights) }))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 4);
  const avgTop = recommended.length ? Math.round(recommended.reduce((a, b) => a + b.m.score, 0) / recommended.length) : 0;
  const readiness = Math.round(completion * 0.5 + avgTop * 0.3 + (talent.certificates.length ? 20 : 0));
  const videoViews = await db.showcaseVideo.aggregate({ where: { studentId: student.id }, _sum: { views: true } });

  const checklist = [
    { done: !!talent.user.avatarUrl && !!talent.headline, label: "Lengkapi foto & headline", href: "/student/profile" },
    { done: talent.skills.length >= 3, label: "Tambahkan minimal 3 skill", href: "/student/profile/skills" },
    { done: talent.experiences.length > 0, label: "Tambahkan pengalaman PKL / proyek", href: "/student/profile/education" },
    { done: talent._count.portfolio > 0, label: "Unggah portfolio", href: "/student/profile/portfolio" },
    { done: talent.certificates.length > 0, label: "Verifikasi sertifikat kompetensi", href: "/student/profile/certifications" },
    { done: talent.videos.length > 0, label: "Upload video showcase", href: "/student/showcase/upload" },
    { done: talent.schoolVerified, label: "Dapatkan verifikasi sekolah", href: "/student/profile" },
  ];
  const active = apps.filter((a) => !["REJECTED", "WITHDRAWN"].includes(a.status));

  return (
    <>
      {welcome && (
        <Card className="mb-6 flex items-center gap-4 border-brand-200 bg-brand-50 p-5">
          <PartyPopper className="h-8 w-8 shrink-0 text-brand-600" />
          <div className="flex-1">
            <p className="font-semibold text-brand-800">Akun berhasil dibuat! Selamat datang di VocAZ.</p>
            <p className="text-sm text-brand-700/80">Lengkapi profilmu agar perusahaan lebih mudah menemukanmu lewat Smart Talent Match.</p>
          </div>
          <ButtonLink href="/student/profile" size="sm">
            Lengkapi profil
          </ButtonLink>
        </Card>
      )}
      <WelcomeBanner tone="brand"
        title={`Halo, ${user.name?.split(" ")[0]} 👋`}
        description="Ini ringkasan perjalanan kariermu hari ini."
        action={
          <ButtonLink variant="white" href="/student/career">
            <Briefcase className="h-4 w-4" /> Cari Lowongan
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Lamaran aktif" value={active.length} icon={Send} variant="solid" />
        <StatCard label="Lowongan tersimpan" value={savedCount} icon={Bookmark} tone="teal" />
        <StatCard label="Views video showcase" value={(videoViews._sum.views ?? 0).toLocaleString("id-ID")} icon={Eye} tone="sky" />
        <StatCard label="Sertifikat terverifikasi" value={talent.certificates.length} icon={Award} tone="amber" hint={pendingCerts ? `${pendingCerts} menunggu verifikasi` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* readiness */}
          <Card className="p-5 sm:p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted">Kelengkapan profil</p>
                <p className="mt-1 text-3xl font-bold text-ink">{completion}%</p>
                <Progress value={completion} className="mt-3" />
                <p className="mt-2 text-xs text-muted">Profil lengkap meningkatkan skor Smart Talent Match.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted">Career readiness</p>
                <p className="mt-1 text-3xl font-bold text-ink">{Math.min(100, readiness)}%</p>
                <Progress value={readiness} tone="teal" className="mt-3" />
                <p className="mt-2 text-xs text-muted">Gabungan kelengkapan profil, kecocokan dengan lowongan, dan sertifikasi.</p>
              </div>
            </div>
          </Card>

          {/* recommended jobs */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" /> Lowongan yang cocok untukmu
                </span>
              }
              description="Diurutkan berdasarkan skor Smart Match dengan profilmu."
              action={
                <Link href="/student/career?sort=match" className="text-sm font-semibold text-brand-600 hover:underline">
                  Lihat semua
                </Link>
              }
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {recommended.map(({ j, m }) => (
                <JobCard key={j.id} job={j} href={`/student/career/jobs/${j.id}`} match={m.score} compact />
              ))}
            </div>
          </Card>

          {/* applications progress */}
          <Card>
            <CardHeader
              title="Progres lamaran"
              action={
                <Link href="/student/career/applications" className="text-sm font-semibold text-brand-600 hover:underline">
                  Semua lamaran
                </Link>
              }
            />
            {apps.length === 0 ? (
              <EmptyState icon={Send} title="Belum ada lamaran" description="Mulai lamar lowongan yang cocok dengan profilmu." action={<ButtonLink href="/student/career">Explore Jobs</ButtonLink>} />
            ) : (
              <ul className="divide-y divide-line">
                {apps.slice(0, 4).map((a) => {
                  const idx = PIPELINE.indexOf(a.status);
                  return (
                    <li key={a.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/student/career/jobs/${a.jobId}`} className="font-semibold text-ink hover:text-brand-600">
                            {a.job.title}
                          </Link>
                          <p className="text-sm text-muted">
                            {a.job.company.name} · {timeAgo(a.updatedAt)}
                          </p>
                        </div>
                        <Badge tone={APP_STATUS_TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                      </div>
                      {idx >= 0 && (
                        <div className="mt-3 flex gap-1">
                          {PIPELINE.map((p, i) => (
                            <span key={p} title={APP_STATUS_LABEL[p]} className={cn("h-1.5 flex-1 rounded-full", i <= idx ? (a.status === "HIRED" ? "bg-emerald-500" : "bg-brand-600") : "bg-line")} />
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Rekomendasi aksi" description={`${checklist.filter((c) => c.done).length}/${checklist.length} selesai`} />
            <ul className="p-3">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-subtle">
                    {c.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="h-5 w-5 shrink-0 text-line-strong" />}
                    <span className={cn("flex-1", c.done ? "text-muted line-through" : "font-medium text-ink")}>{c.label}</span>
                    {!c.done && <ArrowRight className="h-4 w-4 text-muted" />}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Aktivitas terbaru"
              action={
                <Link href="/student/notifications" className="text-sm font-semibold text-brand-600 hover:underline">
                  Semua
                </Link>
              }
            />
            {notifs.length === 0 ? (
              <EmptyState icon={Bell} title="Belum ada aktivitas" />
            ) : (
              <ul className="divide-y divide-line">
                {notifs.map((n) => (
                  <li key={n.id} className="flex gap-3 px-5 py-3.5">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-line-strong" : "bg-brand-600")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      {n.body && <p className="line-clamp-2 text-xs text-muted">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-muted">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {talent.videos.length === 0 && (
            <Card className="bg-ink p-5 text-white">
              <Video className="h-8 w-8 text-brand-400" />
              <p className="mt-3 font-semibold">Tunjukkan skill-mu lewat video</p>
              <p className="mt-1 text-sm text-white/70">Talenta dengan video showcase mendapat bonus skor Smart Match dan lebih sering dilihat recruiter.</p>
              <ButtonLink href="/student/showcase/upload" variant="white" size="sm" className="mt-4">
                Upload video
              </ButtonLink>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
