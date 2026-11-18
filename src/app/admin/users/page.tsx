import Link from "@/components/link";
import { Users } from "lucide-react";
import type { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { setUserStatus } from "@/server/admin-actions";
import { ActionButton } from "@/components/forms";
import { qs } from "@/components/filters";
import { Avatar, Badge, Card, EmptyState, PageHeader, Pagination, Table, Tabs } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

const PER = 20;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ role?: string; status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const { user: me } = await requireAdmin();
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    ...(sp.role ? { role: sp.role as Role } : {}),
    ...(sp.status ? { status: sp.status as UserStatus } : {}),
    ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }] } : {}),
  };
  const [counts, total, users] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: true }),
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: { companyMember: { include: { company: { select: { name: true } } } }, school: { select: { name: true } }, institution: { select: { name: true } }, student: { select: { school: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
  ]);
  const c = (r: string) => counts.find((x) => x.role === r)?._count ?? 0;
  const all = counts.reduce((a, b) => a + b._count, 0);
  const tabs = [{ href: "/admin/users", label: "Semua", count: all }, ...(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ href: `/admin/users?role=${r}`, label: ROLE_LABEL[r], count: c(r) }))];
  return (
    <>
      <PageHeader title="User Management" description="Kelola seluruh akun di platform VocAZ." />
      <Tabs tabs={tabs} active={sp.role ? `/admin/users?role=${sp.role}` : "/admin/users"} />
      <form className="mb-4 flex flex-wrap gap-2">
        {sp.role && <input type="hidden" name="role" value={sp.role} />}
        <input name="q" defaultValue={sp.q} placeholder="Cari nama / email…" className="field max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="field w-auto!">
          <option value="">Semua status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="SUSPENDED">Ditangguhkan</option>
        </select>
        <button className="rounded-lg bg-ink px-4 text-sm font-semibold text-white">Filter</button>
      </form>
      <Card>
        {users.length === 0 ? (
          <EmptyState icon={Users} title="Tidak ada pengguna" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Organisasi</th>
                <th>Bergabung</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                      <Avatar src={u.avatarUrl} name={u.name} size={34} />
                      <div>
                        <p className="font-semibold text-ink hover:text-brand-600">{u.name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <Badge tone={u.role === "ADMIN" ? "brand" : "neutral"}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                  <td className="text-body">{u.companyMember?.company.name ?? u.school?.name ?? u.institution?.name ?? u.student?.school?.name ?? "-"}</td>
                  <td className="text-muted">{fmtDate(u.createdAt)}</td>
                  <td>
                    <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}</Badge>
                  </td>
                  <td className="text-right">
                    {u.id !== me.id &&
                      (u.status === "ACTIVE" ? (
                        <ActionButton action={setUserStatus} data={{ id: u.id, status: "SUSPENDED" }} confirm={`Tangguhkan akun ${u.name}?`} variant="ghost" size="sm" className="text-red-600">
                          Tangguhkan
                        </ActionButton>
                      ) : (
                        <ActionButton action={setUserStatus} data={{ id: u.id, status: "ACTIVE" }} variant="ghost" size="sm" className="text-emerald-700">
                          Aktifkan
                        </ActionButton>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Pagination page={page} totalPages={Math.ceil(total / PER)} makeHref={(p) => `/admin/users${qs(sp, { page: p })}`} />
    </>
  );
}
