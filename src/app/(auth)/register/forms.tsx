"use client";

import { ActionForm, PasswordInput, SubmitButton, TagInput } from "@/components/forms";
import { Checkbox, Field, Input, Select } from "@/components/ui";
import { CITIES, INSTITUTION_TYPE_LABEL, MAJORS } from "@/lib/constants";
import { registerInstitution, registerSchool, registerStudent } from "@/server/auth-actions";

const cityOptions = Object.keys(CITIES).sort();
const year = new Date().getFullYear();

function AccountFields({ nameLabel = "Nama Lengkap" }: { nameLabel?: string }) {
  return (
    <>
      <Field label={nameLabel} required>
        <Input name="name" required placeholder="Nama lengkap sesuai identitas" />
      </Field>
      <Field label="Email" required>
        <Input name="email" type="email" required placeholder="nama@email.com" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kata Sandi" required>
          <PasswordInput name="password" placeholder="Min. 8 karakter" showStrength required minLength={8} />
        </Field>
        <Field label="Konfirmasi Kata Sandi" required>
          <PasswordInput name="confirm" placeholder="Ulangi kata sandi" required />
        </Field>
      </div>
    </>
  );
}

function Agree() {
  return <Checkbox name="agree" required label="Saya menyetujui Ketentuan Layanan dan Kebijakan Privasi VocAZ." />;
}

export function StudentRegisterForm({ schools }: { schools: { id: string; name: string }[] }) {
  return (
    <ActionForm action={registerStudent} className="space-y-4">
      <AccountFields />
      <Field label="Sekolah" hint="Sekolah akan memverifikasi status kamu sebagai siswa (School Verified).">
        <Select name="schoolId" options={schools.map((s) => ({ value: s.id, label: s.name }))} placeholder="Pilih sekolah (opsional)" />
      </Field>
      <Field label="Program Keahlian" required>
        <Select name="major" required options={MAJORS} placeholder="Pilih program keahlian" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tahun Lulus" required>
          <Select name="graduationYear" required defaultValue={String(year)} options={Array.from({ length: 8 }, (_, i) => String(year - 4 + i))} />
        </Field>
        <Field label="Kota Domisili" required>
          <Select name="city" required options={cityOptions} placeholder="Pilih kota" />
        </Field>
      </div>
      <Agree />
      <SubmitButton size="lg" className="w-full" pendingText="Membuat akun…">
        Buat Akun Siswa
      </SubmitButton>
    </ActionForm>
  );
}

export function SchoolRegisterForm() {
  return (
    <ActionForm action={registerSchool} className="space-y-4">
      <Field label="Nama Sekolah" required>
        <Input name="schoolName" required placeholder="cth. SMK Negeri 1 Malang" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="NPSN" required>
          <Input name="npsn" required placeholder="8 digit NPSN" />
        </Field>
        <Field label="Kota" required>
          <Select name="city" required options={cityOptions} placeholder="Pilih kota" />
        </Field>
      </div>
      <Field label="Program Keahlian" required hint="Ketik lalu tekan Enter untuk menambahkan.">
        <TagInput name="programs" suggestions={MAJORS} placeholder="cth. Rekayasa Perangkat Lunak" />
      </Field>
      <div className="border-t border-line pt-4">
        <p className="mb-3 text-sm font-semibold text-ink">Penanggung jawab BKK</p>
        <div className="space-y-4">
          <AccountFields nameLabel="Nama Kepala BKK" />
        </div>
      </div>
      <Agree />
      <SubmitButton size="lg" className="w-full" pendingText="Membuat akun…">
        Buat Akun Sekolah
      </SubmitButton>
    </ActionForm>
  );
}

export function InstitutionRegisterForm() {
  return (
    <ActionForm action={registerInstitution} className="space-y-4">
      <Field label="Nama Lembaga" required>
        <Input name="instName" required placeholder="cth. LSP Teknologi Digital" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis Lembaga" required>
          <Select name="type" required options={Object.entries(INSTITUTION_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
        </Field>
        <Field label="Kota" required>
          <Select name="city" required options={cityOptions} placeholder="Pilih kota" />
        </Field>
      </div>
      <Field label="Nomor Lisensi / Akreditasi" required>
        <Input name="accreditationNumber" required placeholder="cth. BNSP-LSP-0001-ID" />
      </Field>
      <Field label="Ruang Lingkup Sertifikasi" hint="Skema/bidang yang boleh diverifikasi lembaga ini.">
        <TagInput name="scopes" placeholder="cth. Pemrograman Web" />
      </Field>
      <div className="border-t border-line pt-4">
        <p className="mb-3 text-sm font-semibold text-ink">Penanggung jawab akun</p>
        <div className="space-y-4">
          <AccountFields nameLabel="Nama Penanggung Jawab" />
        </div>
      </div>
      <Agree />
      <SubmitButton size="lg" className="w-full" pendingText="Membuat akun…">
        Buat Akun Lembaga
      </SubmitButton>
    </ActionForm>
  );
}
