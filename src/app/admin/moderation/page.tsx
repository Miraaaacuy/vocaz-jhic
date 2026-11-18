import Link from "@/components/link";
import { Flag } from "lucide-react";
import type { ReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Badge, Card, EmptyState, PageHeader, Table, Tabs } from "@/components/ui";
import { fmtDate, timeAgo } from "@/lib/utils";

const TYPE_LABEL = { VIDEO: "Video Showcase", PORTFOLIO: "Portfolio", PROFILE: "Profil", COMPANY: "Perusahaan", JOB: "Lowongan" } as const;
const STATUS_LABEL = { OPEN: "Terbuka", RESOLVED: "Ditindak", DISMISSED: "Diabaikan" } as const;

export default async function Moderation({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  await requireAdmin();
  const status = (sp.status ?? "OPEN") as ReportStatus;
  const counts = await db.report.groupBy({ by: ["status"], _count: true });
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  const reports = await db.report.findMany({ where: { status }, include: { reporter: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Moderasi Konten" description="Tinjau konten yang dilaporkan pengguna: video showcase, portfolio, profil, perusahaan, dan lowongan." />
      <Tabs active={`/admin/moderation?status=${status}`} tabs={(["OPEN", "RESOLVED", "DISMISSED"] as const).map((s) => ({ href: `/admin/moderation?status=${s}`, label: STATUS_LABEL[s], count: c(s) }))} />
      <Card>
        {reports.length === 0 ? (
          <EmptyState icon={Flag} title="Tidak ada laporan" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Konten</th>
                <th>Jenis</th>
                <th>Alasan</th>
                <th>Pelapor</th>
                <th>Tanggal</th>
                <th>Tindakan</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-[240px] font-semibold text-ink">{r.targetLabel}</td>
                  <td>
                    <Badge tone="danger">{TYPE_LABEL[r.targetType]}</Badge>
                  </td>
                  <td className="text-body">{r.reason}</td>
                  <td className="text-muted">{r.reporter?.name ?? "-"}</td>
                  <td className="text-muted">
                    {fmtDate(r.createdAt)}
                    <p className="text-xs">{timeAgo(r.createdAt)}</p>
                  </td>
                  <td className="max-w-[200px] text-xs text-muted">{r.action ?? "-"}</td>
                  <td className="text-right">
                    <Link href={`/admin/moderation/${r.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                      {r.status === "OPEN" ? "Tinjau →" : "Detail →"}
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
