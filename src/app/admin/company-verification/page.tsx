import Link from "@/components/link";
import { ShieldCheck } from "lucide-react";
import type { CompanyVerificationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Avatar, Badge, Card, EmptyState, PageHeader, Table, Tabs } from "@/components/ui";
import { COMPANY_VERIFY_LABEL } from "@/lib/constants";
import { fmtDate, timeAgo } from "@/lib/utils";

export default async function CompanyVerificationList({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  await requireAdmin();
  const status = (sp.status ?? "PENDING") as CompanyVerificationStatus;
  const counts = await db.company.groupBy({ by: ["verificationStatus"], _count: true });
  const c = (s: string) => counts.find((x) => x.verificationStatus === s)?._count ?? 0;
  const companies = await db.company.findMany({
    where: { verificationStatus: status },
    include: { _count: { select: { documents: true, jobs: true } }, verifications: { orderBy: { submittedAt: "desc" }, take: 1 }, members: { where: { role: "OWNER" }, include: { user: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Verifikasi Perusahaan" description="Perusahaan boleh menggunakan VocAZ tanpa verifikasi — status Verified Company diberikan setelah review dokumen legal." />
      <Tabs
        active={`/admin/company-verification?status=${status}`}
        tabs={(["PENDING", "VERIFIED", "REJECTED", "UNVERIFIED"] as const).map((s) => ({ href: `/admin/company-verification?status=${s}`, label: COMPANY_VERIFY_LABEL[s], count: c(s) }))}
      />
      <Card>
        {companies.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Tidak ada perusahaan" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Perusahaan</th>
                <th>Pemilik akun</th>
                <th>Dokumen</th>
                <th>Diajukan</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {companies.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={x.logoUrl} name={x.name} size={36} square />
                      <div>
                        <p className="font-semibold text-ink">{x.name}</p>
                        <p className="text-xs text-muted">
                          {x.industry} · {x.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-body">
                    {x.members[0]?.user.name}
                    <p className="text-xs text-muted">{x.members[0]?.user.email}</p>
                  </td>
                  <td className="text-body">{x._count.documents} file</td>
                  <td className="text-muted">
                    {x.verifications[0] ? (
                      <>
                        {fmtDate(x.verifications[0].submittedAt)}
                        <p className="text-xs">{timeAgo(x.verifications[0].submittedAt)}</p>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <Badge tone={x.verificationStatus === "VERIFIED" ? "success" : x.verificationStatus === "PENDING" ? "warning" : x.verificationStatus === "REJECTED" ? "danger" : "neutral"}>
                      {COMPANY_VERIFY_LABEL[x.verificationStatus]}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/company-verification/${x.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                      {x.verificationStatus === "PENDING" ? "Review →" : "Detail →"}
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
