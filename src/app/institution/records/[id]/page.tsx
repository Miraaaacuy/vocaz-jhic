import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireInstitution } from "@/lib/session";
import { CertificateDetail } from "@/components/views/certificate-detail";
import { PageHeader } from "@/components/ui";

export default async function RecordDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { institution } = await requireInstitution();
  const c = await db.certificate.findFirst({
    where: { id, institutionId: institution.id },
    include: { institution: true, student: { include: { user: true, school: true } }, reviewedBy: { select: { name: true } } },
  });
  if (!c) notFound();
  return (
    <>
      <PageHeader back={{ href: "/institution/records", label: "Certificate Records" }} title="Certificate Detail" description={`No. ${c.number}`} />
      <CertificateDetail c={c} />
    </>
  );
}
