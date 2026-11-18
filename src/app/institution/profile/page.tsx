import { requireInstitution } from "@/lib/session";
import { updateInstitutionProfile } from "@/server/institution-actions";
import { ActionForm, FileInput, SubmitButton, TagInput } from "@/components/forms";
import { Avatar, Card, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { INSTITUTION_TYPE_LABEL } from "@/lib/constants";
import { strArr } from "@/lib/utils";

export default async function InstitutionProfile() {
  const { institution: i } = await requireInstitution();
  return (
    <>
      <PageHeader title="Profil Lembaga" description="Identitas dan kewenangan lembaga sertifikasi." />
      <ActionForm action={updateInstitutionProfile} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Identitas" description={`Jenis: ${INSTITUTION_TYPE_LABEL[i.type]} (hubungi admin untuk mengubah jenis lembaga)`} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Nama lembaga" required className="sm:col-span-2">
              <Input name="name" defaultValue={i.name} required />
            </Field>
            <Field label="Nomor lisensi / akreditasi">
              <Input name="accreditationNumber" defaultValue={i.accreditationNumber ?? ""} />
            </Field>
            <Field label="Kota">
              <Input name="city" defaultValue={i.city ?? ""} />
            </Field>
            <Field label="Website">
              <Input name="website" defaultValue={i.website ?? ""} />
            </Field>
            <Field label="Alamat">
              <Input name="address" defaultValue={i.address ?? ""} />
            </Field>
            <Field label="Kewenangan / ruang lingkup sertifikasi" className="sm:col-span-2" hint="Skema atau bidang yang boleh diverifikasi lembaga ini.">
              <TagInput name="scopes" defaultValue={strArr(i.scopes)} />
            </Field>
            <Field label="Deskripsi" className="sm:col-span-2">
              <Textarea name="description" rows={4} defaultValue={i.description ?? ""} />
            </Field>
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="label">Logo</p>
            <div className="mb-3 flex justify-center">
              <Avatar src={i.logoUrl} name={i.name} size={88} square />
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
