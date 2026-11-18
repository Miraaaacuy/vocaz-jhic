import { notFound } from "next/navigation";
import { getVideo } from "@/server/queries";
import { ShowcaseFeed } from "../feed";

/** Deep link to one video: the same feed, starting with that video */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getVideo(id))) notFound();
  return <ShowcaseFeed videoId={id} />;
}
