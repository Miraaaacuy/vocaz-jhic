import Link from "@/components/link";
import { Award } from "lucide-react";
import { db } from "@/lib/db";
import { requireInstitution } from "@/lib/session";
import { Card, EmptyState, PageHeader, Table } from "@/components/ui";
import { CERT_TYPE_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

export default async function Records({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { institution } = await requireInstitution();
  const certs = await db.certificate.findMany({
    where: {
      institutionId: institution.id,
      status: "VERIFIED",
      ...(q ? { OR: [{ number: { contains: q } }, { name: { contains: q } }, { student: { user: { name: { contains: q } } } }] } : {}),
    },
    include: { student: { include: { user: true, school: true } } },
    orderBy: { reviewedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Certificate Records" description={`Database ${certs.length} sertifikat yang telah diverifikasi ${institution.name}.`} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Cari nomor sertifikat atau nama pemegang…" className="field max-w-md" />
        <button className="rounded-lg bg-ink px-4 text-sm font-semibold text-white">Cari</button>
      </form>
      <Card>
        {certs.length === 0 ? (
          <EmptyState icon={Award} title="Belum ada record" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Pemegang</th>
                <th>Sertifikat</th>
                <th>Terbit</th>
                <th>Berlaku</th>
                <th>Diverifikasi</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.number}</td>
                  <td>
                    <p className="font-semibold text-ink">{c.student.user.name}</p>
                    <p className="text-xs text-muted">{c.student.school?.name}</p>
                  </td>
                  <td>
                    <p className="text-ink">{c.name}</p>
                    <p className="text-xs text-muted">{CERT_TYPE_LABEL[c.type]}</p>
                  </td>
                  <td className="text-muted">{fmtDate(c.issuedAt)}</td>
                  <td className="text-muted">{c.expiresAt ? fmtDate(c.expiresAt) : "-"}</td>
                  <td className="text-muted">{fmtDate(c.reviewedAt)}</td>
                  <td className="text-right">
                    <Link href={`/institution/records/${c.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                      Detail →
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
