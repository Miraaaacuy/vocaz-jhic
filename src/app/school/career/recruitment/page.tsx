import Link from "@/components/link";
import { Briefcase } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { Avatar, Badge, Card, EmptyState, PageHeader, StatCard, Table, Tabs } from "@/components/ui";
import { MatchBadge } from "@/components/badges";
import { APP_STATUS_LABEL, APP_STATUS_TONE, PIPELINE } from "@/lib/constants";
import { cn, fmtDate } from "@/lib/utils";
import { CAREER_TABS } from "../tabs";

export default async function RecruitmentStatus({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { school } = await requireSchool();
  const all = await db.application.findMany({
    where: { student: { schoolId: school.id } },
    include: { job: { include: { company: true } }, student: { include: { user: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const list = status ? all.filter((a) => a.status === status) : all;
  const c = (s: ApplicationStatus) => all.filter((a) => a.status === s).length;
  return (
    <>
      <PageHeader title="Career Monitoring" description="Perkembangan siswa dalam proses rekrutmen perusahaan." />
      <Tabs tabs={CAREER_TABS} active="/school/career/recruitment" />
      <div className="mb-5 grid grid-cols-3 gap-3 md:grid-cols-6">
        {PIPELINE.map((s) => (
          <Link key={s} href={`/school/career/recruitment?status=${s}`}>
            <StatCard label={APP_STATUS_LABEL[s]} value={c(s)} />
          </Link>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/school/career/recruitment" className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold", !status ? "bg-ink text-white" : "bg-surface ring-1 ring-line")}>
          Semua ({all.length})
        </Link>
        {[...PIPELINE, "REJECTED" as ApplicationStatus].map((s) => (
          <Link key={s} href={`/school/career/recruitment?status=${s}`} className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold", status === s ? "bg-ink text-white" : "bg-surface ring-1 ring-line")}>
            {APP_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <Card>
        {list.length === 0 ? (
          <EmptyState icon={Briefcase} title="Tidak ada data" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Lowongan</th>
                <th>Match</th>
                <th>Dilamar</th>
                <th>Update</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/school/students/${a.studentId}`} className="flex items-center gap-3">
                      <Avatar src={a.student.user.avatarUrl} name={a.student.user.name} size={32} />
                      <span className="font-semibold text-ink hover:text-brand-600">{a.student.user.name}</span>
                    </Link>
                  </td>
                  <td>
                    <p className="text-ink">{a.job.title}</p>
                    <p className="text-xs text-muted">{a.job.company.name}</p>
                  </td>
                  <td>
                    <MatchBadge score={a.matchScore} size="sm" />
                  </td>
                  <td className="text-muted">{fmtDate(a.createdAt)}</td>
                  <td className="text-muted">{fmtDate(a.updatedAt)}</td>
                  <td>
                    <Badge tone={APP_STATUS_TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
