import { Bookmark } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { preferenceRequirement, scoreTalents, talentInclude } from "@/lib/match-data";
import { ButtonLink, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { MatchCard } from "../match-card";

export default async function SavedTalents() {
  const { company } = await requireCompany();
  const [saved, pref] = await Promise.all([
    db.savedTalent.findMany({ where: { companyId: company.id }, include: { student: { include: talentInclude } }, orderBy: { createdAt: "desc" } }),
    db.talentPreference.findUnique({ where: { companyId: company.id } }),
  ]);
  const scored = await scoreTalents(saved.map((s) => s.student), preferenceRequirement(pref));
  return (
    <>
      <PageHeader title="Talent Tersimpan" description="Talent Pool — kandidat yang Anda simpan untuk ditindaklanjuti." />
      <Tabs
        active="/company/talent-match/saved"
        tabs={[
          { href: "/company/talent-match", label: "Smart Talent Search" },
          { href: "/company/showcase", label: "Video Talent Showcase" },
          { href: "/company/talent-match/saved", label: "Talent Tersimpan", count: saved.length },
        ]}
      />
      {scored.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {scored.map(({ talent, match }) => (
            <MatchCard key={talent.id} t={talent} m={match} saved href={`/company/talent-match/${talent.slug}`} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Bookmark} title="Belum ada talent tersimpan" action={<ButtonLink href="/company/talent-match">Cari talent</ButtonLink>} />
        </Card>
      )}
    </>
  );
}
