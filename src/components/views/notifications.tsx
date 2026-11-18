import { Award, Bell, Briefcase, CheckCheck, MessageSquare, Sparkles, UserPlus, Info } from "lucide-react";
import { db } from "@/lib/db";
import { markAllNotificationsRead, openNotification } from "@/server/common-actions";
import { ActionButton } from "../forms";
import { Card, EmptyState, PageHeader } from "../ui";
import { cn, timeAgo } from "@/lib/utils";

const ICON: Record<string, typeof Bell> = {
  MESSAGE: MessageSquare,
  APPLICATION: Briefcase,
  VERIFICATION: Award,
  OPPORTUNITY: Sparkles,
  CONNECTION: UserPlus,
  SYSTEM: Info,
};
const TONE: Record<string, string> = {
  MESSAGE: "bg-sky-50 text-sky-600",
  APPLICATION: "bg-brand-50 text-brand-600",
  VERIFICATION: "bg-amber-50 text-amber-600",
  OPPORTUNITY: "bg-emerald-50 text-emerald-600",
  CONNECTION: "bg-violet-50 text-violet-600",
  SYSTEM: "bg-subtle text-body",
};

export async function NotificationsView({ userId }: { userId: string }) {
  const items = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <>
      <PageHeader
        title="Notifikasi"
        description={unread ? `${unread} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
        action={
          unread > 0 && (
            <ActionButton action={markAllNotificationsRead} variant="secondary">
              <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
            </ActionButton>
          )
        }
      />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="Belum ada notifikasi" />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => {
              const I = ICON[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <form action={openNotification}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className={cn("flex w-full gap-4 px-5 py-4 text-left transition hover:bg-subtle", !n.readAt && "bg-brand-50/40")}>
                      <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE[n.type] ?? TONE.SYSTEM)}>
                        <I className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm text-ink", !n.readAt ? "font-bold" : "font-medium")}>{n.title}</p>
                        {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                        <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.readAt && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
