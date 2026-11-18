import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/session";
import { getVideo, listVideos } from "@/server/queries";
import { ReelFeed } from "@/components/reel/reel-slide";
import { StudentReelSlide } from "../../slide";

/** Deep link to one video: the same feed, starting with that video */
export default async function StudentWatch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { student } = await requireStudent();
  const v = await getVideo(id);
  if (!v) notFound();
  const { rows: more } = await listVideos({ excludeId: v.id }, 1, 11);
  return (
    <>
      <h1 className="sr-only">{v.title}</h1>
      <ReelFeed top={64} nextHref="/student/showcase">
        {[v, ...more].map((x, i) => (
          <StudentReelSlide key={x.id} v={x} first={i === 0} studentId={student.id} />
        ))}
      </ReelFeed>
    </>
  );
}
