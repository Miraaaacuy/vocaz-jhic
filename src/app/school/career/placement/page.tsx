import Link from "@/components/link";
import { Building2, Trophy, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { BarChartCard } from "@/components/charts";
import { Avatar, Card, CardHeader, EmptyState, PageHeader, StatCard, Table, Tabs } from "@/components/ui";
import { JOB_TYPE_LABEL } from "@/lib/constants";
import { fmtDate, pct, salaryRange } from "@/lib/utils";
import { CAREER_TABS } from "../tabs";

export default async function Placement() {
  const { school } = await requireSchool();
  const [hired, total] = await Promise.all([
    db.application.findMany({
      where: { status: "HIRED", student: { schoolId: school.id } },
      include: { job: { include: { company: true } }, student: { include: { user: true } } },
      orderBy: { hiredAt: "desc" },
    }),
    db.studentProfile.count({ where: { schoolId: school.id } }),
  ]);
  const students = new Set(hired.map((h) => h.studentId));
  const companies = new Set(hired.map((h) => h.job.companyId));
  const byCompany = Object.entries(hired.reduce<Record<string, number>>((acc, h) => ({ ...acc, [h.job.company.name]: (acc[h.job.company.name] ?? 0) + 1 }), {}))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const avg = hired.length ? Math.round(hired.reduce((a, h) => a + ((h.job.salaryMin ?? 0) + (h.job.salaryMax ?? h.job.salaryMin ?? 0)) / 2, 0) / hired.length) : 0;
  return (
    <>
      <PageHeader title="Career Monitoring" description="Hasil akhir penempatan kerja siswa melalui VocAZ." />
      <Tabs tabs={CAREER_TABS} active="/school/career/placement" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Siswa ditempatkan" value={students.size} icon={Trophy} tone="dark" />
        <StatCard label="Placement rate" value={`${pct(students.size, total)}%`} icon={Users} tone="teal" />
        <StatCard label="Perusahaan penerima" value={companies.size} icon={Building2} tone="sky" />
        <StatCard label="Rata-rata gaji awal" value={avg ? salaryRange(avg, null) : "-"} icon={Wallet} tone="amber" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Daftar penempatan" />
          {hired.length === 0 ? (
            <EmptyState icon={Trophy} title="Belum ada penempatan" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Posisi</th>
                  <th>Perusahaan</th>
                  <th>Tipe</th>
                  <th>Diterima</th>
                </tr>
              </thead>
              <tbody>
                {hired.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <Link href={`/school/students/${h.studentId}`} className="flex items-center gap-2">
                        <Avatar src={h.student.user.avatarUrl} name={h.student.user.name} size={30} />
                        <span className="font-semibold text-ink">{h.student.user.name}</span>
                      </Link>
                    </td>
                    <td className="text-body">{h.job.title}</td>
                    <td className="text-body">{h.job.company.name}</td>
                    <td className="text-muted">{JOB_TYPE_LABEL[h.job.type]}</td>
                    <td className="text-muted">{fmtDate(h.hiredAt ?? h.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader title="Penempatan per perusahaan" />
          <div className="p-4">{byCompany.length ? <BarChartCard data={byCompany.slice(0, 8)} horizontal height={Math.max(160, byCompany.length * 40)} /> : <p className="text-sm text-muted">Belum ada data.</p>}</div>
        </Card>
      </div>
    </>
  );
}
