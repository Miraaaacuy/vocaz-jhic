import { Bell, Link2, Lock, ShieldCheck, UserCog } from "lucide-react";
import { db } from "@/lib/db";
import { changePassword, savePreferences } from "@/server/common-actions";
import { ActionForm, PasswordInput, SubmitButton } from "../forms";
import { LinkedAccounts } from "../social-login";
import { Card, CardHeader, Checkbox, DescList, Field, PageHeader } from "../ui";
import { ROLE_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

type Prefs = Record<string, boolean>;
/** `?oauth=linked|taken&provider=google|facebook` — set when returning from a "Tautkan" round-trip */
export type OAuthNotice = { oauth?: string; provider?: string };

const PROVIDER_LABEL: Record<string, string> = { google: "Google", facebook: "Facebook" };

function oauthNotice({ oauth, provider }: OAuthNotice, isLinked: (p: string) => boolean) {
  const label = PROVIDER_LABEL[provider ?? ""];
  if (!label) return undefined;
  if (oauth === "linked" && isLinked(provider!)) return { ok: true, text: `Akun ${label} berhasil ditautkan. Sekarang kamu bisa masuk dengan ${label}.` };
  if (oauth === "taken") return { ok: false, text: `Akun ${label} itu sudah ditautkan ke akun VocAZ lain.` };
  return undefined;
}

export async function SettingsView({ userId, extra, notice }: { userId: string; extra?: React.ReactNode; notice?: OAuthNotice }) {
  const u = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { student: { select: { isPublic: true } }, oauthAccounts: { select: { provider: true, email: true } } },
  });
  const p: Prefs = {
    notif_email: true,
    notif_message: true,
    notif_application: true,
    notif_verification: true,
    notif_opportunity: true,
    privacy_public: u.student?.isPublic ?? true,
    privacy_contact: true,
    ...((u.prefs as Prefs) ?? {}),
  };
  return (
    <>
      <PageHeader title="Pengaturan" description="Kelola akun, keamanan, privasi, dan notifikasi." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-brand-600" /> Akun
              </span>
            }
          />
          <div className="p-5">
            <DescList
              items={[
                { label: "Nama", value: u.name },
                { label: "Email", value: u.email },
                { label: "Jenis akun", value: ROLE_LABEL[u.role] },
                { label: "Bergabung", value: fmtDate(u.createdAt) },
                { label: "Login terakhir", value: fmtDate(u.lastLoginAt, "d MMM yyyy, HH:mm") },
                { label: "Status", value: u.status === "ACTIVE" ? "Aktif" : "Ditangguhkan" },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-brand-600" /> Keamanan
              </span>
            }
            description="Ubah kata sandi akun kamu."
          />
          <ActionForm action={changePassword} resetOnSuccess className="space-y-4 p-5">
            <Field label="Kata sandi saat ini">
              <PasswordInput name="current" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kata sandi baru">
                <PasswordInput name="password" showStrength required minLength={8} />
              </Field>
              <Field label="Konfirmasi">
                <PasswordInput name="confirm" required />
              </Field>
            </div>
            <SubmitButton>Ubah kata sandi</SubmitButton>
          </ActionForm>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-brand-600" /> Akun tertaut
              </span>
            }
            description="Tautkan Google atau Facebook supaya bisa masuk tanpa mengetik kata sandi."
          />
          <LinkedAccounts linked={u.oauthAccounts} notice={notice && oauthNotice(notice, (p) => u.oauthAccounts.some((a) => a.provider === p))} />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-600" /> Notifikasi & Privasi
              </span>
            }
          />
          <ActionForm action={savePreferences} className="grid gap-6 p-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink">Kirim notifikasi untuk</p>
              <Checkbox name="notif_message" defaultChecked={p.notif_message} label="Pesan baru" />
              <Checkbox name="notif_application" defaultChecked={p.notif_application} label="Update lamaran / rekrutmen" />
              <Checkbox name="notif_verification" defaultChecked={p.notif_verification} label="Hasil verifikasi" />
              <Checkbox name="notif_opportunity" defaultChecked={p.notif_opportunity} label="Rekomendasi peluang karier" />
              <Checkbox name="notif_email" defaultChecked={p.notif_email} label="Salinan notifikasi ke email" />
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck className="h-4 w-4" /> Privasi
              </p>
              {u.role === "STUDENT" && <Checkbox name="privacy_public" defaultChecked={p.privacy_public} label="Tampilkan profil saya di direktori publik Talenta SMK" />}
              <Checkbox name="privacy_contact" defaultChecked={p.privacy_contact} label="Izinkan recruiter terverifikasi menghubungi saya" />
              {extra}
            </div>
            <div className="md:col-span-2">
              <SubmitButton>Simpan pengaturan</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
