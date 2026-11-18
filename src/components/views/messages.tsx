import Link from "@/components/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/constants";
import { Avatar, Card, EmptyState, PageHeader } from "../ui";
import { ChatThread } from "./chat-thread";
import { cn, timeAgo } from "@/lib/utils";

/** Two-pane messaging UI shared by every role */
export async function MessagesView({ userId, basePath, activeId, emptyHint }: { userId: string; basePath: string; activeId?: string; emptyHint?: string }) {
  const parts = await db.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: {
            where: { userId: { not: userId } },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  role: true,
                  student: { select: { slug: true, headline: true } },
                  companyMember: { select: { company: { select: { name: true, logoUrl: true } } } },
                },
              },
            },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  });

  const convs = await Promise.all(
    parts.map(async (p) => {
      const other = p.conversation.participants[0]?.user;
      const unread = await db.message.count({
        where: { conversationId: p.conversationId, senderId: { not: userId }, ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}) },
      });
      return { id: p.conversationId, other, last: p.conversation.messages[0], unread, at: p.conversation.lastMessageAt };
    }),
  );

  const active = convs.find((c) => c.id === activeId);
  let initial: { id: string; body: string; senderId: string; createdAt: string }[] = [];
  if (active) {
    const msgs = await db.message.findMany({ where: { conversationId: active.id }, orderBy: { createdAt: "asc" }, take: 300 });
    initial = msgs.map((m) => ({ id: m.id, body: m.body, senderId: m.senderId, createdAt: m.createdAt.toISOString() }));
    await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: active.id, userId } }, data: { lastReadAt: new Date() } });
    await db.notification.updateMany({ where: { userId, link: { contains: active.id }, readAt: null }, data: { readAt: new Date() } });
  }

  const label = (o: (typeof convs)[number]["other"]) =>
    !o ? "Pengguna" : o.companyMember ? `${o.name} · ${o.companyMember.company.name}` : o.student?.headline ? `${o.name}` : o.name;
  const sub = (o: (typeof convs)[number]["other"]) =>
    !o ? "" : o.companyMember ? `Recruiter · ${o.companyMember.company.name}` : o.student ? (o.student.headline ?? "Talenta SMK") : ROLE_LABEL[o.role];

  return (
    <>
      <PageHeader title="Messages" description="Percakapan antara talenta dan recruiter." />
      <Card className="flex h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden">
        <aside className={cn("w-full shrink-0 flex-col border-r border-line md:flex md:w-80", active ? "hidden" : "flex")}>
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Percakapan ({convs.length})</div>
          <ul className="flex-1 overflow-y-auto">
            {convs.map((c) => (
              <li key={c.id}>
                <Link href={`${basePath}?c=${c.id}`} className={cn("flex gap-3 border-b border-line/60 px-4 py-3 transition hover:bg-subtle", c.id === activeId && "bg-brand-50/70")}>
                  <Avatar src={c.other?.companyMember?.company.logoUrl ?? c.other?.avatarUrl} name={c.other?.companyMember?.company.name ?? c.other?.name ?? "?"} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", c.unread ? "font-bold text-ink" : "font-semibold text-ink")}>{label(c.other)}</p>
                      <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-xs", c.unread ? "font-medium text-body" : "text-muted")}>
                        {c.last ? (c.last.senderId === userId ? "Anda: " : "") + c.last.body : "Belum ada pesan"}
                      </p>
                      {c.unread > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {convs.length === 0 && <EmptyState icon={MessageSquare} title="Belum ada percakapan" description={emptyHint} />}
          </ul>
        </aside>
        <section className={cn("min-w-0 flex-1 flex-col", active ? "flex" : "hidden md:flex")}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <Link href={basePath} className="rounded-lg p-1 text-muted hover:bg-subtle md:hidden" aria-label="Kembali">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <Avatar src={active.other?.avatarUrl} name={active.other?.name ?? "?"} size={38} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{active.other?.name}</p>
                  <p className="truncate text-xs text-muted">{sub(active.other)}</p>
                </div>
              </div>
              <ChatThread key={active.id} conversationId={active.id} me={userId} initial={initial} />
            </>
          ) : (
            <EmptyState icon={MessageSquare} title="Pilih percakapan" description="Pilih percakapan di sebelah kiri untuk mulai mengobrol." className="m-auto" />
          )}
        </section>
      </Card>
    </>
  );
}
