import Link from "@/components/link";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireSchool } from "@/lib/session";
import { computeMatch } from "@/lib/match";
import { getWeights, jobRequirement, talentInclude, toMatchTalent } from "@/lib/match-data";
import { Avatar, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { MatchBadge } from "@/components/badges";
import { CAREER_TABS } from "../tabs";

export default async function Recommended() {
  const { school } = await requireSchool();
  const [students, jobs, weights] = await Promise.all([
    db.studentProfile.findMany({ where: { schoolId: school.id, seekingStatus: { not: "NOT_LOOKING" } }, include: talentInclude }),
    db.job.findMany({ where: { status: "ACTIVE" }, include: { company: { select: { name: true } } } }),
    getWeights(),
  ]);
  const applied = await db.application.findMany({ where: { student: { schoolId: school.id } }, select: { studentId: true, jobId: true } });
  const rows = students
    .map((s) => {
      const mt = toMatchTalent(s);
      const recs = jobs
        .filter((j) => !applied.some((a) => a.studentId === s.id && a.jobId === j.id))
        .map((j) => ({ j, m: computeMatch(mt, jobRequirement(j), weights) }))
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 3);
      return { s, recs };
    })
    .sort((a, b) => (b.recs[0]?.m.score ?? 0) - (a.recs[0]?.m.score ?? 0));

  return (
    <>
      <PageHeader title="Career Monitoring" description="Peluang yang dinilai paling relevan untuk setiap siswa berdasarkan Smart Match." />
      <Tabs tabs={CAREER_TABS} active="/school/career/recommended" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Sparkles} title="Belum ada siswa yang sedang mencari peluang" />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ s, recs }) => (
            <Card key={s.id} className="p-5">
              <Link href={`/school/students/${s.id}`} className="flex items-center gap-3">
                <Avatar src={s.user.avatarUrl} name={s.user.name} size={42} />
                <div className="min-w-0">
                  <p className="font-semibold text-ink hover:text-brand-600">{s.user.name}</p>
                  <p className="truncate text-xs text-muted">
                    {s.major} · {s.city}
                  </p>
                </div>
              </Link>
              <ul className="mt-4 space-y-2">
                {recs.map(({ j, m }) => (
                  <li key={j.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Link href={`/lowongan/${j.id}`} target="_blank" className="block truncate text-sm font-semibold text-ink hover:text-brand-600">
                        {j.title}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {j.company.name} · {m.reasons.find((r) => r.ok)?.text}
                      </p>
                    </div>
                    <MatchBadge score={m.score} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
