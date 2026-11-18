import { requireCompany } from "@/lib/session";
import { MessagesView } from "@/components/views/messages";

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const { user } = await requireCompany();
  return <MessagesView userId={user.id} basePath="/company/messages" activeId={c} emptyHint="Hubungi talent dari Smart Talent Match, Video Showcase, atau daftar pelamar." />;
}
