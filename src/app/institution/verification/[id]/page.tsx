import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireInstitution } from "@/lib/session";
import { reviewCertificate } from "@/server/institution-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { CertificateDetail } from "@/components/views/certificate-detail";
import { Card, Field, PageHeader, Textarea } from "@/components/ui";

export default async function ReviewCertificate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { institution } = await requireInstitution();
  const c = await db.certificate.findFirst({
    where: { id, institutionId: institution.id },
    include: { institution: true, student: { include: { user: true, school: true } }, reviewedBy: { select: { name: true } } },
  });
  if (!c) notFound();
  return (
    <>
      <PageHeader back={{ href: "/institution/verification", label: "Verifikasi" }} title={c.status === "PENDING" ? "Tinjau Sertifikat" : "Detail Verifikasi"} description={c.name} />
      <CertificateDetail
        c={c}
        actions={
          c.status === "PENDING" && (
            <Card className="p-5">
              <p className="mb-1 font-semibold text-ink">Keputusan verifikasi</p>
              <p className="mb-4 text-xs text-muted">Cocokkan nomor & data sertifikat dengan arsip resmi lembaga sebelum memutuskan.</p>
              <ActionForm action={reviewCertificate} className="space-y-3">
                <input type="hidden" name="id" value={c.id} />
                <Field label="Catatan (wajib jika ditolak)">
                  <Textarea name="note" rows={3} placeholder="cth. Data sesuai dengan arsip lembaga." />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <SubmitButton name="decision" value="REJECTED" variant="danger">
                    <XCircle className="h-4 w-4" /> Tolak
                  </SubmitButton>
                  <SubmitButton name="decision" value="VERIFIED" variant="success">
                    <CheckCircle2 className="h-4 w-4" /> Verifikasi
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          )
        }
      />
    </>
  );
}
