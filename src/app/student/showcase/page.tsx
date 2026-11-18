import { Upload, Video } from "lucide-react";
import { listVideos } from "@/server/queries";
import { requireStudent } from "@/lib/session";
import { MAJORS } from "@/lib/constants";
import { qs } from "@/components/filters";
import { SHOWCASE_TABS } from "./tabs";
import { ButtonLink, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { ReelFeed, ReelFilter } from "@/components/reel/reel-slide";
import { StudentReelSlide } from "./slide";

export default async function StudentShowcase({ searchParams }: { searchParams: Promise<{ q?: string; major?: string; page?: string }> }) {
  const sp = await searchParams;
  const { student } = await requireStudent();
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, totalPages } = await listVideos(sp, page, 12);
  return (
    <>
      <div className="reel-snap" style={{ ["--reel-top" as string]: "88px" }}>
        <PageHeader
          title="Video Talent Showcase"
          description="Scroll untuk melihat bagaimana talenta lain menunjukkan skill mereka, lalu buat showcase-mu sendiri."
          action={
            <ButtonLink href="/student/showcase/upload">
              <Upload className="h-4 w-4" /> Upload Video
            </ButtonLink>
          }
        />
        <Tabs tabs={SHOWCASE_TABS} active="/student/showcase" />
        <div className="max-w-2xl">
          <ReelFilter action="/student/showcase" q={sp.q} placeholder="Cari video…" select={{ name: "major", label: "Semua jurusan", value: sp.major, options: MAJORS }} />
        </div>
      </div>
      {rows.length ? (
        <ReelFeed top={64} prevHref={page > 1 ? `/student/showcase${qs(sp, { page: page - 1 })}` : undefined} nextHref={page < totalPages ? `/student/showcase${qs(sp, { page: page + 1 })}` : undefined}>
          {rows.map((v, i) => (
            <StudentReelSlide key={v.id} v={v} first={i === 0} studentId={student.id} />
          ))}
        </ReelFeed>
      ) : (
        <Card>
          <EmptyState icon={Video} title="Belum ada video" />
        </Card>
      )}
    </>
  );
}
