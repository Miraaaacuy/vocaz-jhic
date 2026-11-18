import type { Metadata } from "next";
import { Users } from "lucide-react";
import { listTalents, platformStats } from "@/server/queries";
import { toTalentCard } from "@/lib/match-data";
import { CITIES, MAJORS } from "@/lib/constants";
import { FilterBar, qs } from "@/components/filters";
import { TalentCard } from "@/components/cards";
import { Card, EmptyState, Pagination } from "@/components/ui";
import { PublicHero } from "@/components/public-hero";

export const metadata: Metadata = { title: "Talenta SMK" };

type SP = { q?: string; major?: string; city?: string; cert?: string; video?: string; page?: string };

export default async function TalentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total, totalPages }, stats] = await Promise.all([listTalents(sp, page, { publicOnly: true }), platformStats()]);
  return (
    <>
      <PublicHero icon={Users} eyebrow="Direktori Talenta" title="Talenta SMK Terverifikasi" description={`Jelajahi ${total} talenta vokasi dengan skill, portfolio, dan sertifikasi yang diverifikasi sekolah & lembaga resmi.`} stats={[{ label: "Talenta", value: stats.students }, { label: "Sertifikat terverifikasi", value: stats.verifiedCerts }, { label: "Video showcase", value: stats.videos }]} />
      <div className="container-page pb-14">
      <FilterBar
        floating
        action="/talenta"
        q={sp.q}
        qPlaceholder="Cari nama, skill, atau posisi…"
        values={sp}
        fields={[
          { type: "select", name: "major", placeholder: "Semua jurusan", options: MAJORS },
          { type: "select", name: "city", placeholder: "Semua kota", options: Object.keys(CITIES).sort() },
          { type: "select", name: "cert", placeholder: "Sertifikasi", options: [{ value: "BNSP", label: "LSP – BNSP" }, { value: "INDUSTRY", label: "Industri" }] },
          { type: "checkbox", name: "video", label: "Punya video" },
        ]}
      />
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <TalentCard key={t.id} t={toTalentCard(t)} href={`/talenta/${t.slug}`} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Users} title="Talenta tidak ditemukan" description="Coba ubah kata kunci atau filter pencarian." />
        </Card>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={(p) => `/talenta${qs(sp, { page: p })}`} />
      </div>
    </>
  );
}
