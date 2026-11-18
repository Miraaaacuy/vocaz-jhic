import Link from "@/components/link";
import { Activity, Award, Briefcase, Building2, Flag, GraduationCap, School, ShieldAlert, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AreaChartCard, DonutChart } from "@/components/charts";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, WelcomeBanner, StatCard } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export default async function AdminDashboard() {
  await requireAdmin();
  const [roles, companies, pendingCompanies, openReports, activities, users] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: true }),
    db.company.count(),
    db.company.findMany({ where: { verificationStatus: "PENDING" }, include: { verifications: { orderBy: { submittedAt: "desc" }, take: 1 } }, take: 5 }),
    db.report.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 5, include: { reporter: { select: { name: true } } } }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.user.findMany({ select: { createdAt: true, role: true } }),
  ]);
  const r = (role: string) => roles.find((x) => x.role === role)?._count ?? 0;
  const total = roles.reduce((a, b) => a + b._count, 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const k = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const growth = months.map((m) => ({
    name: m.toLocaleDateString("id-ID", { month: "short" }),
    siswa: users.filter((u) => u.role === "STUDENT" && k(u.createdAt) <= k(m)).length,
    perusahaan: users.filter((u) => u.role === "COMPANY" && k(u.createdAt) <= k(m)).length,
  }));

  return (
    <>
      <WelcomeBanner tone="dark" title="Dashboard Super Admin" description="Manage → Verify → Moderate → Monitor" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={total} icon={Users} spark={months.map((m) => users.filter((x) => k(x.createdAt) <= k(m)).length)} hint="Pertumbuhan 6 bulan terakhir" />
        <StatCard label="Siswa" value={r("STUDENT")} icon={GraduationCap} tone="sky" spark={growth.map((g) => g.siswa)} />
        <StatCard label="Perusahaan" value={companies} icon={Building2} tone="teal" />
        <StatCard label="Sekolah / BKK" value={r("SCHOOL")} icon={School} tone="amber" />
        <StatCard label="Lembaga sertifikasi" value={r("INSTITUTION")} icon={Award} />
        <StatCard label="Laporan terbuka" value={openReports.length} icon={Flag} tone="dark" />
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pertumbuhan pengguna" description="Kumulatif 6 bulan terakhir" action={<ButtonLink href="/admin/monitoring" variant="link" size="sm">Monitoring →</ButtonLink>} />
          <div className="p-4">
            <AreaChartCard data={growth} keys={[{ key: "siswa", label: "Siswa" }, { key: "perusahaan", label: "Perusahaan" }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Komposisi akun" />
          <div className="p-5">
            <DonutChart
              height={170}
              data={[
                { name: "Siswa", value: r("STUDENT") },
                { name: "Perusahaan", value: r("COMPANY") },
                { name: "Sekolah", value: r("SCHOOL") },
                { name: "Lembaga", value: r("INSTITUTION") },
                { name: "Admin", value: r("ADMIN") },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Verifikasi perusahaan" description={`${pendingCompanies.length} menunggu`} action={<Link href="/admin/company-verification" className="text-sm font-semibold text-brand-600 hover:underline">Semua</Link>} />
          {pendingCompanies.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Tidak ada antrian" />
          ) : (
            <ul className="divide-y divide-line">
              {pendingCompanies.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/company-verification/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-subtle">
                    <Avatar src={c.logoUrl} name={c.name} size={36} square />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{c.verifications[0] && timeAgo(c.verifications[0].submittedAt)}</p>
                    </div>
                    <Badge tone="warning">Review</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Konten dilaporkan" action={<Link href="/admin/moderation" className="text-sm font-semibold text-brand-600 hover:underline">Semua</Link>} />
          {openReports.length === 0 ? (
            <EmptyState icon={Flag} title="Tidak ada laporan terbuka" />
          ) : (
            <ul className="divide-y divide-line">
              {openReports.map((x) => (
                <li key={x.id}>
                  <Link href={`/admin/moderation/${x.id}`} className="block px-5 py-3 hover:bg-subtle">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{x.targetLabel}</p>
                      <Badge tone="danger">{x.targetType}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {x.reason} · {timeAgo(x.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Activity className="h-4 w-4 text-brand-600" /> Aktivitas terbaru</span>} />
          <ul className="divide-y divide-line">
            {activities.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <p className="text-sm text-body">{a.message}</p>
                <p className="text-[11px] text-muted">{timeAgo(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Lowongan aktif" value={await db.job.count({ where: { status: "ACTIVE" } })} icon={Briefcase} />
        <StatCard label="Lamaran" value={await db.application.count()} icon={Users} tone="sky" />
        <StatCard label="Diterima kerja" value={await db.application.count({ where: { status: "HIRED" } })} icon={GraduationCap} tone="teal" />
        <StatCard label="Sertifikat terverifikasi" value={await db.certificate.count({ where: { status: "VERIFIED" } })} icon={Award} tone="amber" />
      </div>
    </>
  );
}
