import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getVideo, listVideos } from "@/server/queries";
import { ReelFeed } from "@/components/reel/reel-slide";
import { PublicReelSlide } from "../slide";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = await getVideo((await params).id);
  return { title: v ? `${v.title} · Video Showcase` : "Video Talent Showcase" };
}

/** Deep link to one video: the same feed, starting with that video */
export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.user.role === "COMPANY") redirect(`/company/showcase/${id}`);
  if (session?.user.role === "STUDENT") redirect(`/student/showcase/watch/${id}`);
  const v = await getVideo(id);
  if (!v) notFound();
  const { rows: more } = await listVideos({ excludeId: v.id }, 1, 11);
  return (
    <div className="container-page">
      <h1 className="sr-only">{v.title}</h1>
      <ReelFeed top={76} nextHref="/showcase">
        {[v, ...more].map((x, i) => (
          <PublicReelSlide key={x.id} v={x} first={i === 0} />
        ))}
      </ReelFeed>
    </div>
  );
}
