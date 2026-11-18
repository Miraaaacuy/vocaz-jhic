import Link from "@/components/link";
import { Eye, Trash2, Upload, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { deleteItem } from "@/server/student-actions";
import { ActionButton } from "@/components/forms";
import { VideoThumb } from "@/components/cards";
import { Badge, ButtonLink, Card, Chip, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { strArr, timeAgo } from "@/lib/utils";
import { SHOWCASE_TABS } from "../tabs";

export default async function MyShowcase({ searchParams }: { searchParams: Promise<{ uploaded?: string }> }) {
  const { uploaded } = await searchParams;
  const { student } = await requireStudent();
  const videos = await db.showcaseVideo.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" } });
  const total = videos.reduce((a, v) => a + v.views, 0);
  return (
    <>
      <PageHeader
        title="Video Talent Showcase"
        description={`${videos.length} video · ${total.toLocaleString("id-ID")} total tayangan. Video ini tampil di profilmu.`}
        action={
          <ButtonLink href="/student/showcase/upload">
            <Upload className="h-4 w-4" /> Upload Video
          </ButtonLink>
        }
      />
      <Tabs tabs={SHOWCASE_TABS} active="/student/showcase/mine" />
      {uploaded && <Card className="mb-5 border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">🎉 Video berhasil diunggah dan sudah tampil di profilmu!</Card>}
      {videos.length === 0 ? (
        <Card>
          <EmptyState icon={Video} title="Belum ada video showcase" description="Rekam dirimu saat mempraktikkan skill (30 detik – 3 menit) dan unggah di sini." action={<ButtonLink href="/student/showcase/upload">Upload video pertama</ButtonLink>} />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Card key={v.id} className={`overflow-hidden ${v.id === uploaded ? "ring-2 ring-emerald-400" : ""}`}>
              <Link href={`/student/showcase/watch/${v.id}`} className="block bg-ink">
                <VideoThumb thumbnailUrl={v.thumbnailUrl} videoUrl={v.videoUrl} alt={v.title} className="aspect-video w-full object-cover" />
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{v.title}</p>
                  {v.status === "HIDDEN" && <Badge tone="danger">Disembunyikan</Badge>}
                </div>
                <p className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {v.views.toLocaleString("id-ID")}
                  </span>
                  {timeAgo(v.createdAt)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {strArr(v.skills).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
                {v.status === "HIDDEN" && <p className="mt-2 text-xs text-red-700">Video ini disembunyikan oleh moderator karena melanggar pedoman komunitas.</p>}
                <div className="mt-3 flex justify-end">
                  <ActionButton action={deleteItem} data={{ kind: "video", id: v.id }} confirm="Hapus video ini?" variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" /> Hapus
                  </ActionButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
