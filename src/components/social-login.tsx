"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { linkOAuth, oauthLogin, unlinkOAuth } from "@/server/auth-actions";

/** "atau … dengan" separator between the email form and the social buttons */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium text-muted">
      <span className="h-px flex-1 bg-line" /> {label} <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {children}
    </div>
  );
}

/** Google + Facebook login buttons (login page). Only accounts linked from Settings can sign in this way. */
export function SocialButtons({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(oauthLogin, null);
  const [provider, setProvider] = useState<string | null>(null);
  const btn = "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition disabled:opacity-60";
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next ?? ""} />
      {state?.error && <ErrorNote>{state.error}</ErrorNote>}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          name="provider"
          value="google"
          onClick={() => setProvider("google")}
          disabled={pending}
          className={`${btn} border border-line-strong bg-white text-ink hover:bg-subtle`}
        >
          {pending && provider === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />} Google
        </button>
        <button
          type="submit"
          name="provider"
          value="facebook"
          onClick={() => setProvider("facebook")}
          disabled={pending}
          className={`${btn} bg-[#1568d8] text-white hover:bg-[#125ec6]`}
        >
          {pending && provider === "facebook" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FacebookIcon />} Facebook
        </button>
      </div>
    </form>
  );
}

const PROVIDERS = [
  { id: "google", label: "Google", Icon: GoogleIcon, tile: "border border-line bg-white" },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon, tile: "bg-[#1568d8] text-white" },
] as const;

export type LinkedAccount = { provider: string; email: string | null };

/** Settings card body: link / unlink Google and Facebook for the signed-in account. */
export function LinkedAccounts({ linked, notice }: { linked: LinkedAccount[]; notice?: { ok: boolean; text: string } }) {
  const [linkState, link, linking] = useActionState(linkOAuth, null);
  const [unlinkState, unlink, unlinking] = useActionState(unlinkOAuth, null);
  const [busy, setBusy] = useState<string | null>(null);
  const pending = linking || unlinking;

  useEffect(() => {
    if (unlinkState?.ok && unlinkState.message) toast.success(unlinkState.message);
  }, [unlinkState]);

  const error = linkState?.error ?? unlinkState?.error;
  return (
    <div className="p-5">
      {error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : (
        notice &&
        (notice.ok ? (
          <div role="status" className="mb-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice.text}
          </div>
        ) : (
          <ErrorNote>{notice.text}</ErrorNote>
        ))
      )}
      <ul className="divide-y divide-line">
        {PROVIDERS.map(({ id, label, Icon, tile }) => {
          const acc = linked.find((l) => l.provider === id);
          return (
            <li key={id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile}`}>
                <Icon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="truncate text-xs text-muted">{acc ? `Tertaut${acc.email ? ` sebagai ${acc.email}` : ""}` : "Belum ditautkan"}</p>
              </div>
              <form action={acc ? unlink : link}>
                <input type="hidden" name="provider" value={id} />
                <button
                  type="submit"
                  onClick={() => setBusy(id)}
                  disabled={pending}
                  aria-label={`${acc ? "Lepas tautan" : "Tautkan"} ${label}`}
                  className={
                    acc
                      ? "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                      : "inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                  }
                >
                  {pending && busy === id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {acc ? "Lepas tautan" : "Tautkan"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">Setelah ditautkan, kamu bisa masuk lewat tombol Google atau Facebook di halaman login. Email dan kata sandi tetap berlaku.</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.57-5.17 3.57-8.83Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.6H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.99-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.6l3.99 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}
