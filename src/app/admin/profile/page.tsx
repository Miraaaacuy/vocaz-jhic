import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { updateAdminProfile } from "@/server/admin-actions";
import { changePassword } from "@/server/common-actions";
import { ActionForm, FileInput, PasswordInput, SubmitButton } from "@/components/forms";
import { Avatar, Card, CardHeader, DescList, Field, Input, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default async function AdminProfile() {
  const { user } = await requireAdmin();
  const u = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  const actions = await db.activityLog.count({ where: { userId: u.id } });
  return (
    <>
      <PageHeader title="Admin Profile" description="Profil dan keamanan akun Super Admin." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profil" />
          <ActionForm action={updateAdminProfile} className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <Avatar src={u.avatarUrl} name={u.name} size={72} />
              <div className="flex-1">
                <FileInput name="avatar" accept="image/*" preview="image" hint="Maks. 3 MB" />
              </div>
            </div>
            <Field label="Nama">
              <Input name="name" defaultValue={u.name} required />
            </Field>
            <Field label="Telepon">
              <Input name="phone" defaultValue={u.phone ?? ""} />
            </Field>
            <SubmitButton>Simpan profil</SubmitButton>
          </ActionForm>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Akun" />
            <div className="p-5">
              <DescList
                items={[
                  { label: "Email", value: u.email },
                  { label: "Peran", value: "Super Admin" },
                  { label: "Login terakhir", value: fmtDate(u.lastLoginAt, "d MMM yyyy HH:mm") },
                  { label: "Tindakan tercatat", value: actions },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Keamanan" description="Gunakan kata sandi yang kuat untuk akun admin." />
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
        </div>
      </div>
    </>
  );
}
