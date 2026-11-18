import { Crown, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { addTeamMember, updateTeamMember } from "@/server/company-actions";
import { ActionButton, FormModal, PasswordInput } from "@/components/forms";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Select, StatCard, Table } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const ROLE = { OWNER: "Owner", ADMIN: "Admin", RECRUITER: "Recruiter" } as const;

export default async function Team() {
  const { company, member } = await requireCompany();
  const members = await db.companyMember.findMany({
    where: { companyId: company.id },
    include: { user: { select: { name: true, email: true, avatarUrl: true, lastLoginAt: true, _count: { select: { jobsCreated: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const canManage = member.role !== "RECRUITER";
  return (
    <>
      <PageHeader
        title="Tim Rekruter"
        description="Kelola anggota tim yang memiliki akses ke akun perusahaan."
        action={
          canManage && (
            <FormModal
              title="Tambah anggota tim"
              description="Anggota baru dapat login dengan email & kata sandi awal berikut."
              action={addTeamMember}
              submitLabel="Tambah anggota"
              trigger={
                <Button>
                  <UserPlus className="h-4 w-4" /> Undang Anggota
                </Button>
              }
            >
              <Field label="Nama lengkap" required>
                <Input name="name" required />
              </Field>
              <Field label="Email kerja" required>
                <Input name="email" type="email" required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jabatan">
                  <Input name="position" placeholder="cth. Technical Recruiter" />
                </Field>
                <Field label="Peran">
                  <Select
                    name="role"
                    options={[
                      { value: "RECRUITER", label: "Recruiter — kelola lowongan & pelamar" },
                      { value: "ADMIN", label: "Admin — + kelola tim & profil" },
                    ]}
                  />
                </Field>
              </div>
              <Field label="Kata sandi awal" required hint="Minta anggota mengganti kata sandi setelah login.">
                <PasswordInput name="password" required minLength={8} showStrength />
              </Field>
            </FormModal>
          )
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total anggota" value={members.length} icon={Users} />
        <StatCard label="Admin" value={members.filter((m) => m.role !== "RECRUITER").length} icon={Shield} tone="teal" />
      </div>
      <Card>
        <Table>
          <thead>
            <tr>
              <th>Anggota</th>
              <th>Jabatan</th>
              <th>Peran</th>
              <th>Lowongan dibuat</th>
              <th>Login terakhir</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar src={m.user.avatarUrl} name={m.user.name} size={36} />
                    <div>
                      <p className="font-semibold text-ink">
                        {m.user.name} {m.id === member.id && <span className="text-xs font-normal text-muted">(Anda)</span>}
                      </p>
                      <p className="text-xs text-muted">{m.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-body">{m.position ?? "-"}</td>
                <td>
                  <Badge tone={m.role === "OWNER" ? "brand" : m.role === "ADMIN" ? "info" : "neutral"} icon={m.role === "OWNER" ? Crown : undefined}>
                    {ROLE[m.role]}
                  </Badge>
                </td>
                <td className="text-body">{m.user._count.jobsCreated}</td>
                <td className="text-muted">{fmtDate(m.user.lastLoginAt, "d MMM yyyy HH:mm")}</td>
                <td>
                  {member.role === "OWNER" && m.role !== "OWNER" && (
                    <div className="flex justify-end gap-1">
                      <ActionButton action={updateTeamMember} data={{ id: m.id, role: m.role === "ADMIN" ? "RECRUITER" : "ADMIN" }} variant="ghost" size="sm">
                        Jadikan {m.role === "ADMIN" ? "Recruiter" : "Admin"}
                      </ActionButton>
                      <ActionButton action={updateTeamMember} data={{ id: m.id, remove: "1" }} confirm={`Hapus ${m.user.name} dari tim? Akun akan dihapus.`} variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
