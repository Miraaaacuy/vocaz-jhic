"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/server/common-actions";
import { cn } from "@/lib/utils";

type Msg = { id: string; body: string; senderId: string; createdAt: string };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export function ChatThread({ conversationId, me, initial }: { conversationId: string; me: string; initial: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const last = useRef(initial.at(-1)?.createdAt);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/messages/${conversationId}${last.current ? `?after=${encodeURIComponent(last.current)}` : ""}`, { cache: "no-store" });
        if (r.ok) {
          const { messages } = (await r.json()) as { messages: Msg[] };
          if (messages.length && !stop) {
            last.current = messages.at(-1)!.createdAt;
            setMsgs((prev) => {
              const seen = new Set(prev.map((m) => m.id));
              return [...prev.filter((m) => !m.id.startsWith("tmp-")), ...messages.filter((m) => !seen.has(m.id))];
            });
          }
        }
      } catch {
        /* offline — retry next tick */
      }
    };
    const t = setInterval(poll, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [conversationId]);

  const send = () => {
    const body = text.trim();
    if (!body) return;
    const tmp: Msg = { id: `tmp-${Date.now()}`, body, senderId: me, createdAt: new Date().toISOString() };
    setMsgs((m) => [...m, tmp]);
    setText("");
    start(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversationId);
      fd.set("body", body);
      const res = await sendMessage(null, fd);
      if (res && !res.ok) {
        toast.error(res.error ?? "Gagal mengirim pesan");
        setMsgs((m) => m.filter((x) => x.id !== tmp.id));
        return;
      }
      // fetch immediately to replace optimistic message
      const r = await fetch(`/api/messages/${conversationId}${last.current ? `?after=${encodeURIComponent(last.current)}` : ""}`, { cache: "no-store" });
      if (r.ok) {
        const { messages } = (await r.json()) as { messages: Msg[] };
        if (messages.length) last.current = messages.at(-1)!.createdAt;
        setMsgs((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev.filter((m) => !m.id.startsWith("tmp-")), ...messages.filter((m) => !seen.has(m.id))];
        });
      }
    });
  };

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto bg-canvas px-4 py-5 sm:px-6">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted">Belum ada pesan. Mulai percakapan 👋</p>}
        {msgs.map((m) => {
          const mine = m.senderId === me;
          const day = fmtDay(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[11px] font-semibold text-muted uppercase">{day}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-line bg-surface text-ink",
                    m.id.startsWith("tmp-") && "opacity-70",
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{m.body}</p>
                  <p className={cn("mt-1 text-right text-[10px]", mine ? "text-white/70" : "text-muted")}>{fmtTime(m.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form
        data-chat-composer
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-line bg-surface p-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Tulis pesan… (Enter untuk kirim)"
          className="field max-h-32 min-h-[44px] flex-1 resize-none"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
          aria-label="Kirim"
        >
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
