import Link from "@/components/link";
import { Send, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { withdrawApplication } from "@/server/student-actions";
import { ActionButton } from "@/components/forms";
import { MatchBadge } from "@/components/badges";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { APP_STATUS_LABEL, APP_STATUS_TONE, PIPELINE } from "@/lib/constants";
import { cn, fmtDate, timeAgo } from "@/lib/utils";
import type { ApplicationStatus } from "@prisma/client";

const FILTERS: { key: string; label: string; statuses?: ApplicationStatus[] }[] = [
  { key: "", label: "Semua" },
  { key: "active", label: "Dalam proses", statuses: ["APPLIED", "REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED"] },
  { key: "hired", label: "Diterima", statuses: ["HIRED"] },
  { key: "closed", label: "Ditolak / batal", statuses: ["REJECTED", "WITHDRAWN"] },
];

export default async function Applications({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "" } = await searchParams;
  const { student } = await requireStudent();
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const apps = await db.application.findMany({
    where: { studentId: student.id, ...(filter.statuses ? { status: { in: filter.statuses } } : {}) },
    include: { job: { include: { company: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Career Hub" description="Pantau status setiap lamaranmu secara real-time." />
      <Tabs
        active="/student/career/applications"
        tabs={[
          { href: "/student/career", label: "Explore Jobs" },
          { href: "/student/career/saved", label: "Tersimpan" },
          { href: "/student/career/applications", label: "Lamaran Saya" },
        ]}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/student/career/applications${x.key ? `?f=${x.key}` : ""}`}
            className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold", x.key === filter.key ? "bg-ink text-white" : "bg-surface text-body ring-1 ring-line hover:bg-subtle")}
          >
            {x.label}
          </Link>
        ))}
      </div>
      {apps.length === 0 ? (
        <Card>
          <EmptyState icon={Send} title="Belum ada lamaran" action={<ButtonLink href="/student/career">Explore Jobs</ButtonLink>} />
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const idx = PIPELINE.indexOf(a.status);
            const history = (Array.isArray(a.history) ? a.history : []) as { status: ApplicationStatus; at: string }[];
            return (
              <Card key={a.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Avatar src={a.job.company.logoUrl} name={a.job.company.name} size={48} square />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/student/career/jobs/${a.jobId}`} className="font-semibold text-ink hover:text-brand-600">
                        {a.job.title}
                      </Link>
                      <Badge tone={APP_STATUS_TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {a.job.company.name} · Dilamar {fmtDate(a.createdAt)} · Update {timeAgo(a.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MatchBadge score={a.matchScore} size="sm" />
                    {!["HIRED", "REJECTED", "WITHDRAWN"].includes(a.status) && (
                      <ActionButton action={withdrawApplication} data={{ id: a.id }} confirm="Batalkan lamaran ini?" variant="ghost" size="sm">
                        <X className="h-4 w-4" /> Batalkan
                      </ActionButton>
                    )}
                  </div>
                </div>
                {idx >= 0 ? (
                  <div className="mt-5 grid grid-cols-6 gap-1.5">
                    {PIPELINE.map((p, i) => (
                      <div key={p}>
                        <div className={cn("h-1.5 rounded-full", i <= idx ? (a.status === "HIRED" ? "bg-emerald-500" : "bg-brand-600") : "bg-line")} />
                        <p className={cn("mt-1.5 hidden text-[11px] font-medium sm:block", i <= idx ? "text-ink" : "text-muted")}>{APP_STATUS_LABEL[p]}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg bg-subtle px-3 py-2 text-sm text-muted">
                    {a.status === "REJECTED" ? "Terima kasih telah melamar. Perusahaan memutuskan untuk melanjutkan dengan kandidat lain." : "Lamaran ini telah kamu batalkan."}
                  </p>
                )}
                {history.length > 1 && (
                  <p className="mt-3 text-xs text-muted">Riwayat: {history.map((h) => `${APP_STATUS_LABEL[h.status]} (${fmtDate(h.at, "d MMM")})`).join(" → ")}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
