import { Activity, Award, Briefcase, Eye, Users, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AreaChartCard, BarChartCard, DonutChart } from "@/components/charts";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { APP_STATUS_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

export default async function Monitoring() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 86400000);
  const [users, apps, certs, jobs, activity, videos, activeUsers, appByStatus, companies] = await Promise.all([
    db.user.findMany({ select: { createdAt: true, role: true } }),
    db.application.findMany({ select: { createdAt: true, status: true } }),
    db.certificate.findMany({ select: { createdAt: true, status: true, reviewedAt: true } }),
    db.job.findMany({ select: { status: true, publishedAt: true, views: true, company: { select: { industry: true } } } }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    db.showcaseVideo.aggregate({ _sum: { views: true }, _count: true }),
    db.user.count({ where: { lastLoginAt: { gte: since } } }),
    db.application.groupBy({ by: ["status"], _count: true }),
    db.company.groupBy({ by: ["verificationStatus"], _count: true }),
  ]);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(Date.now() - (7 - i) * 7 * 86400000);
    const start = new Date(end.getTime() - 7 * 86400000);
    return { start, end, name: fmtDate(end, "d MMM") };
  });
  const inWeek = (d: Date | null, w: (typeof weeks)[number]) => !!d && d >= w.start && d < w.end;
  const weekly = weeks.map((w) => ({
    name: w.name,
    registrasi: users.filter((u) => inWeek(u.createdAt, w)).length,
    lamaran: apps.filter((a) => inWeek(a.createdAt, w)).length,
    verifikasi: certs.filter((c) => inWeek(c.reviewedAt, w)).length,
  }));
  const byIndustry = Object.entries(jobs.filter((j) => j.status === "ACTIVE").reduce<Record<string, number>>((acc, j) => ({ ...acc, [j.company.industry ?? "Lainnya"]: (acc[j.company.industry ?? "Lainnya"] ?? 0) + 1 }), {}))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader title="Platform Monitoring" description="Kesehatan ekosistem VocAZ secara real-time." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Pengguna aktif (30 hari)" value={activeUsers} icon={Users} />
        <StatCard label="Lamaran total" value={apps.length} icon={Briefcase} tone="sky" />
        <StatCard label="Lowongan aktif" value={jobs.filter((j) => j.status === "ACTIVE").length} icon={Briefcase} tone="teal" />
        <StatCard label="Views lowongan" value={jobs.reduce((a, j) => a + j.views, 0).toLocaleString("id-ID")} icon={Eye} tone="amber" />
        <StatCard label="Video showcase" value={videos._count} icon={Video} hint={`${(videos._sum.views ?? 0).toLocaleString("id-ID")} tayangan`} />
        <StatCard label="Sertifikat diverifikasi" value={certs.filter((c) => c.status === "VERIFIED").length} icon={Award} tone="dark" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader title="Aktivitas mingguan" description="Registrasi pengguna, lamaran, dan verifikasi sertifikat — 8 minggu terakhir" />
          <div className="p-4">
            <AreaChartCard
              height={280}
              data={weekly}
              keys={[
                { key: "registrasi", label: "Registrasi", color: "#1a7370" },
                { key: "lamaran", label: "Lamaran", color: "#10b981" },
                { key: "verifikasi", label: "Verifikasi", color: "#f25c12" },
              ]}
            />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Lowongan aktif per industri" />
          <div className="p-4">
            <BarChartCard data={byIndustry} horizontal height={Math.max(200, byIndustry.length * 36)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Recruitment funnel" />
          <div className="p-5">
            <DonutChart height={170} data={appByStatus.map((a) => ({ name: APP_STATUS_LABEL[a.status], value: a._count }))} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Verifikasi perusahaan" />
          <div className="p-5">
            <DonutChart height={170} data={companies.map((c) => ({ name: c.verificationStatus, value: c._count }))} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={<span className="flex items-center gap-2"><Activity className="h-4 w-4 text-brand-600" /> Log aktivitas platform</span>} />
          <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-muted">{a.action}</span>
                <p className="flex-1 text-sm text-body">{a.message}</p>
                <span className="shrink-0 text-xs text-muted">{fmtDate(a.createdAt, "d MMM HH:mm")}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
