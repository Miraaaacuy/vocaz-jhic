import type { Metadata } from "next";
import Link from "@/components/link";
import { Award, Building2, GraduationCap, School } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { StudentRegisterForm, SchoolRegisterForm, InstitutionRegisterForm } from "./forms";
import { CompanyRegisterWizard } from "./company-wizard";

export const metadata: Metadata = { title: "Daftar" };

const ROLES = [
  { key: "student", icon: GraduationCap, title: "Siswa / Talent", desc: "Bangun profil profesional, upload video showcase, dan lamar pekerjaan." },
  { key: "company", icon: Building2, title: "Perusahaan / Recruiter", desc: "Temukan talenta SMK terverifikasi dengan Smart Talent Match." },
  { key: "school", icon: School, title: "Sekolah / BKK", desc: "Pantau karier siswa dan hubungkan dengan mitra industri." },
  { key: "institution", icon: Award, title: "Lembaga Sertifikasi", desc: "Verifikasi sertifikat kompetensi siswa (LSP/BNSP, industri, pelatihan)." },
];

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const current = ROLES.find((r) => r.key === role);

  if (!current) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Bergabung dengan VocAZ</h1>
          <p className="mt-2 text-muted">Pilih jenis akun yang sesuai dengan peranmu.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Link key={r.key} href={`/register?role=${r.key}`} className="group">
              <Card className="h-full p-6 transition group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-[var(--shadow-pop)]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <r.icon className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-ink">{r.title}</p>
                <p className="mt-1 text-sm text-muted">{r.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    );
  }

  const schools = current.key === "student" ? await db.school.findMany({ select: { id: true, name: true, programs: true }, orderBy: { name: "asc" } }) : [];

  return (
    <div className="w-full max-w-xl">
      {current.key === "company" ? (
        <CompanyRegisterWizard />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-line px-6 py-6 text-center sm:px-8">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <current.icon className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-2xl font-bold text-ink">Daftar sebagai {current.title}</h1>
            <p className="mt-1 text-sm text-muted">{current.desc}</p>
          </div>
          <div className="px-6 py-6 sm:px-8">
            {current.key === "student" && <StudentRegisterForm schools={schools.map((s) => ({ id: s.id, name: s.name }))} />}
            {current.key === "school" && <SchoolRegisterForm />}
            {current.key === "institution" && <InstitutionRegisterForm />}
          </div>
          <div className="flex items-center justify-between border-t border-line bg-canvas px-6 py-4 text-sm sm:px-8">
            <Link href="/register" className="text-muted hover:text-ink">
              ← Pilih jenis akun lain
            </Link>
            <span className="text-muted">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-ink hover:text-brand-600">
                Masuk
              </Link>
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
