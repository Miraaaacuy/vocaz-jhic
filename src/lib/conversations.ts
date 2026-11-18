import "server-only";
import { db } from "./db";

export async function findOrCreateConversation(a: string, b: string, subject?: string) {
  const existing = await db.conversation.findFirst({
    where: { AND: [{ participants: { some: { userId: a } } }, { participants: { some: { userId: b } } }] },
  });
  if (existing) return existing;
  return db.conversation.create({ data: { subject, participants: { create: [{ userId: a }, { userId: b }] } } });
}
