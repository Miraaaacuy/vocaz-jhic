import Link from "@/components/link";
import { Info, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { talentWhere } from "@/server/queries";
import { jobRequirement, preferenceRequirement, scoreTalents, talentInclude } from "@/lib/match-data";
import { CITIES, MAJORS } from "@/lib/constants";
import { qs } from "@/components/filters";
import { Button, ButtonLink, Card, EmptyState, PageHeader, Pagination, Tabs } from "@/components/ui";
import { MatchCard } from "./match-card";
import { strArr } from "@/lib/utils";

type SP = { job?: string; q?: string; major?: string; city?: string; cert?: string; video?: string; min?: string; page?: string };

export default async function TalentMatch({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { company } = await requireCompany();
  const page = Math.max(1, Number(sp.page) || 1);
  const [jobs, pref, savedRows] = await Promise.all([
    db.job.findMany({ where: { companyId: company.id, status: { in: ["ACTIVE", "DRAFT"] } }, orderBy: { updatedAt: "desc" } }),
    db.talentPreference.findUnique({ where: { companyId: company.id } }),
    db.savedTalent.findMany({ where: { companyId: company.id }, select: { studentId: true } }),
  ]);
  const job = sp.job ? jobs.find((j) => j.id === sp.job) : undefined;
  const req = job ? jobRequirement(job) : preferenceRequirement(pref);
  const candidates = await db.studentProfile.findMany({
    where: { AND: [talentWhere(sp), { seekingStatus: { not: "NOT_LOOKING" } }] },
    include: talentInclude,
    take: 400,
  });
  const min = Number(sp.min) || 0;
  const scored = (await scoreTalents(candidates, req)).filter((s) => s.match.score >= min);
  const per = 12;
  const rows = scored.slice((page - 1) * per, page * per);
  const saved = new Set(savedRows.map((s) => s.studentId));
  const criteria = [...req.requiredSkills, ...(req.niceSkills ?? [])];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600" /> Smart Talent Match
          </span>
        }
        description="Temukan talenta yang paling sesuai — setiap skor disertai alasan yang transparan."
        action={
          <ButtonLink href="/company/preferences" variant="secondary">
            <SlidersHorizontal className="h-4 w-4" /> Talent Preferences
          </ButtonLink>
        }
      />
      <Tabs
        active="/company/talent-match"
        tabs={[
          { href: "/company/talent-match", label: "Smart Talent Search" },
          { href: "/company/showcase", label: "Video Talent Showcase" },
          { href: "/company/talent-match/saved", label: "Talent Tersimpan", count: saved.size },
        ]}
      />

      <form className="card mb-4 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_auto]">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Cocokkan dengan</label>
          <select name="job" defaultValue={sp.job ?? ""} className="field py-2!">
            <option value="">Talent Preferences perusahaan</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                Lowongan: {j.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Cari</label>
          <input name="q" defaultValue={sp.q} placeholder="Nama / skill" className="field py-2!" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Jurusan</label>
          <select name="major" defaultValue={sp.major ?? ""} className="field py-2!">
            <option value="">Semua</option>
            {MAJORS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Kota</label>
          <select name="city" defaultValue={sp.city ?? ""} className="field py-2!">
            <option value="">Semua</option>
            {Object.keys(CITIES)
              .sort()
              .map((c) => (
                <option key={c}>{c}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Min. match</label>
          <select name="min" defaultValue={sp.min ?? ""} className="field py-2!">
            <option value="">Semua</option>
            <option value="60">≥ 60%</option>
            <option value="70">≥ 70%</option>
            <option value="80">≥ 80%</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm whitespace-nowrap">
            <input type="checkbox" name="cert" value="BNSP" defaultChecked={sp.cert === "BNSP"} className="h-4 w-4" /> BNSP
          </label>
          <Button type="submit">Cari</Button>
        </div>
      </form>

      <div className="mb-5 flex items-start gap-2 rounded-xl bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <b>{scored.length}</b> kandidat dinilai terhadap{" "}
          <b>{job ? `lowongan "${job.title}"` : "Talent Preferences"}</b>
          {criteria.length > 0 && <> — skill: {criteria.slice(0, 6).join(", ")}</>}
          {job && strArr(job.majors).length > 0 && <> · jurusan: {strArr(job.majors).join(", ")}</>}. Bobot: Skill 40 · Jurusan 15 · Sertifikasi 15 · Pengalaman 15 · Lokasi 10 · Profil 5.
          {!job && !pref?.skills && (
            <>
              {" "}
              <Link href="/company/preferences" className="font-semibold underline">
                Atur preferensi
              </Link>{" "}
              untuk hasil lebih akurat.
            </>
          )}
        </p>
      </div>

      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ talent, match }) => (
            <MatchCard key={talent.id} t={talent} m={match} saved={saved.has(talent.id)} href={`/company/talent-match/${talent.slug}${sp.job ? `?job=${sp.job}` : ""}`} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Users} title="Tidak ada kandidat yang sesuai" description="Longgarkan filter atau turunkan minimal % match." />
        </Card>
      )}
      <Pagination page={page} totalPages={Math.ceil(scored.length / per)} makeHref={(p) => `/company/talent-match${qs(sp, { page: p })}`} />
    </>
  );
}
