import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck, CheckCircle2, Flag, Send } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { getJob } from "@/server/queries";
import { scoreJobsFor } from "@/server/student-queries";
import { applyJob, toggleSaveJob } from "@/server/student-actions";
import { reportContent } from "@/server/common-actions";
import { JobDetailView } from "@/components/views/job-detail";
import { ActionButton, FormModal } from "@/components/forms";
import { Badge, Button, ButtonLink, Field, Select, Textarea } from "@/components/ui";
import { APP_STATUS_LABEL, APP_STATUS_TONE, REPORT_REASONS } from "@/lib/constants";

export default async function StudentJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { student } = await requireStudent();
  const job = await getJob(id);
  if (!job || job.status === "DRAFT") notFound();
  const [[{ match }], saved, application] = await Promise.all([
    scoreJobsFor(student.id, [job]),
    db.savedJob.findUnique({ where: { studentId_jobId: { studentId: student.id, jobId: id } } }),
    db.application.findUnique({ where: { jobId_studentId: { jobId: id, studentId: student.id } } }),
  ]);
  const applied = application && application.status !== "WITHDRAWN";

  return (
    <JobDetailView
      job={job}
      match={match}
      companyHref={`/student/career/companies/${job.company.slug}`}
      applicants={job._count.applications}
      actions={
        <>
          {applied ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5" /> Kamu sudah melamar · Status: <Badge tone={APP_STATUS_TONE[application.status]}>{APP_STATUS_LABEL[application.status]}</Badge>
              <ButtonLink href="/student/career/applications" variant="link" size="sm">
                Lacak
              </ButtonLink>
            </div>
          ) : job.status === "ACTIVE" ? (
            <FormModal
              title={`Lamar: ${job.title}`}
              description={`${job.company.name} · Skor kecocokanmu ${match.score}%`}
              action={applyJob}
              submitLabel="Kirim Lamaran"
              trigger={
                <Button size="lg">
                  <Send className="h-4 w-4" /> Lamar Sekarang
                </Button>
              }
            >
              <input type="hidden" name="jobId" value={job.id} />
              <p className="rounded-lg bg-subtle px-3 py-2.5 text-sm text-body">
                Profil lengkap, portfolio, sertifikat terverifikasi, dan video showcase kamu akan otomatis dilampirkan ke lamaran ini.
              </p>
              <Field label="Surat lamaran / pesan untuk recruiter">
                <Textarea name="coverLetter" rows={6} placeholder="Ceritakan mengapa kamu cocok untuk posisi ini…" />
              </Field>
            </FormModal>
          ) : (
            <Badge tone="danger">Lowongan sudah ditutup</Badge>
          )}
          <ActionButton action={toggleSaveJob} data={{ jobId: job.id }} variant="secondary" size="lg">
            {saved ? <BookmarkCheck className="h-4 w-4 text-brand-600" /> : <Bookmark className="h-4 w-4" />} {saved ? "Tersimpan" : "Simpan"}
          </ActionButton>
          <FormModal
            title="Laporkan lowongan"
            action={reportContent}
            submitLabel="Kirim laporan"
            submitVariant="danger"
            trigger={
              <Button variant="ghost" size="lg" className="text-muted">
                <Flag className="h-4 w-4" /> Laporkan
              </Button>
            }
          >
            <input type="hidden" name="targetType" value="JOB" />
            <input type="hidden" name="targetId" value={job.id} />
            <input type="hidden" name="targetLabel" value={`${job.title} — ${job.company.name}`} />
            <Field label="Alasan" required>
              <Select name="reason" required options={REPORT_REASONS} placeholder="Pilih alasan" />
            </Field>
            <Field label="Detail">
              <Textarea name="details" rows={3} />
            </Field>
          </FormModal>
        </>
      }
    />
  );
}
