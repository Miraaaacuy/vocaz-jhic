"use client";

import { MessageSquare } from "lucide-react";
import { startConversation } from "@/server/common-actions";
import { Modal } from "./forms";
import { Button, Field, Textarea } from "./ui";

/** "Contact Talent" → opens modal with first message → Messages */
export function ContactButton({ userId, name, subject, size = "sm", full }: { userId: string; name: string; subject?: string; size?: "sm" | "md" | "lg"; full?: boolean }) {
  return (
    <Modal
      title={`Hubungi ${name}`}
      description="Pesan akan dikirim ke kotak masuk talent di VocAZ."
      trigger={
        <Button size={size} className={full ? "w-full" : undefined}>
          <MessageSquare className="h-4 w-4" /> Message
        </Button>
      }
    >
      {() => (
        <form action={startConversation} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="subject" value={subject ?? ""} />
          <Field label="Pesan pertama">
            <Textarea
              name="message"
              rows={5}
              required
              defaultValue={`Halo ${name.split(" ")[0]}, kami tertarik dengan profil dan kemampuanmu${subject ? ` untuk posisi ${subject}` : ""}. Apakah kamu bersedia berdiskusi lebih lanjut?`}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit">
              <MessageSquare className="h-4 w-4" /> Kirim & buka percakapan
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
