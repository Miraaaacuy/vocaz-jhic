import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Polling endpoint for a conversation thread
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const part = await db.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId: id, userId: session.user.id } } });
  if (!part) return NextResponse.json({ error: "not found" }, { status: 404 });

  const after = new URL(req.url).searchParams.get("after");
  const messages = await db.message.findMany({
    where: { conversationId: id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, body: true, senderId: true, createdAt: true },
  });
  if (messages.length) {
    await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: session.user.id } }, data: { lastReadAt: new Date() } });
  }
  return NextResponse.json({ messages });
}
