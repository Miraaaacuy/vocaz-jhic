import { Bookmark } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { jobCardInclude } from "@/server/queries";
import { scoreJobsFor } from "@/server/student-queries";
import { JobCard } from "@/components/cards";
import { ButtonLink, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";

export default async function SavedJobs() {
  const { student } = await requireStudent();
  const saved = await db.savedJob.findMany({ where: { studentId: student.id }, include: { job: { include: jobCardInclude } }, orderBy: { createdAt: "desc" } });
  const scored = await scoreJobsFor(student.id, saved.map((s) => s.job));
  return (
    <>
      <PageHeader title="Career Hub" description="Lowongan yang kamu simpan untuk dilamar nanti." />
      <Tabs
        active="/student/career/saved"
        tabs={[
          { href: "/student/career", label: "Explore Jobs" },
          { href: "/student/career/saved", label: "Tersimpan", count: saved.length },
          { href: "/student/career/applications", label: "Lamaran Saya" },
        ]}
      />
      {scored.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {scored.map(({ job, match }) => (
            <div key={job.id} className="relative">
              <JobCard job={job} href={`/student/career/jobs/${job.id}`} match={match.score} />
              {job.status !== "ACTIVE" && <span className="absolute top-3 left-3 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">Ditutup</span>}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Bookmark} title="Belum ada lowongan tersimpan" action={<ButtonLink href="/student/career">Explore Jobs</ButtonLink>} />
        </Card>
      )}
    </>
  );
}
