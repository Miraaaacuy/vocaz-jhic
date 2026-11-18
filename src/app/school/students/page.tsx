import Link from "@/components/link";
import { CheckCheck, GraduationCap, Play, Users, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { verifyAllPending, verifyStudent } from "@/server/school-actions";
import { ActionButton } from "@/components/forms";
import { Avatar, Badge, Card, EmptyState, PageHeader, Table, Tabs } from "@/components/ui";
import { SEEKING_LABEL } from "@/lib/constants";
import { strArr } from "@/lib/utils";

export default async function Students({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; major?: string }> }) {
  const sp = await searchParams;
  const { school } = await requireSchool();
  const base = { schoolId: school.id };
  const [all, pendingCount] = await Promise.all([db.studentProfile.count({ where: base }), db.studentProfile.count({ where: { ...base, schoolVerified: false } })]);
  const students = await db.studentProfile.findMany({
    where: {
      ...base,
      ...(sp.status === "pending" ? { schoolVerified: false } : sp.status === "verified" ? { schoolVerified: true } : {}),
      ...(sp.major ? { major: sp.major } : {}),
      ...(sp.q ? { OR: [{ user: { name: { contains: sp.q } } }, { nisn: { contains: sp.q } }] } : {}),
    },
    include: {
      user: true,
      certificates: { where: { status: "VERIFIED" }, select: { type: true } },
      _count: { select: { applications: true, videos: true } },
      applications: { where: { status: "HIRED" }, select: { id: true } },
    },
    orderBy: [{ schoolVerified: "asc" }, { user: { name: "asc" } }],
  });
  const tab = sp.status === "pending" ? "pending" : sp.status === "verified" ? "verified" : "";
  return (
    <>
      <PageHeader
        title="Siswa"
        description="BKK memonitor dan memvalidasi siswa yang terdaftar di sekolah — BKK bukan recruiter."
        action={
          pendingCount > 0 && (
            <ActionButton action={verifyAllPending} confirm={`Verifikasi semua ${pendingCount} siswa yang menunggu?`} variant="teal">
              <CheckCheck className="h-4 w-4" /> Verifikasi semua ({pendingCount})
            </ActionButton>
          )
        }
      />
      <Tabs
        active={`/school/students${tab ? `?status=${tab}` : ""}`}
        tabs={[
          { href: "/school/students", label: "Semua", count: all },
          { href: "/school/students?status=pending", label: "Menunggu verifikasi", count: pendingCount },
          { href: "/school/students?status=verified", label: "Terverifikasi", count: all - pendingCount },
        ]}
      />
      <form className="mb-4 flex flex-wrap gap-2">
        {tab && <input type="hidden" name="status" value={tab} />}
        <input name="q" defaultValue={sp.q} placeholder="Cari nama / NISN…" className="field max-w-xs" />
        <select name="major" defaultValue={sp.major ?? ""} className="field w-auto!">
          <option value="">Semua program</option>
          {strArr(school.programs).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button className="rounded-lg bg-ink px-4 text-sm font-semibold text-white">Filter</button>
      </form>
      <Card>
        {students.length === 0 ? (
          <EmptyState icon={Users} title="Tidak ada siswa" description="Siswa akan muncul di sini setelah memilih sekolah Anda saat mendaftar." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Program</th>
                <th>Status karier</th>
                <th>Sertifikat</th>
                <th>Lamaran</th>
                <th>Verifikasi</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/school/students/${s.id}`} className="flex items-center gap-3">
                      <Avatar src={s.user.avatarUrl} name={s.user.name} size={36} />
                      <div>
                        <p className="font-semibold text-ink hover:text-brand-600">{s.user.name}</p>
                        <p className="text-xs text-muted">
                          NISN {s.nisn ?? "-"} · Lulus {s.graduationYear}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="text-body">{s.major}</td>
                  <td>
                    {s.applications.length ? <Badge tone="success">Diterima kerja</Badge> : <Badge tone={s.seekingStatus === "NOT_LOOKING" ? "neutral" : "info"}>{SEEKING_LABEL[s.seekingStatus]}</Badge>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {s.certificates.length ? s.certificates.map((c, i) => <Badge key={i} tone={c.type === "BNSP" ? "warning" : "info"}>{c.type}</Badge>) : <span className="text-muted">-</span>}
                      {s._count.videos > 0 && <Play className="h-4 w-4 text-brand-600" />}
                    </div>
                  </td>
                  <td className="text-body">{s._count.applications}</td>
                  <td>{s.schoolVerified ? <Badge tone="success">Terverifikasi</Badge> : <Badge tone="warning">Menunggu</Badge>}</td>
                  <td>
                    {!s.schoolVerified && (
                      <div className="flex justify-end gap-1">
                        <ActionButton action={verifyStudent} data={{ id: s.id }} size="sm" variant="teal">
                          <GraduationCap className="h-3.5 w-3.5" /> Verifikasi
                        </ActionButton>
                        <ActionButton action={verifyStudent} data={{ id: s.id, decision: "reject" }} confirm="Tolak? Siswa akan dilepas dari sekolah ini." size="icon" variant="ghost">
                          <X className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
