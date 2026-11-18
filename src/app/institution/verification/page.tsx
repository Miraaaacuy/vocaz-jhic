import Link from "@/components/link";
import { ShieldCheck } from "lucide-react";
import type { VerifyStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireInstitution } from "@/lib/session";
import { Avatar, Badge, Card, EmptyState, PageHeader, Table, Tabs } from "@/components/ui";
import { CERT_TYPE_LABEL, VERIFY_STATUS_LABEL } from "@/lib/constants";
import { fmtDate, timeAgo } from "@/lib/utils";

export default async function VerificationList({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const { institution } = await requireInstitution();
  const status = (["PENDING", "VERIFIED", "REJECTED"].includes(sp.status ?? "") ? sp.status : sp.status === "history" ? "history" : "PENDING") as VerifyStatus | "history";
  const counts = await db.certificate.groupBy({ by: ["status"], where: { institutionId: institution.id }, _count: true });
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  const certs = await db.certificate.findMany({
    where: {
      institutionId: institution.id,
      ...(status === "history" ? { status: { not: "PENDING" } } : { status }),
      ...(sp.q ? { OR: [{ number: { contains: sp.q } }, { name: { contains: sp.q } }, { student: { user: { name: { contains: sp.q } } } }] } : {}),
    },
    include: { student: { include: { user: true, school: true } } },
    orderBy: status === "PENDING" ? { createdAt: "asc" } : { reviewedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Verifikasi Sertifikat" description="Tinjau sertifikat yang diunggah siswa dan cocokkan dengan arsip lembaga Anda." />
      <Tabs
        active={`/institution/verification?status=${status}`}
        tabs={[
          { href: "/institution/verification?status=PENDING", label: "Verification Requests", count: c("PENDING") },
          { href: "/institution/verification?status=history", label: "Verification History", count: c("VERIFIED") + c("REJECTED") },
          { href: "/institution/verification?status=VERIFIED", label: "Terverifikasi", count: c("VERIFIED") },
          { href: "/institution/verification?status=REJECTED", label: "Ditolak", count: c("REJECTED") },
        ]}
      />
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={sp.q} placeholder="Cari nomor sertifikat, nama siswa…" className="field max-w-md" />
        <button className="rounded-lg bg-ink px-4 text-sm font-semibold text-white">Cari</button>
      </form>
      <Card>
        {certs.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={status === "PENDING" ? "Tidak ada permintaan menunggu" : "Belum ada data"} />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Sertifikat</th>
                <th>Nomor</th>
                <th>Diajukan</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {certs.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={x.student.user.avatarUrl} name={x.student.user.name} size={34} />
                      <div>
                        <p className="font-semibold text-ink">{x.student.user.name}</p>
                        <p className="text-xs text-muted">{x.student.school?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-ink">{x.name}</p>
                    <p className="text-xs text-muted">{CERT_TYPE_LABEL[x.type]}</p>
                  </td>
                  <td className="font-mono text-xs">{x.number}</td>
                  <td className="text-muted">
                    {fmtDate(x.createdAt)}
                    <p className="text-xs">{timeAgo(x.createdAt)}</p>
                  </td>
                  <td>
                    <Badge tone={x.status === "VERIFIED" ? "success" : x.status === "REJECTED" ? "danger" : "warning"}>{VERIFY_STATUS_LABEL[x.status]}</Badge>
                  </td>
                  <td className="text-right">
                    <Link href={`/institution/verification/${x.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                      {x.status === "PENDING" ? "Tinjau →" : "Detail →"}
                    </Link>
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
