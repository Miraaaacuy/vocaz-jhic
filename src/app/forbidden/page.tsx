import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";

export default async function Forbidden() {
  const s = await getSession();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-4 text-center">
      <Logo className="h-11" />
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold text-ink">Akses ditolak</h1>
      <p className="max-w-md text-muted">Halaman ini tidak tersedia untuk jenis akun kamu.</p>
      <ButtonLink href={s?.user ? ROLE_HOME[s.user.role] : "/login"}>{s?.user ? "Ke Dashboard saya" : "Masuk"}</ButtonLink>
    </div>
  );
}
