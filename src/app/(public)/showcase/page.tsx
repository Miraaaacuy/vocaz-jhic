import type { Metadata } from "next";
import { Video } from "lucide-react";
import { listVideos } from "@/server/queries";
import { MAJORS } from "@/lib/constants";
import { qs } from "@/components/filters";
import { Card, EmptyState } from "@/components/ui";
import { ReelFeed, ReelFilter } from "@/components/reel/reel-slide";
import { PublicReelSlide } from "./slide";

export const metadata: Metadata = { title: "Video Talent Showcase" };

export default async function ShowcasePage({ searchParams }: { searchParams: Promise<{ q?: string; major?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, totalPages } = await listVideos(sp, page, 12);
  return (
    <div className="container-page">
      {/* compact header instead of a tall banner: the first video should be on screen right away */}
      <div className="reel-snap pt-4 sm:pt-6" style={{ ["--reel-top" as string]: "76px" }}>
        <h1 className="text-xl leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">Lihat skill-nya, bukan cuma CV-nya</h1>
        <p className="mt-1 hidden text-muted sm:block">{total} video kemampuan nyata dari siswa SMK. Scroll untuk pindah ke video berikutnya.</p>
        <div className="mt-3 max-w-2xl">
          <ReelFilter action="/showcase" q={sp.q} placeholder="Cari judul video atau nama talenta…" select={{ name: "major", label: "Semua jurusan", value: sp.major, options: MAJORS }} />
        </div>
      </div>
      {rows.length ? (
        <ReelFeed top={76} prevHref={page > 1 ? `/showcase${qs(sp, { page: page - 1 })}` : undefined} nextHref={page < totalPages ? `/showcase${qs(sp, { page: page + 1 })}` : undefined}>
          {rows.map((v, i) => (
            <PublicReelSlide key={v.id} v={v} first={i === 0} />
          ))}
        </ReelFeed>
      ) : (
        <Card className="mb-14">
          <EmptyState icon={Video} title="Belum ada video" description="Coba kata kunci lain." />
        </Card>
      )}
    </div>
  );
}
