import Link from "@/components/link";
import { ArrowRight, Award, CheckCircle2, Clock, PartyPopper, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireInstitution } from "@/lib/session";
import { AreaChartCard, DonutChart } from "@/components/charts";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, WelcomeBanner, StatCard } from "@/components/ui";
import { CERT_TYPE_LABEL, INSTITUTION_TYPE_LABEL, VERIFY_STATUS_LABEL } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export default async function InstitutionDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { institution } = await requireInstitution();
  const where = { institutionId: institution.id };
  const [counts, pending, recent, all] = await Promise.all([
    db.certificate.groupBy({ by: ["status"], where, _count: true }),
    db.certificate.findMany({ where: { ...where, status: "PENDING" }, include: { student: { include: { user: true, school: true } } }, orderBy: { createdAt: "asc" }, take: 5 }),
    db.certificate.findMany({ where: { ...where, status: { not: "PENDING" } }, include: { student: { include: { user: true } } }, orderBy: { reviewedAt: "desc" }, take: 6 }),
    db.certificate.findMany({ where, select: { createdAt: true, status: true, reviewedAt: true } }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  // last 6 months trend
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const trend = months.map((m) => {
    const key = (d: Date) => d.getFullYear() * 12 + d.getMonth();
    return {
      name: m.toLocaleDateString("id-ID", { month: "short" }),
      masuk: all.filter((x) => key(x.createdAt) === key(m)).length,
      diverifikasi: all.filter((x) => x.status === "VERIFIED" && x.reviewedAt && key(x.reviewedAt) === key(m)).length,
    };
  });

  return (
    <>
      {welcome && (
        <Card className="mb-6 flex items-center gap-4 border-emerald-200 bg-emerald-50 p-5">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-900">Akun lembaga berhasil dibuat. Siswa kini dapat memilih {institution.name} saat mengunggah sertifikat.</p>
        </Card>
      )}
      <WelcomeBanner tone="teal" title={institution.name} description={`${INSTITUTION_TYPE_LABEL[institution.type]} · Lisensi ${institution.accreditationNumber ?? "-"}`} action={<ButtonLink variant="white" href="/institution/verification">Tinjau permintaan ({c("PENDING")})</ButtonLink>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Menunggu verifikasi" value={c("PENDING")} icon={Clock} tone="amber" variant="solid" />
        <StatCard label="Terverifikasi" value={c("VERIFIED")} icon={CheckCircle2} tone="teal" spark={trend.map((t) => t.diverifikasi)} hint="Per bulan, 6 bulan terakhir" />
        <StatCard label="Ditolak" value={c("REJECTED")} icon={XCircle} />
        <StatCard label="Total sertifikat" value={all.length} icon={Award} tone="sky" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Aktivitas verifikasi" description="6 bulan terakhir" />
          <div className="p-4">
            <AreaChartCard data={trend} keys={[{ key: "masuk", label: "Permintaan masuk", color: "#f25c12" }, { key: "diverifikasi", label: "Diverifikasi", color: "#1a7370" }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Komposisi status" />
          <div className="p-5">
            <DonutChart data={[{ name: "Terverifikasi", value: c("VERIFIED") }, { name: "Menunggu", value: c("PENDING") }, { name: "Ditolak", value: c("REJECTED") }]} height={170} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Antrian verifikasi"
            description="Diurutkan dari yang paling lama menunggu"
            action={
              <Link href="/institution/verification" className="text-sm font-semibold text-brand-600 hover:underline">
                Semua
              </Link>
            }
          />
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Semua permintaan sudah ditinjau 🎉" />
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((p) => (
                <li key={p.id}>
                  <Link href={`/institution/verification/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-subtle">
                    <Avatar src={p.student.user.avatarUrl} name={p.student.user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {p.student.user.name} · {p.student.school?.name} · No. {p.number}
                      </p>
                    </div>
                    <span className="text-xs text-muted">{timeAgo(p.createdAt)}</span>
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Aktivitas terbaru" />
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">{r.student.user.name}</p>
                  <Badge tone={r.status === "VERIFIED" ? "success" : "danger"}>{VERIFY_STATUS_LABEL[r.status]}</Badge>
                </div>
                <p className="truncate text-xs text-muted">
                  {CERT_TYPE_LABEL[r.type]} · {r.reviewedAt && timeAgo(r.reviewedAt)}
                </p>
              </li>
            ))}
            {recent.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted">Belum ada aktivitas</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
