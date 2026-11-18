import Link from "@/components/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { reviewCompany } from "@/server/admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, CardHeader, DescList, EmptyState, Field, PageHeader, Textarea } from "@/components/ui";
import { COMPANY_VERIFY_LABEL, DOC_TYPES } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

export default async function CompanyVerificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const c = await db.company.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      verifications: { orderBy: { submittedAt: "desc" }, include: { reviewer: { select: { name: true } } } },
      members: { include: { user: true } },
      _count: { select: { jobs: true } },
    },
  });
  if (!c) notFound();
  const latest = c.verifications[0];
  return (
    <>
      <PageHeader
        back={{ href: "/admin/company-verification", label: "Verifikasi Perusahaan" }}
        title="Verification Detail"
        description={c.name}
        action={
          <Link href={`/perusahaan/${c.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            Profil publik <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-3">
                  <Avatar src={c.logoUrl} name={c.name} size={36} square /> Company information
                </span>
              }
              action={<Badge tone={c.verificationStatus === "VERIFIED" ? "success" : c.verificationStatus === "PENDING" ? "warning" : "danger"}>{COMPANY_VERIFY_LABEL[c.verificationStatus]}</Badge>}
            />
            <div className="p-5">
              <DescList
                items={[
                  { label: "Nama", value: c.name },
                  { label: "Industri", value: c.industry },
                  { label: "Ukuran", value: c.size },
                  { label: "Lokasi", value: `${c.city}, ${c.province}` },
                  { label: "Alamat", value: c.address },
                  { label: "Website", value: c.website },
                  { label: "Email / Telepon", value: `${c.email ?? "-"} · ${c.phone ?? "-"}` },
                  { label: "Berdiri", value: c.foundedYear },
                  { label: "Business registration (NIB)", value: <span className="font-mono">{c.nib ?? "-"}</span> },
                  { label: "NPWP", value: <span className="font-mono">{c.npwp ?? "-"}</span> },
                  { label: "Terdaftar", value: fmtDate(c.createdAt) },
                  { label: "Lowongan", value: c._count.jobs },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Legal & supporting documents" description={`${c.documents.length} dokumen`} />
            {c.documents.length === 0 ? (
              <EmptyState icon={FileText} title="Belum ada dokumen" />
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {c.documents.map((d) => (
                  <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="group rounded-xl border border-line p-4 transition hover:border-brand-300 hover:bg-brand-50/30">
                    <FileText className="h-8 w-8 text-brand-600" />
                    <p className="mt-2 text-sm font-semibold text-ink group-hover:text-brand-600">{DOC_TYPES.find((t) => t.value === d.type)?.label ?? d.type}</p>
                    <p className="truncate text-xs text-muted">{d.fileName}</p>
                    <p className="text-xs text-muted">Diunggah {fmtDate(d.uploadedAt)}</p>
                  </a>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <CardHeader title="Anggota akun" />
            <ul className="divide-y divide-line">
              {c.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar src={m.user.avatarUrl} name={m.user.name} size={32} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{m.user.name}</p>
                    <p className="text-xs text-muted">
                      {m.user.email} · {m.position}
                    </p>
                  </div>
                  <Badge>{m.role}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          {latest?.message && (
            <Card className="p-5">
              <p className="mb-1 text-xs font-bold tracking-wider text-muted uppercase">Pesan perusahaan</p>
              <p className="text-sm text-body">{latest.message}</p>
            </Card>
          )}
          {c.verificationStatus !== "VERIFIED" ? (
            <Card className="p-5">
              <p className="font-semibold text-ink">Review notes & keputusan</p>
              <p className="mb-4 text-xs text-muted">Periksa kesesuaian NIB/NPWP dengan dokumen yang diunggah.</p>
              <ActionForm action={reviewCompany} className="space-y-3">
                <input type="hidden" name="companyId" value={c.id} />
                <Field label="Catatan review">
                  <Textarea name="note" rows={4} placeholder="cth. Dokumen lengkap dan valid." />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <SubmitButton name="decision" value="REJECTED" variant="danger">
                    <XCircle className="h-4 w-4" /> Reject
                  </SubmitButton>
                  <SubmitButton name="decision" value="VERIFIED" variant="success">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          ) : (
            <Card className="p-5">
              <p className="font-semibold text-ink">Terverifikasi sejak {fmtDate(c.verifiedAt)}</p>
              <ActionForm action={reviewCompany} className="mt-3 space-y-3">
                <input type="hidden" name="companyId" value={c.id} />
                <Field label="Cabut verifikasi (alasan)">
                  <Textarea name="note" rows={2} />
                </Field>
                <SubmitButton name="decision" value="REJECTED" variant="danger" size="sm">
                  Cabut status Verified
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
          <Card>
            <CardHeader title="Riwayat review" />
            <ul className="divide-y divide-line">
              {c.verifications.map((v) => (
                <li key={v.id} className="px-5 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">{fmtDate(v.submittedAt, "d MMM yyyy")}</span>
                    <Badge tone={v.status === "VERIFIED" ? "success" : v.status === "REJECTED" ? "danger" : "warning"}>{COMPANY_VERIFY_LABEL[v.status]}</Badge>
                  </div>
                  {v.reviewNote && (
                    <p className="mt-1 text-xs text-body">
                      {v.reviewNote} {v.reviewer && <span className="text-muted">— {v.reviewer.name}</span>}
                    </p>
                  )}
                </li>
              ))}
              {c.verifications.length === 0 && <li className="px-5 py-5 text-center text-sm text-muted">Belum ada pengajuan</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
