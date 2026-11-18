import Link from "@/components/link";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { jobCardInclude } from "@/server/queries";
import { Avatar, Badge, Card, EmptyState, PageHeader, Table, Tabs } from "@/components/ui";
import { VerifiedCompanyMark } from "@/components/badges";
import { JOB_TYPE_LABEL } from "@/lib/constants";
import { cn, fmtDate, strArr } from "@/lib/utils";
import { CAREER_TABS } from "./tabs";

export default async function JobOpportunities({ searchParams }: { searchParams: Promise<{ program?: string; job?: string }> }) {
  const sp = await searchParams;
  const { school } = await requireSchool();
  const programs = strArr(school.programs);
  const [jobs, apps] = await Promise.all([
    db.job.findMany({ where: { status: "ACTIVE" }, include: jobCardInclude, orderBy: { publishedAt: "desc" } }),
    db.application.groupBy({ by: ["jobId"], where: { student: { schoolId: school.id } }, _count: true }),
  ]);
  const relevant = jobs.filter((j) => {
    const m = strArr(j.majors);
    return sp.program ? m.includes(sp.program) : m.some((x) => programs.includes(x)) || m.length === 0;
  });
  const applied = (id: string) => apps.find((a) => a.jobId === id)?._count ?? 0;
  return (
    <>
      <PageHeader title="Career Monitoring" description="Pusat monitoring hubungan siswa dengan dunia kerja." />
      <Tabs tabs={CAREER_TABS} active="/school/career" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/school/career" className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold", !sp.program ? "bg-ink text-white" : "bg-surface ring-1 ring-line")}>
          Semua program ({jobs.filter((j) => strArr(j.majors).some((x) => programs.includes(x))).length})
        </Link>
        {programs.map((p) => (
          <Link key={p} href={`/school/career?program=${encodeURIComponent(p)}`} className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold", sp.program === p ? "bg-ink text-white" : "bg-surface ring-1 ring-line")}>
            {p}
          </Link>
        ))}
      </div>
      <Card>
        {relevant.length === 0 ? (
          <EmptyState icon={Briefcase} title="Belum ada lowongan relevan" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Lowongan</th>
                <th>Tipe</th>
                <th>Program keahlian</th>
                <th>Batas</th>
                <th>Pelamar dari sekolah</th>
              </tr>
            </thead>
            <tbody>
              {relevant.map((j) => (
                <tr key={j.id} className={j.id === sp.job ? "bg-brand-50/60" : undefined}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={j.company.logoUrl} name={j.company.name} size={36} square />
                      <div>
                        <Link href={`/lowongan/${j.id}`} target="_blank" className="font-semibold text-ink hover:text-brand-600">
                          {j.title}
                        </Link>
                        <p className="flex items-center gap-1 text-xs text-muted">
                          {j.company.name} <VerifiedCompanyMark status={j.company.verificationStatus} /> · {j.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge>{JOB_TYPE_LABEL[j.type]}</Badge>
                  </td>
                  <td className="max-w-[220px] text-xs text-body">{strArr(j.majors).join(", ") || "Semua"}</td>
                  <td className="text-muted">{fmtDate(j.deadline)}</td>
                  <td className="font-semibold text-ink">{applied(j.id)} siswa</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
