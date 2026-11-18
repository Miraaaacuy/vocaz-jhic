import { CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { updatePersonal } from "@/server/student-actions";
import { ActionForm, FileInput, SubmitButton } from "@/components/forms";
import { Avatar, Card, CardHeader, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { CITIES, MAJORS, SEEKING_LABEL } from "@/lib/constants";
import { ProfileTabs } from "./tabs";

export default async function PersonalPage() {
  const { student } = await requireStudent();
  const [s, schools] = await Promise.all([
    db.studentProfile.findUniqueOrThrow({ where: { id: student.id }, include: { user: true, school: true } }),
    db.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const y = new Date().getFullYear();
  return (
    <>
      <ProfileTabs active="/student/profile" />
      <ActionForm action={updatePersonal} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Data diri" description="Informasi dasar yang tampil di profilmu." />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nama lengkap" required className="sm:col-span-2">
                <Input name="name" defaultValue={s.user.name} required />
              </Field>
              <Field label="Headline" hint="cth. Frontend Developer · Welder SMAW" className="sm:col-span-2">
                <Input name="headline" defaultValue={s.headline ?? ""} maxLength={120} />
              </Field>
              <Field label="Tentang saya" className="sm:col-span-2">
                <Textarea name="bio" defaultValue={s.bio ?? ""} rows={5} placeholder="Ceritakan keahlian, minat, dan tujuan kariermu." />
              </Field>
              <Field label="Tanggal lahir">
                <Input name="birthDate" type="date" defaultValue={s.birthDate ? s.birthDate.toISOString().slice(0, 10) : ""} />
              </Field>
              <Field label="Jenis kelamin">
                <Select name="gender" defaultValue={s.gender ?? ""} options={["Laki-laki", "Perempuan"]} placeholder="Pilih" />
              </Field>
              <Field label="No. HP / WhatsApp">
                <Input name="phone" defaultValue={s.user.phone ?? ""} />
              </Field>
              <Field label="NISN">
                <Input name="nisn" defaultValue={s.nisn ?? ""} />
              </Field>
              <Field label="Kota domisili">
                <Select name="city" defaultValue={s.city ?? ""} options={Object.keys(CITIES).sort()} placeholder="Pilih kota" />
              </Field>
              <div className="flex items-end pb-2.5">
                <Checkbox name="willingRelocate" defaultChecked={s.willingRelocate} label="Bersedia relokasi" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Sekolah & program keahlian" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field
                label="Sekolah"
                className="sm:col-span-2"
                hint={
                  s.schoolId ? (
                    s.schoolVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi oleh {s.school?.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Clock className="h-3.5 w-3.5" /> Menunggu verifikasi BKK sekolah
                      </span>
                    )
                  ) : (
                    "Pilih sekolah agar BKK dapat memverifikasi status siswamu."
                  )
                }
              >
                <Select name="schoolId" defaultValue={s.schoolId ?? ""} options={schools.map((x) => ({ value: x.id, label: x.name }))} placeholder="Pilih sekolah" />
              </Field>
              <Field label="Program keahlian">
                <Select name="major" defaultValue={s.major ?? ""} options={MAJORS} placeholder="Pilih" />
              </Field>
              <Field label="Tahun lulus">
                <Select name="graduationYear" defaultValue={String(s.graduationYear ?? y)} options={Array.from({ length: 10 }, (_, i) => String(y - 5 + i))} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tautan" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="LinkedIn">
                <Input name="linkedinUrl" defaultValue={s.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/…" />
              </Field>
              <Field label="GitHub">
                <Input name="githubUrl" defaultValue={s.githubUrl ?? ""} placeholder="https://github.com/…" />
              </Field>
              <Field label="Website / Behance">
                <Input name="websiteUrl" defaultValue={s.websiteUrl ?? ""} placeholder="https://…" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <p className="label">Foto profil</p>
            <div className="mb-4 flex justify-center">
              <Avatar src={s.user.avatarUrl} name={s.user.name} size={96} />
            </div>
            <FileInput name="avatar" accept="image/*" preview="image" hint="JPG/PNG, maks. 3 MB" />
          </Card>
          <Card className="p-5">
            <Field label="Status pencarian kerja">
              <Select name="seekingStatus" defaultValue={s.seekingStatus} options={Object.entries(SEEKING_LABEL).map(([value, label]) => ({ value, label }))} />
            </Field>
          </Card>
          <div className="lg:sticky lg:top-24">
            <SubmitButton size="lg" className="w-full" pendingText="Menyimpan…">
              Simpan Perubahan
            </SubmitButton>
          </div>
        </div>
      </ActionForm>
    </>
  );
}
