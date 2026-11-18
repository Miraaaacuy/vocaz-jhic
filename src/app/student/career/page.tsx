import { Briefcase } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { jobCardInclude, jobWhere } from "@/server/queries";
import { scoreJobsFor } from "@/server/student-queries";
import { CITIES, INDUSTRIES, JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { FilterBar, qs } from "@/components/filters";
import { JobCard } from "@/components/cards";
import { Card, EmptyState, PageHeader, Pagination, Tabs } from "@/components/ui";
import { strArr } from "@/lib/utils";

type SP = { q?: string; city?: string; type?: string; mode?: string; industry?: string; sort?: string; mine?: string; page?: string };

export default async function ExploreJobs({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { student } = await requireStudent();
  const page = Math.max(1, Number(sp.page) || 1);
  const rows = await db.job.findMany({ where: jobWhere(sp), include: jobCardInclude, orderBy: { publishedAt: "desc" }, take: 300 });
  let scored = await scoreJobsFor(student.id, rows);
  if (sp.mine === "1" && student.major) scored = scored.filter((s) => strArr(s.job.majors).includes(student.major!));
  if (sp.sort !== "new") scored.sort((a, b) => b.match.score - a.match.score);
  const per = 12;
  const totalPages = Math.ceil(scored.length / per);
  const pageRows = scored.slice((page - 1) * per, page * per);

  return (
    <>
      <PageHeader title="Career Hub" description={`${scored.length} lowongan tersedia — diurutkan berdasarkan kecocokan dengan profilmu.`} />
      <Tabs
        active="/student/career"
        tabs={[
          { href: "/student/career", label: "Explore Jobs" },
          { href: "/student/career/saved", label: "Tersimpan" },
          { href: "/student/career/applications", label: "Lamaran Saya" },
        ]}
      />
      <FilterBar
        action="/student/career"
        q={sp.q}
        qPlaceholder="Posisi, perusahaan…"
        values={sp}
        fields={[
          { type: "select", name: "sort", placeholder: "Urutkan: Paling cocok", options: [{ value: "new", label: "Terbaru" }] },
          { type: "select", name: "city", placeholder: "Semua kota", options: Object.keys(CITIES).sort() },
          { type: "select", name: "type", placeholder: "Tipe", options: Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
          { type: "select", name: "mode", placeholder: "Mode kerja", options: Object.entries(WORK_MODE_LABEL).map(([value, label]) => ({ value, label })) },
          { type: "select", name: "industry", placeholder: "Industri", options: INDUSTRIES },
          { type: "checkbox", name: "mine", label: "Sesuai jurusanku" },
        ]}
      />
      {pageRows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {pageRows.map(({ job, match }) => (
            <JobCard key={job.id} job={job} href={`/student/career/jobs/${job.id}`} match={match.score} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Briefcase} title="Lowongan tidak ditemukan" description="Coba ubah filter pencarian." />
        </Card>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={(p) => `/student/career${qs(sp, { page: p })}`} />
    </>
  );
}
