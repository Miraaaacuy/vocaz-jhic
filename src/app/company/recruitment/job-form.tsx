import type { Job } from "@prisma/client";
import { db } from "@/lib/db";
import { saveJob } from "@/server/company-actions";
import { ActionForm, SubmitButton, TagInput } from "@/components/forms";
import { Card, CardHeader, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { CERT_PREF_LABEL, CITIES, JOB_TYPE_LABEL, MAJORS, WORK_MODE_LABEL } from "@/lib/constants";
import { strArr } from "@/lib/utils";

export async function JobForm({ job, defaultCity }: { job?: Job; defaultCity?: string | null }) {
  const skills = (await db.skill.findMany({ select: { name: true }, orderBy: { name: "asc" } })).map((s) => s.name);
  const j = job;
  return (
    <ActionForm action={saveJob} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {j && <input type="hidden" name="id" value={j.id} />}
      <div className="space-y-6">
        <Card>
          <CardHeader title="Informasi posisi" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Judul posisi" required className="sm:col-span-2">
              <Input name="title" required defaultValue={j?.title} placeholder="cth. Frontend Developer" />
            </Field>
            <Field label="Departemen">
              <Input name="department" defaultValue={j?.department ?? ""} placeholder="cth. Engineering" />
            </Field>
            <Field label="Tipe pekerjaan" required>
              <Select name="type" defaultValue={j?.type ?? "FULL_TIME"} options={Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
            </Field>
            <Field label="Kota" required>
              <Select name="city" required defaultValue={j?.city ?? defaultCity ?? ""} options={Object.keys(CITIES).sort()} placeholder="Pilih kota" />
            </Field>
            <Field label="Mode kerja" required>
              <Select name="workMode" defaultValue={j?.workMode ?? "ONSITE"} options={Object.entries(WORK_MODE_LABEL).map(([value, label]) => ({ value, label }))} />
            </Field>
            <Field label="Deskripsi pekerjaan" required className="sm:col-span-2">
              <Textarea name="description" required rows={5} defaultValue={j?.description} placeholder="Gambaran umum posisi dan tim" />
            </Field>
            <Field label="Tanggung jawab" hint="Satu poin per baris" className="sm:col-span-2">
              <Textarea name="responsibilities" rows={4} defaultValue={j?.responsibilities ?? ""} />
            </Field>
            <Field label="Kualifikasi" hint="Satu poin per baris" className="sm:col-span-2">
              <Textarea name="requirements" rows={4} defaultValue={j?.requirements ?? ""} />
            </Field>
            <Field label="Benefit" hint="Satu poin per baris" className="sm:col-span-2">
              <Textarea name="benefits" rows={3} defaultValue={j?.benefits ?? ""} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Kriteria Smart Talent Match" description="Kriteria ini dipakai untuk menghitung % kecocokan setiap pelamar & rekomendasi talent." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Skill wajib" required className="sm:col-span-2" hint="Bobot terbesar (≈35 dari 40 poin skill)">
              <TagInput name="requiredSkills" defaultValue={strArr(j?.requiredSkills)} suggestions={skills} placeholder="cth. React" />
            </Field>
            <Field label="Skill nilai tambah" className="sm:col-span-2">
              <TagInput name="niceSkills" defaultValue={strArr(j?.niceSkills)} suggestions={skills} placeholder="cth. TypeScript" />
            </Field>
            <Field label="Program keahlian (jurusan)" className="sm:col-span-2">
              <TagInput name="majors" defaultValue={strArr(j?.majors)} suggestions={MAJORS} placeholder="cth. Rekayasa Perangkat Lunak" />
            </Field>
            <Field label="Pengalaman minimal">
              <Select
                name="minExperienceMonths"
                defaultValue={String(j?.minExperienceMonths ?? 0)}
                options={[
                  { value: "0", label: "Fresh graduate" },
                  { value: "3", label: "3 bulan" },
                  { value: "6", label: "6 bulan" },
                  { value: "12", label: "1 tahun" },
                  { value: "24", label: "2 tahun" },
                ]}
              />
            </Field>
            <Field label="Sertifikasi">
              <Select name="certification" defaultValue={j?.certification ?? "ANY"} options={Object.entries(CERT_PREF_LABEL).map(([value, label]) => ({ value, label }))} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Gaji & kuota" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gaji min (Rp)">
                <Input name="salaryMin" inputMode="numeric" defaultValue={j?.salaryMin ?? ""} placeholder="4000000" />
              </Field>
              <Field label="Gaji maks (Rp)">
                <Input name="salaryMax" inputMode="numeric" defaultValue={j?.salaryMax ?? ""} placeholder="6000000" />
              </Field>
            </div>
            <Checkbox name="showSalary" defaultChecked={j?.showSalary ?? true} label="Tampilkan gaji di lowongan" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kuota">
                <Input name="quota" type="number" min={1} defaultValue={j?.quota ?? 1} />
              </Field>
              <Field label="Batas lamaran">
                <Input name="deadline" type="date" defaultValue={j?.deadline ? j.deadline.toISOString().slice(0, 10) : ""} />
              </Field>
            </div>
          </div>
        </Card>
        <Card className="space-y-3 p-5 lg:sticky lg:top-24">
          <SubmitButton name="intent" value="publish" size="lg" className="w-full" pendingText="Menyimpan…">
            {j?.status === "ACTIVE" ? "Simpan Perubahan" : "Publikasikan Lowongan"}
          </SubmitButton>
          {j?.status !== "ACTIVE" && (
            <SubmitButton name="intent" value="draft" variant="secondary" size="lg" className="w-full">
              Simpan sebagai Draft
            </SubmitButton>
          )}
          <p className="text-xs text-muted">Lowongan yang dipublikasikan akan tampil di halaman publik dan direkomendasikan ke siswa & BKK yang relevan.</p>
        </Card>
      </div>
    </ActionForm>
  );
}
