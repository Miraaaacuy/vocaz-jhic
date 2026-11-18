import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";

export async function unreadMessageCount(userId: string) {
  const parts = await db.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (!parts.length) return 0;
  const counts = await Promise.all(
    parts.map((p) =>
      db.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      }),
    ),
  );
  return counts.reduce((a, b) => a + b, 0);
}

export async function RoleLayout({
  role,
  userId,
  orgName,
  children,
}: {
  role: Role;
  userId: string;
  orgName?: string;
  children: React.ReactNode;
}) {
  const [user, unread, unreadMessages] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, avatarUrl: true, email: true } }),
    db.notification.count({ where: { userId, readAt: null } }),
    unreadMessageCount(userId),
  ]);

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <DashboardShell role={role} user={user} orgName={orgName} unread={unread} unreadMessages={unreadMessages} logout={logout}>
      {children}
    </DashboardShell>
  );
}
