import Link from "@/components/link";
import { notFound } from "next/navigation";
import { Briefcase, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { getTalent } from "@/server/queries";
import { verifyStudent } from "@/server/school-actions";
import { TalentProfileView } from "@/components/views/talent-profile";
import { ActionButton } from "@/components/forms";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { MatchBadge } from "@/components/badges";
import { APP_STATUS_LABEL, APP_STATUS_TONE, VERIFY_STATUS_LABEL } from "@/lib/constants";
import { fmtDate, timeAgo } from "@/lib/utils";

export default async function SchoolStudent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { school } = await requireSchool();
  const s = await db.studentProfile.findFirst({ where: { id, schoolId: school.id } });
  if (!s) notFound();
  const [t, apps, allCerts] = await Promise.all([
    getTalent(s.slug),
    db.application.findMany({ where: { studentId: id }, include: { job: { include: { company: true } } }, orderBy: { updatedAt: "desc" } }),
    db.certificate.findMany({ where: { studentId: id }, include: { institution: true }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!t) notFound();
  return (
    <>
      <PageHeader back={{ href: "/school/students", label: "Siswa" }} title="Student Profile" />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Career activity" description={`${apps.length} lamaran`} />
          {apps.length === 0 ? (
            <EmptyState icon={Briefcase} title="Belum ada lamaran" />
          ) : (
            <ul className="divide-y divide-line">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{a.job.title}</p>
                    <p className="truncate text-xs text-muted">
                      {a.job.company.name} · {timeAgo(a.updatedAt)}
                    </p>
                  </div>
                  <MatchBadge score={a.matchScore} size="sm" />
                  <Badge tone={APP_STATUS_TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Status verifikasi"
            action={
              !s.schoolVerified && (
                <ActionButton action={verifyStudent} data={{ id: s.id }} size="sm" variant="teal">
                  <GraduationCap className="h-4 w-4" /> Verifikasi siswa
                </ActionButton>
              )
            }
          />
          <ul className="divide-y divide-line">
            <li className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-body">Status siswa (School Verified)</span>
              <Badge tone={s.schoolVerified ? "success" : "warning"}>{s.schoolVerified ? "Terverifikasi" : "Menunggu"}</Badge>
            </li>
            {allCerts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-body">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.institution?.name} · {fmtDate(c.createdAt)}
                  </p>
                </div>
                <Badge tone={c.status === "VERIFIED" ? "success" : c.status === "REJECTED" ? "danger" : "warning"}>{VERIFY_STATUS_LABEL[c.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <TalentProfileView t={t} mode="full" />
      <p className="mt-4 text-center text-xs text-muted">
        Lihat juga{" "}
        <Link href={`/talenta/${t.slug}`} className="underline">
          profil publik siswa
        </Link>
      </p>
    </>
  );
}
