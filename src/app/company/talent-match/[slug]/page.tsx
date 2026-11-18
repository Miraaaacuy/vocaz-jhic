import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { getTalent } from "@/server/queries";
import { jobRequirement, preferenceRequirement, scoreOne, talentInclude } from "@/lib/match-data";
import { toggleSaveTalent } from "@/server/company-actions";
import { TalentProfileView } from "@/components/views/talent-profile";
import { ActionButton } from "@/components/forms";
import { ContactButton } from "@/components/contact-button";
import { ReportButton } from "@/components/report-button";
import { Card } from "@/components/ui";

export default async function CompanyTalentProfile({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ job?: string }> }) {
  const { slug } = await params;
  const { job: jobId } = await searchParams;
  const { company } = await requireCompany();
  const t = await getTalent(slug);
  if (!t) notFound();
  const [row, job, pref, saved, jobs] = await Promise.all([
    db.studentProfile.findUniqueOrThrow({ where: { id: t.id }, include: talentInclude }),
    jobId ? db.job.findFirst({ where: { id: jobId, companyId: company.id } }) : null,
    db.talentPreference.findUnique({ where: { companyId: company.id } }),
    db.savedTalent.findUnique({ where: { companyId_studentId: { companyId: company.id, studentId: t.id } } }),
    db.job.findMany({ where: { companyId: company.id, status: "ACTIVE" }, select: { id: true, title: true } }),
  ]);
  const match = await scoreOne(row, job ? jobRequirement(job) : preferenceRequirement(pref));

  return (
    <>
      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted">
          Dinilai terhadap: <b className="text-ink">{job ? `Lowongan ${job.title}` : "Talent Preferences"}</b>
        </p>
        <form className="flex gap-2">
          <select name="job" defaultValue={jobId ?? ""} className="field w-auto! py-2!">
            <option value="">Talent Preferences</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-ink px-3 text-sm font-semibold text-white">Ubah</button>
        </form>
      </Card>
      <TalentProfileView
        t={t}
        mode="full"
        match={match}
        videoHref={(id) => `/company/showcase/${id}`}
        actions={
          <>
            <ActionButton action={toggleSaveTalent} data={{ studentId: t.id }} variant="secondary" size="sm">
              {saved ? <BookmarkCheck className="h-4 w-4 text-brand-600" /> : <Bookmark className="h-4 w-4" />} {saved ? "Tersimpan" : "Save"}
            </ActionButton>
            <ContactButton userId={t.userId} name={t.user.name} subject={job?.title} />
            <ReportButton type="PROFILE" id={t.id} label={t.user.name} compact />
          </>
        }
      />
    </>
  );
}
