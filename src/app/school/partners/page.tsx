import Link from "@/components/link";
import { Handshake, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { addPartner, removePartner } from "@/server/school-actions";
import { ActionButton, FormModal } from "@/components/forms";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { VerifiedCompanyMark } from "@/components/badges";
import { PARTNER_TYPE_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

export default async function Partners() {
  const { school } = await requireSchool();
  const [partners, companies, hires] = await Promise.all([
    db.industryPartner.findMany({ where: { schoolId: school.id }, include: { company: { include: { _count: { select: { jobs: { where: { status: "ACTIVE" } } } } } } }, orderBy: { createdAt: "desc" } }),
    db.company.findMany({ where: { hidden: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.application.groupBy({ by: ["jobId"], where: { status: "HIRED", student: { schoolId: school.id } }, _count: true }),
  ]);
  const jobCompany = await db.job.findMany({ where: { id: { in: hires.map((h) => h.jobId) } }, select: { id: true, companyId: true } });
  const hiredAt = (cid: string | null) => (cid ? hires.filter((h) => jobCompany.find((j) => j.id === h.jobId)?.companyId === cid).reduce((a, b) => a + b._count, 0) : 0);

  return (
    <>
      <PageHeader
        title="Mitra Industri"
        description="Daftar hubungan kerja sama sekolah dengan dunia usaha & industri."
        action={
          <FormModal
            title="Tambah mitra industri"
            action={addPartner}
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Tambah Mitra
              </Button>
            }
          >
            <Field label="Perusahaan di VocAZ" hint="Pilih jika perusahaan sudah terdaftar di VocAZ.">
              <Select name="companyId" options={companies.map((c) => ({ value: c.id, label: c.name }))} placeholder="— Tidak terdaftar —" />
            </Field>
            <Field label="Nama mitra (jika tidak terdaftar)">
              <Input name="name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jenis kerja sama">
                <Select name="type" options={Object.entries(PARTNER_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
              </Field>
              <Field label="Sejak">
                <Input name="since" type="date" />
              </Field>
            </div>
            <Field label="Catatan">
              <Textarea name="notes" rows={2} />
            </Field>
          </FormModal>
        }
      />
      {partners.length === 0 ? (
        <Card>
          <EmptyState icon={Handshake} title="Belum ada mitra industri" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {partners.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar src={p.company?.logoUrl} name={p.name} size={46} square />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-semibold text-ink">
                    <span className="truncate">{p.name}</span> {p.company && <VerifiedCompanyMark status={p.company.verificationStatus} />}
                  </p>
                  <p className="text-xs text-muted">{p.company?.industry ?? "Mitra eksternal"}</p>
                </div>
                <ActionButton action={removePartner} data={{ id: p.id }} confirm="Hapus mitra ini?" variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{PARTNER_TYPE_LABEL[p.type]}</Badge>
                {p.since && <Badge>Sejak {fmtDate(p.since, "MMM yyyy")}</Badge>}
              </div>
              {p.notes && <p className="mt-2 text-sm text-muted">{p.notes}</p>}
              {p.company && (
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
                  <span>{p.company._count.jobs} lowongan aktif · {hiredAt(p.companyId)} alumni diterima</span>
                  <Link href={`/perusahaan/${p.company.slug}`} target="_blank" className="font-semibold text-brand-600 hover:underline">
                    Profil →
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
