import { Award, FileText, Info, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { deleteItem, uploadCertificate } from "@/server/student-actions";
import { ActionButton, FileInput, FormModal, TagInput } from "@/components/forms";
import { Badge, Button, Card, EmptyState, Field, Input, Select } from "@/components/ui";
import { BnspBadge, IndustryBadge } from "@/components/badges";
import { CERT_TYPE_LABEL, INSTITUTION_TYPE_LABEL, VERIFY_STATUS_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import { ProfileTabs } from "../tabs";

export default async function CertificationsPage() {
  const { student } = await requireStudent();
  const [certs, institutions] = await Promise.all([
    db.certificate.findMany({ where: { studentId: student.id }, include: { institution: true }, orderBy: { createdAt: "desc" } }),
    db.institution.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <ProfileTabs active="/student/profile/certifications" />
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Unggah sertifikat yang sudah kamu miliki → lembaga penerbit memverifikasi → badge <b>LSP–BNSP Verified</b> atau <b>Industry Certified</b> tampil di profilmu.
          </span>
        </div>
        <FormModal
          title="Ajukan verifikasi sertifikat"
          description="Data akan dicocokkan dengan arsip lembaga penerbit."
          action={uploadCertificate}
          submitLabel="Kirim untuk verifikasi"
          wide
          trigger={
            <Button className="shrink-0">
              <Plus className="h-4 w-4" /> Upload Sertifikat
            </Button>
          }
        >
          <Field label="Nama sertifikat" required>
            <Input name="name" required placeholder="cth. Sertifikat Kompetensi Junior Web Developer" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor sertifikat" required>
              <Input name="number" required />
            </Field>
            <Field label="Lembaga penerbit" required>
              <Select name="institutionId" required placeholder="Pilih lembaga" options={institutions.map((i) => ({ value: i.id, label: `${i.name} (${INSTITUTION_TYPE_LABEL[i.type]})` }))} />
            </Field>
            <Field label="Tanggal terbit" required>
              <Input name="issuedAt" type="date" required />
            </Field>
            <Field label="Berlaku hingga">
              <Input name="expiresAt" type="date" />
            </Field>
          </div>
          <Field label="Skill terkait" hint="Membantu Smart Match menilai relevansi sertifikat.">
            <TagInput name="relatedSkills" placeholder="cth. JavaScript" />
          </Field>
          <Field label="File sertifikat" required>
            <FileInput name="file" accept="application/pdf,image/*" hint="PDF/JPG/PNG, maks. 10 MB" required />
          </Field>
        </FormModal>
      </div>

      {certs.length === 0 ? (
        <Card>
          <EmptyState icon={Award} title="Belum ada sertifikat" description="Sertifikat terverifikasi memberi bonus hingga 15 poin di Smart Talent Match." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Award className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{c.name}</p>
                    <Badge tone={c.status === "VERIFIED" ? "success" : c.status === "REJECTED" ? "danger" : "warning"}>{VERIFY_STATUS_LABEL[c.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted">{c.institution?.name ?? c.issuer}</p>
                  <p className="mt-1 text-xs text-muted">
                    {CERT_TYPE_LABEL[c.type]} · No. <span className="font-mono">{c.number}</span> · Terbit {fmtDate(c.issuedAt)}
                  </p>
                  {c.status === "VERIFIED" && <div className="mt-2">{c.type === "BNSP" ? <BnspBadge small /> : c.type === "INDUSTRY" ? <IndustryBadge small /> : null}</div>}
                  {c.reviewNote && (
                    <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${c.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-subtle text-body"}`}>
                      <b>Catatan lembaga:</b> {c.reviewNote}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    {c.fileUrl && (
                      <a href={c.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                        <FileText className="h-4 w-4" /> Lihat dokumen
                      </a>
                    )}
                    {c.status !== "VERIFIED" && (
                      <ActionButton action={deleteItem} data={{ kind: "certificate", id: c.id }} confirm="Hapus sertifikat ini?" variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" /> Hapus
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
