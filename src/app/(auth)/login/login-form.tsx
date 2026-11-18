"use client";

import { useActionState, useRef } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction } from "@/server/auth-actions";
import { Button, Card } from "@/components/ui";
import { PasswordInput } from "@/components/forms";
import { OrDivider, SocialButtons } from "@/components/social-login";

// messages for /login?error=… (set by our signIn callback or by Auth.js itself)
const OAUTH_ERRORS: Record<string, string> = {
  notlinked: "Akun Google/Facebook itu belum ditautkan ke akun VocAZ. Masuk dengan email dan kata sandi dulu, lalu tautkan di menu Pengaturan.",
  suspended: "Akun kamu sedang ditangguhkan. Hubungi admin VocAZ.",
};
const OAUTH_FALLBACK = "Login dengan akun sosial gagal atau dibatalkan. Silakan coba lagi.";

const DEMO = [
  { role: "Siswa", email: "siswa@vocaz.id" },
  { role: "Perusahaan", email: "perusahaan@vocaz.id" },
  { role: "Sekolah/BKK", email: "bkk@vocaz.id" },
  { role: "Lembaga", email: "lsp@vocaz.id" },
  { role: "Admin", email: "admin@vocaz.id" },
];

export function LoginForm({ next, oauthError }: { next: string; oauthError?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const error = state?.error ?? (oauthError ? (OAUTH_ERRORS[oauthError] ?? OAUTH_FALLBACK) : null);
  const form = useRef<HTMLFormElement>(null);

  const fill = (email: string) => {
    const f = form.current!;
    (f.elements.namedItem("email") as HTMLInputElement).value = email;
    const pw = f.elements.namedItem("password") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(pw, "password123");
    pw.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <>
      <Card className="p-6 sm:p-8">
        <form ref={form} action={action} className="space-y-5">
          <input type="hidden" name="next" value={next} />
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input id="login-email" name="email" type="email" required placeholder="nama@email.com" className="field" autoComplete="email" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-ink" htmlFor="login-password">
                Kata Sandi
              </label>
            </div>
            <PasswordInput id="login-password" name="password" placeholder="Masukkan kata sandi" required />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Masuk
          </Button>
        </form>

        <OrDivider label="atau masuk dengan" />
        <SocialButtons next={next} />

        {/* demo accounts live in the same card, below the social buttons */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">Akun demo · password123</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => fill(d.email)}
                className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-semibold text-body transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}
