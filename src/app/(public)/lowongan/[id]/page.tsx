import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Bookmark, Send } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getJob } from "@/server/queries";
import { JobDetailView } from "@/components/views/job-detail";
import { ButtonLink } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const j = await getJob((await params).id);
  return { title: j ? `${j.title} — ${j.company.name}` : "Lowongan" };
}

export default async function PublicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.user.role === "STUDENT") redirect(`/student/career/jobs/${id}`);
  const job = await getJob(id);
  if (!job || job.status === "DRAFT") notFound();
  await db.job.update({ where: { id }, data: { views: { increment: 1 } } });
  const loginHref = `/login?next=/student/career/jobs/${id}`;
  return (
    <div className="container-page py-10">
      <JobDetailView
        job={job}
        companyHref={`/perusahaan/${job.company.slug}`}
        applicants={job._count.applications}
        actions={
          job.status === "ACTIVE" && session?.user.role !== "COMPANY" ? (
            <>
              <ButtonLink href={loginHref} size="lg">
                <Send className="h-4 w-4" /> Lamar Sekarang
              </ButtonLink>
              <ButtonLink href={loginHref} variant="secondary" size="lg">
                <Bookmark className="h-4 w-4" /> Simpan
              </ButtonLink>
              <p className="w-full text-xs text-muted">Masuk sebagai siswa untuk melamar, menyimpan, dan melacak status lamaran.</p>
            </>
          ) : undefined
        }
      />
    </div>
  );
}
