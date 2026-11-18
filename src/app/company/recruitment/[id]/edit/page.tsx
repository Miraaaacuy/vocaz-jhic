import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { JobForm } from "../../job-form";

export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany();
  const job = await db.job.findFirst({ where: { id, companyId: company.id } });
  if (!job) notFound();
  return (
    <>
      <PageHeader title={`Edit: ${job.title}`} back={{ href: `/company/recruitment/${id}`, label: "Detail lowongan" }} />
      <JobForm job={job} />
    </>
  );
}
