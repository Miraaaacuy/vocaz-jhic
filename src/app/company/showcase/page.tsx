import { ShowcaseFeed } from "./feed";

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; skill?: string }> }) {
  const sp = await searchParams;
  return <ShowcaseFeed page={Math.max(1, Number(sp.page) || 1)} skill={sp.skill} />;
}
