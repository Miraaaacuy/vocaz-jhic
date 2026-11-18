import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { listJobs, platformStats } from "@/server/queries";
import { CITIES, INDUSTRIES, JOB_TYPE_LABEL, MAJORS, WORK_MODE_LABEL } from "@/lib/constants";
import { FilterBar, qs } from "@/components/filters";
import { JobCard } from "@/components/cards";
import { Card, EmptyState, Pagination } from "@/components/ui";
import { PublicHero } from "@/components/public-hero";

export const metadata: Metadata = { title: "Lowongan" };

type SP = { q?: string; city?: string; type?: string; mode?: string; major?: string; industry?: string; page?: string };

export default async function JobsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total, totalPages }, stats] = await Promise.all([listJobs(sp, page), platformStats()]);
  return (
    <>
      <PublicHero icon={Briefcase} eyebrow="Lowongan" title="Peluang karier untuk lulusan SMK" description={`${total} lowongan kerja, magang, dan PKL dari perusahaan yang terverifikasi.`} stats={[{ label: "Lowongan aktif", value: stats.jobs }, { label: "Perusahaan", value: stats.companies }, { label: "Diterima kerja", value: stats.hired }]} />
      <div className="container-page pb-14">
      <FilterBar
        floating
        action="/lowongan"
        q={sp.q}
        qPlaceholder="Posisi, perusahaan, atau departemen…"
        values={sp}
        fields={[
          { type: "select", name: "city", placeholder: "Semua kota", options: Object.keys(CITIES).sort() },
          { type: "select", name: "type", placeholder: "Tipe pekerjaan", options: Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
          { type: "select", name: "mode", placeholder: "Mode kerja", options: Object.entries(WORK_MODE_LABEL).map(([value, label]) => ({ value, label })) },
          { type: "select", name: "major", placeholder: "Jurusan", options: MAJORS },
          { type: "select", name: "industry", placeholder: "Industri", options: INDUSTRIES },
        ]}
      />
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((j) => (
            <JobCard key={j.id} job={j} href={`/lowongan/${j.id}`} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Briefcase} title="Lowongan tidak ditemukan" description="Coba ubah kata kunci atau filter." />
        </Card>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={(p) => `/lowongan${qs(sp, { page: p })}`} />
      </div>
    </>
  );
}
