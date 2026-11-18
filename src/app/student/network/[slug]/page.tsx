import { notFound, redirect } from "next/navigation";
import { Check, Clock, MessageSquare, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { getTalent } from "@/server/queries";
import { connect } from "@/server/student-actions";
import { startConversation } from "@/server/common-actions";
import { TalentProfileView } from "@/components/views/talent-profile";
import { ActionButton } from "@/components/forms";
import { Button } from "@/components/ui";
import { ReportButton } from "@/components/report-button";

export default async function NetworkProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, student } = await requireStudent();
  if (slug === student.slug) redirect("/student/profile/preview");
  const t = await getTalent(slug);
  if (!t) notFound();
  const conn = await db.connection.findFirst({
    where: { OR: [{ requesterId: user.id, addresseeId: t.userId }, { requesterId: t.userId, addresseeId: user.id }] },
  });
  const connected = conn?.status === "ACCEPTED";
  const incoming = conn && conn.status === "PENDING" && conn.addresseeId === user.id;

  return (
    <TalentProfileView
      t={t}
      mode="full"
      videoHref={(id) => `/student/showcase/watch/${id}`}
      actions={
        <>
          {connected ? (
            <>
              <Button variant="secondary" size="sm" disabled>
                <Check className="h-4 w-4" /> Terhubung
              </Button>
              <form action={startConversation}>
                <input type="hidden" name="userId" value={t.userId} />
                <Button size="sm">
                  <MessageSquare className="h-4 w-4" /> Kirim pesan
                </Button>
              </form>
            </>
          ) : conn && !incoming ? (
            <Button variant="secondary" size="sm" disabled>
              <Clock className="h-4 w-4" /> Menunggu konfirmasi
            </Button>
          ) : (
            <ActionButton action={connect} data={{ userId: t.userId }} size="sm">
              <UserPlus className="h-4 w-4" /> {incoming ? "Terima koneksi" : "Connect"}
            </ActionButton>
          )}
          <ReportButton type="PROFILE" id={t.id} label={t.user.name} compact />
        </>
      }
    />
  );
}
