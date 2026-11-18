import { requireStudent } from "@/lib/session";
import { MessagesView } from "@/components/views/messages";

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const { user } = await requireStudent();
  return <MessagesView userId={user.id} basePath="/student/messages" activeId={c} emptyHint="Belum ada percakapan. Recruiter yang tertarik dengan profilmu akan menghubungi lewat sini." />;
}
