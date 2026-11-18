import { ExternalLink } from "lucide-react";
import { requireCompany } from "@/lib/session";
import { updateCompanyProfile } from "@/server/company-actions";
import { ActionForm, FileInput, SubmitButton } from "@/components/forms";
import { Avatar, ButtonLink, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { VerifiedCompanyMark } from "@/components/badges";
import { CITIES, COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";

export default async function CompanyProfileEdit() {
  const { company: c } = await requireCompany();
  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Company Profile <VerifiedCompanyMark status={c.verificationStatus} />
          </span>
        }
        description="Profil publik perusahaan yang dilihat oleh talenta dan sekolah."
        action={
          <ButtonLink href={`/perusahaan/${c.slug}`} target="_blank" variant="secondary">
            <ExternalLink className="h-4 w-4" /> Lihat profil publik
          </ButtonLink>
        }
      />
      <ActionForm action={updateCompanyProfile} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Informasi perusahaan" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nama perusahaan" required className="sm:col-span-2">
                <Input name="name" defaultValue={c.name} required />
              </Field>
              <Field label="Industri">
                <Select name="industry" defaultValue={c.industry ?? ""} options={INDUSTRIES} placeholder="Pilih" />
              </Field>
              <Field label="Jumlah karyawan">
                <Select name="size" defaultValue={c.size ?? ""} options={COMPANY_SIZES} placeholder="Pilih" />
              </Field>
              <Field label="Tahun berdiri">
                <Input name="foundedYear" type="number" defaultValue={c.foundedYear ?? ""} />
              </Field>
              <Field label="Kota">
                <Select name="city" defaultValue={c.city ?? ""} options={Object.keys(CITIES).sort()} placeholder="Pilih" />
              </Field>
              <Field label="Deskripsi" className="sm:col-span-2">
                <Textarea name="description" rows={6} defaultValue={c.description ?? ""} placeholder="Ceritakan tentang perusahaan, budaya kerja, dan kesempatan berkembang." />
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Kontak" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Website">
                <Input name="website" defaultValue={c.website ?? ""} />
              </Field>
              <Field label="Email HR">
                <Input name="email" type="email" defaultValue={c.email ?? ""} />
              </Field>
              <Field label="Telepon">
                <Input name="phone" defaultValue={c.phone ?? ""} />
              </Field>
              <Field label="Alamat" className="sm:col-span-2">
                <Textarea name="address" rows={2} defaultValue={c.address ?? ""} />
              </Field>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="label">Logo</p>
            <div className="mb-3 flex justify-center">
              <Avatar src={c.logoUrl} name={c.name} size={88} square />
            </div>
            <FileInput name="logo" accept="image/*" preview="image" hint="PNG/JPG/SVG persegi, maks. 3 MB" />
          </Card>
          <Card className="p-5">
            <p className="label">Cover</p>
            {c.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.coverUrl} alt="" className="mb-3 aspect-[3/1] w-full rounded-lg object-cover" />
            )}
            <FileInput name="cover" accept="image/*" preview="image" hint="Rasio 3:1, maks. 5 MB" />
          </Card>
          <SubmitButton size="lg" className="w-full" pendingText="Menyimpan…">
            Simpan Profil
          </SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
