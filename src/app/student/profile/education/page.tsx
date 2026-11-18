import { Briefcase, GraduationCap, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { addEducation, addExperience, deleteItem } from "@/server/student-actions";
import { ActionButton, FormModal } from "@/components/forms";
import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { EXPERIENCE_TYPE_LABEL } from "@/lib/constants";
import { fmtMonthYear } from "@/lib/utils";
import { ProfileTabs } from "../tabs";

export default async function EducationPage() {
  const { student } = await requireStudent();
  const [educations, experiences] = await Promise.all([
    db.education.findMany({ where: { studentId: student.id }, orderBy: { startYear: "desc" } }),
    db.experience.findMany({ where: { studentId: student.id }, orderBy: { startDate: "desc" } }),
  ]);
  const y = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => String(y + 3 - i));

  return (
    <>
      <ProfileTabs active="/student/profile/education" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pendidikan"
            action={
              <FormModal
                title="Tambah pendidikan"
                action={addEducation}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                }
              >
                <Field label="Institusi" required>
                  <Input name="institution" required placeholder="cth. SMK Nusantara 1 Malang" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Jenjang" required>
                    <Select name="degree" required options={["SMK", "SMA", "D1", "D3", "D4/S1", "Kursus / Bootcamp"]} placeholder="Pilih" />
                  </Field>
                  <Field label="Bidang / Jurusan">
                    <Input name="field" />
                  </Field>
                  <Field label="Tahun mulai" required>
                    <Select name="startYear" required options={years} placeholder="Pilih" />
                  </Field>
                  <Field label="Tahun selesai">
                    <Select name="endYear" options={years} placeholder="Masih berjalan" />
                  </Field>
                </div>
                <Field label="Keterangan">
                  <Textarea name="description" rows={3} placeholder="Nilai rata-rata, kegiatan, dsb." />
                </Field>
              </FormModal>
            }
          />
          {educations.length === 0 ? (
            <EmptyState icon={GraduationCap} title="Belum ada data pendidikan" />
          ) : (
            <ul className="divide-y divide-line">
              {educations.map((e) => (
                <li key={e.id} className="flex gap-3 px-5 py-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{e.institution}</p>
                    <p className="text-sm text-body">
                      {e.degree} {e.field && `· ${e.field}`}
                    </p>
                    <p className="text-xs text-muted">
                      {e.startYear} – {e.endYear ?? "Sekarang"}
                    </p>
                    {e.description && <p className="mt-1 text-sm text-muted">{e.description}</p>}
                  </div>
                  <ActionButton action={deleteItem} data={{ kind: "education", id: e.id }} confirm="Hapus pendidikan ini?" variant="ghost" size="icon" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Pengalaman (PKL, magang, kerja, proyek)"
            action={
              <FormModal
                title="Tambah pengalaman"
                action={addExperience}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Posisi" required>
                    <Input name="title" required placeholder="cth. Junior Web Developer" />
                  </Field>
                  <Field label="Perusahaan / Instansi" required>
                    <Input name="company" required />
                  </Field>
                  <Field label="Jenis">
                    <Select name="type" options={Object.entries(EXPERIENCE_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
                  </Field>
                  <Field label="Lokasi">
                    <Input name="location" placeholder="Kota" />
                  </Field>
                  <Field label="Mulai" required>
                    <Input name="startDate" type="month" required />
                  </Field>
                  <Field label="Selesai">
                    <Input name="endDate" type="month" />
                  </Field>
                </div>
                <Checkbox name="current" label="Saya masih menjalani pengalaman ini" />
                <Field label="Deskripsi">
                  <Textarea name="description" rows={3} placeholder="Tanggung jawab dan pencapaian" />
                </Field>
              </FormModal>
            }
          />
          {experiences.length === 0 ? (
            <EmptyState icon={Briefcase} title="Belum ada pengalaman" description="PKL dan proyek sekolah juga dihitung sebagai pengalaman." />
          ) : (
            <ul className="divide-y divide-line">
              {experiences.map((e) => (
                <li key={e.id} className="flex gap-3 px-5 py-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{e.title}</p>
                    <p className="text-sm text-body">
                      {e.company} <Badge className="ml-1">{EXPERIENCE_TYPE_LABEL[e.type]}</Badge>
                    </p>
                    <p className="text-xs text-muted">
                      {fmtMonthYear(e.startDate)} – {e.endDate ? fmtMonthYear(e.endDate) : "Sekarang"} {e.location && `· ${e.location}`}
                    </p>
                    {e.description && <p className="mt-1 text-sm text-muted">{e.description}</p>}
                  </div>
                  <ActionButton action={deleteItem} data={{ kind: "experience", id: e.id }} confirm="Hapus pengalaman ini?" variant="ghost" size="icon" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
