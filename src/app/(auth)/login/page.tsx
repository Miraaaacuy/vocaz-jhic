import type { Metadata } from "next";
import Link from "@/components/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  let next = sp.next ?? "";
  if (!next && sp.callbackUrl) {
    try {
      next = new URL(sp.callbackUrl, "http://x").pathname;
    } catch {}
  }
  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Selamat datang kembali 👋</h1>
        <p className="mt-2 text-muted">Masuk ke akun VocAZ kamu untuk melanjutkan.</p>
      </div>
      <LoginForm next={next} oauthError={sp.error} />
      <p className="mt-8 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
