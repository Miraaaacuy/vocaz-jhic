"use client";

import Link from "@/components/link";
import { useActionState, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, FileText, Info, Loader2, ShieldCheck } from "lucide-react";
import { registerCompany } from "@/server/auth-actions";
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { FileInput, PasswordInput } from "@/components/forms";
import { Logo } from "@/components/brand";
import { CITIES, COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = ["Akun", "Data Perusahaan", "Verifikasi", "Selesai"];
const POSITIONS = ["Owner / Direktur", "HR Manager", "HRD / Talent Acquisition", "Recruiter", "Manager Divisi", "Lainnya"];

export function CompanyRegisterWizard() {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(registerCompany, null);
  const formRef = useRef<HTMLFormElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const next = () => {
    const el = stepRefs.current[step];
    const inputs = el?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input,select,textarea") ?? [];
    for (const i of inputs) {
      if (!i.checkValidity()) {
        i.reportValidity();
        return;
      }
    }
    if (step === 0) {
      const f = formRef.current!;
      const pw = (f.elements.namedItem("password") as HTMLInputElement).value;
      const cf = (f.elements.namedItem("confirm") as HTMLInputElement).value;
      if (pw !== cf) {
        alert("Konfirmasi kata sandi tidak sama.");
        return;
      }
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 pt-8 pb-6 text-center sm:px-10">
        <Logo className="mx-auto h-12" href={null} />
        <h1 className="mt-5 text-2xl font-bold text-ink sm:text-[26px]">Buat Akun Perusahaan Anda</h1>
        <p className="mt-1 text-sm text-muted">Mulai bangun profil perusahaan Anda dan temukan talenta yang tepat di VocAZ.</p>
      </div>

      {/* stepper */}
      <div className="bg-canvas px-6 py-5 sm:px-10">
        <ol className="relative flex justify-between">
          <div className="absolute top-4 right-4 left-4 h-0.5 bg-line" />
          <div className="absolute top-4 left-4 h-0.5 bg-brand-700 transition-all" style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - 2rem)` }} />
          {STEPS.map((s, i) => (
            <li key={s} className="relative z-10 flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-4 ring-canvas transition",
                  i < step ? "bg-brand-700 text-white" : i === step ? "bg-brand-700 text-white" : "bg-line text-muted",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("text-xs font-semibold", i <= step ? "text-brand-700" : "text-muted")}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <form ref={formRef} action={action} className="px-6 py-7 sm:px-10">
        {state?.error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              {state.error}
              {state.fieldErrors && (
                <ul className="mt-1 text-xs">
                  {Object.values(state.fieldErrors).map((v) => (
                    <li key={v}>• {v}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* STEP 1 */}
        <div ref={(el) => void (stepRefs.current[0] = el)} className={cn("space-y-5", step !== 0 && "hidden")}>
          <h2 className="border-b border-line pb-3 text-lg font-bold text-ink">1. Informasi Akun</h2>
          <Field label="Email Perusahaan" required hint={<span className="inline-flex items-center gap-1"><Info className="h-3 w-3" /> Gunakan email resmi perusahaan jika memungkinkan.</span>}>
            <Input name="email" type="email" required placeholder="Masukkan email perusahaan Anda" />
          </Field>
          <Field label="Password" required>
            <PasswordInput name="password" placeholder="Buat kata sandi" showStrength required minLength={8} />
          </Field>
          <Field label="Konfirmasi Kata Sandi" required>
            <PasswordInput name="confirm" placeholder="Masukkan kembali kata sandi Anda" required />
          </Field>
          <h2 className="border-b border-line pt-3 pb-3 text-lg font-bold text-ink">2. Informasi Perwakilan</h2>
          <p className="-mt-2 text-sm text-muted">Beri tahu kami siapa yang akan mengelola akun perusahaan ini.</p>
          <Field label="Nama Lengkap" required>
            <Input name="name" required placeholder="Masukkan nama lengkap Anda" />
          </Field>
          <Field label="Jabatan" required>
            <Select name="position" required options={POSITIONS} placeholder="Pilih posisi" />
          </Field>
          <div className="space-y-3 border-t border-line pt-5">
            <Checkbox required label="Saya menyetujui Ketentuan Layanan dan Kebijakan Privasi VocAZ." />
            <Checkbox required label="Saya mengonfirmasi bahwa saya berwenang untuk membuat dan mengelola akun perusahaan ini." />
          </div>
        </div>

        {/* STEP 2 */}
        <div ref={(el) => void (stepRefs.current[1] = el)} className={cn("space-y-5", step !== 1 && "hidden")}>
          <h2 className="border-b border-line pb-3 text-lg font-bold text-ink">Data Perusahaan</h2>
          <Field label="Nama Perusahaan" required>
            <Input name="companyName" required={step >= 1} placeholder="cth. PT Teknologi Nusantara" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industri" required>
              <Select name="industry" required={step >= 1} options={INDUSTRIES} placeholder="Pilih industri" />
            </Field>
            <Field label="Jumlah Karyawan" required>
              <Select name="size" required={step >= 1} options={COMPANY_SIZES} placeholder="Pilih ukuran" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kota" required>
              <Select name="city" required={step >= 1} options={Object.keys(CITIES).sort()} placeholder="Pilih kota" />
            </Field>
            <Field label="Telepon Kantor">
              <Input name="phone" placeholder="(0341) 123456" />
            </Field>
          </div>
          <Field label="Alamat Kantor">
            <Textarea name="address" rows={2} placeholder="Alamat lengkap kantor" />
          </Field>
          <Field label="Website">
            <Input name="website" placeholder="https://perusahaan.co.id" />
          </Field>
          <Field label="Deskripsi Singkat">
            <Textarea name="description" rows={3} placeholder="Ceritakan tentang perusahaan dan budaya kerja Anda" />
          </Field>
        </div>

        {/* STEP 3 */}
        <div ref={(el) => void (stepRefs.current[2] = el)} className={cn("space-y-5", step !== 2 && "hidden")}>
          <div className="flex items-start gap-3 rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Anda <b>tetap bisa menggunakan VocAZ</b> tanpa verifikasi. Status <b>Verified Company</b> meningkatkan kepercayaan talent dan diberikan setelah Super Admin meninjau dokumen legal Anda.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor Induk Berusaha (NIB)">
              <Input name="nib" placeholder="13 digit NIB" />
            </Field>
            <Field label="NPWP Perusahaan">
              <Input name="npwp" placeholder="00.000.000.0-000.000" />
            </Field>
          </div>
          {[
            ["NIB", "Dokumen NIB"],
            ["NPWP", "Kartu NPWP Perusahaan"],
            ["AKTA", "Akta Pendirian (opsional)"],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <FileInput name={`doc_${k}`} accept="application/pdf,image/*" hint="PDF / JPG / PNG, maks. 10 MB" />
            </Field>
          ))}
          <p className="flex items-center gap-2 text-xs text-muted">
            <FileText className="h-4 w-4" /> Dokumen hanya dapat diakses oleh tim verifikasi VocAZ.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" variant="dark" size="lg" className="flex-1" onClick={next}>
              {step === 0 ? "Buat Akun Perusahaan" : "Lanjutkan"} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" variant="dark" size="lg" className="flex-1" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Selesaikan Pendaftaran
            </Button>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between border-t border-line bg-canvas px-6 py-4 text-sm sm:px-10">
        <Link href="/register" className="text-muted hover:text-ink">
          ← Pilih jenis akun lain
        </Link>
        <span className="text-muted">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-semibold text-ink hover:text-brand-600">
            Masuk
          </Link>
        </span>
      </div>
    </Card>
  );
}
