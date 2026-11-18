import Link from "@/components/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { setUserStatus } from "@/server/admin-actions";
import { ActionButton } from "@/components/forms";
import { Avatar, Badge, Card, CardHeader, DescList, PageHeader } from "@/components/ui";
import { COMPANY_VERIFY_LABEL, ROLE_LABEL } from "@/lib/constants";
import { fmtDate, timeAgo } from "@/lib/utils";

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user: me } = await requireAdmin();
  const u = await db.user.findUnique({
    where: { id },
    include: {
      student: { include: { school: true, _count: { select: { applications: true, videos: true, certificates: true, portfolio: true } } } },
      companyMember: { include: { company: { include: { _count: { select: { jobs: true, members: true } } } } } },
      school: { include: { _count: { select: { students: true, partners: true } } } },
      institution: { include: { _count: { select: { certificates: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { reports: true, messages: true, notifications: true } },
    },
  });
  if (!u) notFound();
  const [reportsAgainst] = await Promise.all([
    db.report.count({ where: { targetId: { in: [u.student?.id, u.companyMember?.companyId].filter(Boolean) as string[] } } }),
  ]);
  const profileLink = u.student ? `/talenta/${u.student.slug}` : u.companyMember ? `/perusahaan/${u.companyMember.company.slug}` : null;

  return (
    <>
      <PageHeader back={{ href: "/admin/users", label: "User Management" }} title="User Detail" />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit p-6 text-center">
          <Avatar src={u.avatarUrl} name={u.name} size={88} className="mx-auto" />
          <p className="mt-3 text-lg font-bold text-ink">{u.name}</p>
          <p className="text-sm text-muted">{u.email}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Badge tone="brand">{ROLE_LABEL[u.role]}</Badge>
            <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}</Badge>
          </div>
          {u.id !== me.id && (
            <div className="mt-5">
              {u.status === "ACTIVE" ? (
                <ActionButton action={setUserStatus} data={{ id: u.id, status: "SUSPENDED" }} confirm="Tangguhkan akun ini? Pengguna tidak akan bisa login." variant="danger" className="w-full">
                  Tangguhkan akun
                </ActionButton>
              ) : (
                <ActionButton action={setUserStatus} data={{ id: u.id, status: "ACTIVE" }} variant="success" className="w-full">
                  Aktifkan kembali
                </ActionButton>
              )}
            </div>
          )}
          {profileLink && (
            <Link href={profileLink} target="_blank" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              Lihat profil publik <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Informasi akun" />
            <div className="p-5">
              <DescList
                items={[
                  { label: "Telepon", value: u.phone },
                  { label: "Bergabung", value: fmtDate(u.createdAt, "d MMM yyyy HH:mm") },
                  { label: "Login terakhir", value: u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Belum pernah" },
                  { label: "Pesan terkirim", value: u._count.messages },
                  { label: "Laporan dibuat", value: u._count.reports },
                  { label: "Laporan terhadap akun", value: reportsAgainst },
                ]}
              />
            </div>
          </Card>
          {u.student && (
            <Card>
              <CardHeader title="Data siswa" />
              <div className="p-5">
                <DescList
                  items={[
                    { label: "Sekolah", value: u.student.school?.name },
                    { label: "Program keahlian", value: u.student.major },
                    { label: "School verified", value: u.student.schoolVerified ? "Ya" : "Belum" },
                    { label: "Lamaran", value: u.student._count.applications },
                    { label: "Video / Portfolio", value: `${u.student._count.videos} / ${u.student._count.portfolio}` },
                    { label: "Sertifikat", value: u.student._count.certificates },
                  ]}
                />
              </div>
            </Card>
          )}
          {u.companyMember && (
            <Card>
              <CardHeader title="Data perusahaan" />
              <div className="p-5">
                <DescList
                  items={[
                    { label: "Perusahaan", value: u.companyMember.company.name },
                    { label: "Peran", value: `${u.companyMember.role} · ${u.companyMember.position ?? ""}` },
                    { label: "Verifikasi", value: COMPANY_VERIFY_LABEL[u.companyMember.company.verificationStatus] },
                    { label: "Lowongan", value: u.companyMember.company._count.jobs },
                    { label: "Anggota tim", value: u.companyMember.company._count.members },
                  ]}
                />
              </div>
            </Card>
          )}
          {u.school && (
            <Card>
              <CardHeader title="Data sekolah" />
              <div className="p-5">
                <DescList items={[{ label: "Sekolah", value: u.school.name }, { label: "NPSN", value: u.school.npsn }, { label: "Siswa", value: u.school._count.students }, { label: "Mitra", value: u.school._count.partners }]} />
              </div>
            </Card>
          )}
          {u.institution && (
            <Card>
              <CardHeader title="Data lembaga" />
              <div className="p-5">
                <DescList items={[{ label: "Lembaga", value: u.institution.name }, { label: "Lisensi", value: u.institution.accreditationNumber }, { label: "Sertifikat ditangani", value: u.institution._count.certificates }]} />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Aktivitas" />
            <ul className="divide-y divide-line">
              {u.activities.map((a) => (
                <li key={a.id} className="px-5 py-3 text-sm">
                  <p className="text-body">{a.message}</p>
                  <p className="text-xs text-muted">{timeAgo(a.createdAt)}</p>
                </li>
              ))}
              {u.activities.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted">Belum ada aktivitas tercatat</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
