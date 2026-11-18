import Link from "@/components/link";
import { ArrowRight, Briefcase, Copy, Pencil, Plus, Trash2, XCircle, RotateCcw, Send } from "lucide-react";
import type { JobStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { deleteJob, duplicateJob, setJobStatus } from "@/server/company-actions";
import { ActionButton } from "@/components/forms";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, StatCard, Table, Tabs } from "@/components/ui";
import { JOB_STATUS_LABEL, JOB_TYPE_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

const TABS = [
  { href: "/company/recruitment", label: "Lowongan Aktif", status: "ACTIVE" as JobStatus },
  { href: "/company/recruitment/drafts", label: "Draft", status: "DRAFT" as JobStatus },
  { href: "/company/recruitment/history", label: "Riwayat / Ditutup", status: "CLOSED" as JobStatus },
];

export async function JobsTablePage({ status, q }: { status: JobStatus; q?: string }) {
  const { company } = await requireCompany();
  const [counts, jobs, appStats] = await Promise.all([
    db.job.groupBy({ by: ["status"], where: { companyId: company.id }, _count: true }),
    db.job.findMany({
      where: { companyId: company.id, status, ...(q ? { title: { contains: q } } : {}) },
      include: { _count: { select: { applications: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.application.groupBy({ by: ["jobId", "status"], where: { job: { companyId: company.id } }, _count: true }),
  ]);
  const count = (s: JobStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const statFor = (jobId: string, statuses: string[]) => appStats.filter((a) => a.jobId === jobId && statuses.includes(a.status)).reduce((x, y) => x + y._count, 0);
  const totalApps = appStats.reduce((a, b) => a + b._count, 0);
  const shortlisted = appStats.filter((a) => ["SHORTLISTED", "INTERVIEW"].includes(a.status)).reduce((x, y) => x + y._count, 0);
  const pipeline = appStats.filter((a) => ["OFFERED", "HIRED"].includes(a.status)).reduce((x, y) => x + y._count, 0);
  const tab = TABS.find((t) => t.status === status)!;

  return (
    <>
      <PageHeader
        title={tab.label}
        description="Kelola lowongan kerja Anda dan tinjau pelamar yang masuk."
        action={
          <ButtonLink href="/company/recruitment/new">
            <Plus className="h-4 w-4" /> Post New Job
          </ButtonLink>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Lowongan Aktif" value={count("ACTIVE")} />
        <StatCard label="Total Pelamar" value={totalApps} />
        <StatCard label="Shortlisted" value={shortlisted} />
        <StatCard label="Hiring Pipeline" value={<span className="text-brand-700">{pipeline}</span>} />
      </div>
      <Tabs tabs={TABS.map((t) => ({ href: t.href, label: t.label, count: count(t.status) }))} active={tab.href} />
      <Card>
        <form className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">
              {jobs.length} {tab.label}
            </p>
          </div>
          <div className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Cari lowongan…" className="field py-2!" />
            <Button type="submit" variant="secondary">
              Cari
            </Button>
          </div>
        </form>
        {jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="Tidak ada lowongan" action={status !== "CLOSED" && <ButtonLink href="/company/recruitment/new">Buat lowongan</ButtonLink>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Posisi Pekerjaan</th>
                <th>Lokasi</th>
                <th>Tipe</th>
                <th>Pelamar</th>
                <th>Batas Waktu</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const total = j._count.applications;
                const fresh = statFor(j.id, ["APPLIED"]);
                const sl = statFor(j.id, ["SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"]);
                return (
                  <tr key={j.id}>
                    <td>
                      <Link href={`/company/recruitment/${j.id}`} className="font-semibold text-ink hover:text-brand-600">
                        {j.title}
                      </Link>
                      <p className="text-xs text-brand-600">{j.department}</p>
                    </td>
                    <td className="text-body">
                      {j.city}
                      <p className="text-xs text-muted">{j.province}</p>
                    </td>
                    <td className="text-body">{JOB_TYPE_LABEL[j.type]}</td>
                    <td className="min-w-[150px]">
                      <p className="font-medium text-ink">{total} Pelamar</p>
                      <div className="mt-1 flex h-1.5 w-32 overflow-hidden rounded-full bg-subtle">
                        <div className="bg-brand-700" style={{ width: `${total ? (fresh / total) * 100 : 0}%` }} />
                        <div className="bg-emerald-600" style={{ width: `${total ? (sl / total) * 100 : 0}%` }} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {fresh} baru · {sl} shortlisted
                      </p>
                    </td>
                    <td className="text-body">{fmtDate(j.deadline)}</td>
                    <td>
                      <Badge tone={j.status === "ACTIVE" ? "success" : j.status === "DRAFT" ? "neutral" : "danger"}>{JOB_STATUS_LABEL[j.status]}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {j.status !== "DRAFT" && (
                          <Link href={`/company/recruitment/${j.id}`} className="mr-1 inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap text-brand-600 hover:underline">
                            Pelamar <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <ButtonLink href={`/company/recruitment/${j.id}/edit`} variant="ghost" size="icon" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </ButtonLink>
                        <form action={duplicateJob}>
                          <input type="hidden" name="id" value={j.id} />
                          <Button variant="ghost" size="icon" title="Duplikat">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </form>
                        {j.status === "ACTIVE" && (
                          <ActionButton action={setJobStatus} data={{ id: j.id, status: "CLOSED" }} confirm="Tutup lowongan ini?" variant="ghost" size="icon" title="Tutup">
                            <XCircle className="h-4 w-4" />
                          </ActionButton>
                        )}
                        {j.status === "CLOSED" && (
                          <ActionButton action={setJobStatus} data={{ id: j.id, status: "ACTIVE" }} variant="ghost" size="icon" title="Buka kembali">
                            <RotateCcw className="h-4 w-4" />
                          </ActionButton>
                        )}
                        {j.status === "DRAFT" && (
                          <>
                            <ActionButton action={setJobStatus} data={{ id: j.id, status: "ACTIVE" }} variant="ghost" size="icon" title="Publikasikan">
                              <Send className="h-4 w-4" />
                            </ActionButton>
                            <ActionButton action={deleteJob} data={{ id: j.id }} confirm="Hapus draft ini?" variant="ghost" size="icon" title="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
