import { requireSchool } from "@/lib/session";
import { updateSchoolProfile } from "@/server/school-actions";
import { ActionForm, FileInput, SubmitButton, TagInput } from "@/components/forms";
import { Avatar, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { CITIES, MAJORS } from "@/lib/constants";
import { strArr } from "@/lib/utils";

export default async function SchoolProfile() {
  const { school: s } = await requireSchool();
  return (
    <>
      <PageHeader title="Profil Sekolah" description="Informasi sekolah, program keahlian, dan identitas BKK." />
      <ActionForm action={updateSchoolProfile} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Informasi sekolah" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nama sekolah" required className="sm:col-span-2">
                <Input name="name" defaultValue={s.name} required />
              </Field>
              <Field label="NPSN">
                <Input name="npsn" defaultValue={s.npsn ?? ""} />
              </Field>
              <Field label="Kota">
                <Select name="city" defaultValue={s.city ?? ""} options={Object.keys(CITIES).sort()} placeholder="Pilih" />
              </Field>
              <Field label="Website">
                <Input name="website" defaultValue={s.website ?? ""} />
              </Field>
              <Field label="Alamat">
                <Input name="address" defaultValue={s.address ?? ""} />
              </Field>
              <Field label="Program keahlian" className="sm:col-span-2">
                <TagInput name="programs" defaultValue={strArr(s.programs)} suggestions={MAJORS} />
              </Field>
              <Field label="Deskripsi" className="sm:col-span-2">
                <Textarea name="description" rows={4} defaultValue={s.description ?? ""} />
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Bursa Kerja Khusus (BKK)" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nama BKK">
                <Input name="bkkName" defaultValue={s.bkkName ?? ""} />
              </Field>
              <Field label="Kepala BKK">
                <Input name="bkkHead" defaultValue={s.bkkHead ?? ""} />
              </Field>
              <Field label="Email BKK">
                <Input name="bkkEmail" type="email" defaultValue={s.bkkEmail ?? ""} />
              </Field>
              <Field label="Telepon BKK">
                <Input name="bkkPhone" defaultValue={s.bkkPhone ?? ""} />
              </Field>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="label">Logo sekolah</p>
            <div className="mb-3 flex justify-center">
              <Avatar src={s.logoUrl} name={s.name} size={88} square />
            </div>
            <FileInput name="logo" accept="image/*" preview="image" hint="Maks. 3 MB" />
          </Card>
          <SubmitButton size="lg" className="w-full">
            Simpan
          </SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
