import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { listCompanies, platformStats } from "@/server/queries";
import { CITIES, INDUSTRIES } from "@/lib/constants";
import { FilterBar, qs } from "@/components/filters";
import { CompanyCard } from "@/components/cards";
import { Card, EmptyState, Pagination } from "@/components/ui";
import { PublicHero } from "@/components/public-hero";

export const metadata: Metadata = { title: "Perusahaan" };

type SP = { q?: string; industry?: string; city?: string; verified?: string; page?: string };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total, totalPages }, stats] = await Promise.all([listCompanies(sp, page), platformStats()]);
  return (
    <>
      <PublicHero icon={Building2} eyebrow="Perusahaan" title="Perusahaan yang merekrut talenta vokasi" description={`${total} perusahaan — lencana Verified Company berarti dokumen legalnya sudah ditinjau tim VocAZ.`} stats={[{ label: "Perusahaan", value: stats.companies }, { label: "Lowongan aktif", value: stats.jobs }]} />
      <div className="container-page pb-14">
      <FilterBar
        floating
        action="/perusahaan"
        q={sp.q}
        qPlaceholder="Cari nama perusahaan…"
        values={sp}
        fields={[
          { type: "select", name: "industry", placeholder: "Semua industri", options: INDUSTRIES },
          { type: "select", name: "city", placeholder: "Semua kota", options: Object.keys(CITIES).sort() },
          { type: "checkbox", name: "verified", label: "Verified saja" },
        ]}
      />
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <CompanyCard key={c.id} c={c} href={`/perusahaan/${c.slug}`} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Building2} title="Perusahaan tidak ditemukan" />
        </Card>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={(p) => `/perusahaan${qs(sp, { page: p })}`} />
      </div>
    </>
  );
}
