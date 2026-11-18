import { Check, Clock, FileText, ShieldAlert, ShieldCheck, Trash2, Upload, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { deleteCompanyDocument, submitVerification, uploadCompanyDocument } from "@/server/company-actions";
import { ActionButton, ActionForm, FileInput, SubmitButton } from "@/components/forms";
import { Badge, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { COMPANY_VERIFY_LABEL, DOC_TYPES } from "@/lib/constants";
import { cn, fmtDate } from "@/lib/utils";

export default async function Verification() {
  const { company } = await requireCompany();
  const [docs, history] = await Promise.all([
    db.companyDocument.findMany({ where: { companyId: company.id }, orderBy: { uploadedAt: "desc" } }),
    db.companyVerification.findMany({ where: { companyId: company.id }, orderBy: { submittedAt: "desc" } }),
  ]);
  const s = company.verificationStatus;
  const steps = [
    { label: "Registrasi akun", done: true },
    { label: "Upload dokumen legal", done: docs.length > 0 },
    { label: "Review Super Admin", done: s === "VERIFIED" || s === "REJECTED", active: s === "PENDING" },
    { label: "Verified Company", done: s === "VERIFIED" },
  ];
  const Icon = s === "VERIFIED" ? ShieldCheck : s === "PENDING" ? Clock : s === "REJECTED" ? XCircle : ShieldAlert;
  const tone = s === "VERIFIED" ? "bg-teal-50 text-teal-700 border-teal-200" : s === "PENDING" ? "bg-amber-50 text-amber-800 border-amber-200" : s === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" : "bg-subtle text-body border-line";
  const lastReview = history.find((h) => h.reviewNote);

  return (
    <>
      <PageHeader title="Verifikasi Perusahaan" description="Status Verified Company meningkatkan kepercayaan talenta dan sekolah terhadap lowongan Anda." />
      <Card className={cn("mb-6 flex flex-col gap-4 border p-5 sm:flex-row sm:items-center", tone)}>
        <Icon className="h-10 w-10 shrink-0" />
        <div className="flex-1">
          <p className="text-lg font-bold">{COMPANY_VERIFY_LABEL[s]}</p>
          <p className="text-sm opacity-90">
            {s === "VERIFIED" && `Perusahaan Anda terverifikasi sejak ${fmtDate(company.verifiedAt)}. Badge Verified Company tampil di profil dan lowongan.`}
            {s === "PENDING" && "Dokumen Anda sedang ditinjau tim VocAZ. Estimasi 1–3 hari kerja."}
            {s === "REJECTED" && "Pengajuan sebelumnya ditolak. Perbaiki dokumen sesuai catatan reviewer lalu ajukan kembali."}
            {s === "UNVERIFIED" && "Anda tetap bisa merekrut. Unggah NIB & NPWP lalu ajukan verifikasi untuk mendapatkan badge."}
          </p>
          {s === "REJECTED" && lastReview?.reviewNote && (
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm">
              <b>Catatan reviewer:</b> {lastReview.reviewNote}
            </p>
          )}
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <ol className="grid gap-4 sm:grid-cols-4">
          {steps.map((st, i) => (
            <li key={st.label} className="flex items-center gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", st.done ? "bg-brand-700 text-white" : st.active ? "bg-amber-100 text-amber-700 ring-2 ring-amber-300" : "bg-subtle text-muted")}>
                {st.done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("text-sm font-semibold", st.done || st.active ? "text-ink" : "text-muted")}>{st.label}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Dokumen legal" description="Wajib: NIB dan NPWP. Dokumen hanya dapat diakses tim verifikasi." />
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="Belum ada dokumen" />
          ) : (
            <ul className="divide-y divide-line">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                  <FileText className="h-5 w-5 text-brand-600" />
                  <div className="min-w-0 flex-1">
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-ink hover:text-brand-600">
                      {d.fileName}
                    </a>
                    <p className="text-xs text-muted">
                      {DOC_TYPES.find((t) => t.value === d.type)?.label ?? d.type} · {fmtDate(d.uploadedAt)}
                    </p>
                  </div>
                  {s !== "PENDING" && s !== "VERIFIED" && (
                    <ActionButton action={deleteCompanyDocument} data={{ id: d.id }} confirm="Hapus dokumen?" variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  )}
                </li>
              ))}
            </ul>
          )}
          {s !== "VERIFIED" && s !== "PENDING" && (
            <div className="border-t border-line p-5">
              <ActionForm action={submitVerification} className="space-y-3">
                <Field label="Pesan untuk reviewer (opsional)">
                  <Textarea name="message" rows={2} placeholder="Informasi tambahan tentang perusahaan" />
                </Field>
                <SubmitButton className="w-full" pendingText="Mengirim…">
                  <ShieldCheck className="h-4 w-4" /> Ajukan Verifikasi
                </SubmitButton>
              </ActionForm>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {s !== "VERIFIED" && s !== "PENDING" && (
            <Card>
              <CardHeader title="Upload dokumen" />
              <ActionForm action={uploadCompanyDocument} resetOnSuccess className="space-y-4 p-5">
                <Field label="Jenis dokumen">
                  <Select name="type" options={DOC_TYPES} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="NIB">
                    <Input name="nib" defaultValue={company.nib ?? ""} />
                  </Field>
                  <Field label="NPWP">
                    <Input name="npwp" defaultValue={company.npwp ?? ""} />
                  </Field>
                </div>
                <FileInput name="file" accept="application/pdf,image/*" hint="PDF/JPG/PNG, maks. 10 MB" required />
                <SubmitButton className="w-full">
                  <Upload className="h-4 w-4" /> Unggah
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
          <Card>
            <CardHeader title="Riwayat pengajuan" />
            <ul className="divide-y divide-line">
              {history.map((h) => (
                <li key={h.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{fmtDate(h.submittedAt, "d MMM yyyy HH:mm")}</span>
                    <Badge tone={h.status === "VERIFIED" ? "success" : h.status === "REJECTED" ? "danger" : "warning"}>{COMPANY_VERIFY_LABEL[h.status]}</Badge>
                  </div>
                  {h.reviewNote && <p className="mt-1 text-xs text-body">{h.reviewNote}</p>}
                </li>
              ))}
              {history.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted">Belum ada pengajuan</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
