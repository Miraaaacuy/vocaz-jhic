import Link from "@/components/link";
import { notFound } from "next/navigation";
import { Ban, CheckCircle2, EyeOff, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { resolveReport } from "@/server/admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, CardHeader, DescList, Field, PageHeader, Textarea } from "@/components/ui";
import { fmtDate, strArr } from "@/lib/utils";

async function loadContent(type: string, id: string) {
  switch (type) {
    case "VIDEO": {
      const v = await db.showcaseVideo.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
      return v && { hidden: v.status === "HIDDEN", owner: v.student.user, ownerHref: `/admin/users/${v.student.userId}`, body: (
        <div className="space-y-3">
          <video src={v.videoUrl} controls className="max-h-[420px] w-full rounded-xl bg-black" />
          <p className="font-semibold text-ink">{v.title}</p>
          <p className="text-sm text-body">{v.description}</p>
          <p className="text-xs text-muted">Skill: {strArr(v.skills).join(", ")} · {v.views} tayangan</p>
        </div>
      ) };
    }
    case "PORTFOLIO": {
      const p = await db.portfolioItem.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
      return p && { hidden: p.status === "HIDDEN", owner: p.student.user, ownerHref: `/admin/users/${p.student.userId}`, body: (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.imageUrl && <img src={p.imageUrl} alt="" className="max-h-80 rounded-xl" />}
          <p className="font-semibold text-ink">{p.title}</p>
          <p className="text-sm text-body">{p.description}</p>
        </div>
      ) };
    }
    case "PROFILE": {
      const s = await db.studentProfile.findUnique({ where: { id }, include: { user: true } });
      return s && { hidden: s.hidden, owner: s.user, ownerHref: `/admin/users/${s.userId}`, body: (
        <div className="space-y-2">
          <p className="font-semibold text-ink">{s.user.name} — {s.headline}</p>
          <p className="text-sm whitespace-pre-line text-body">{s.bio}</p>
          <Link href={`/talenta/${s.slug}`} target="_blank" className="text-sm font-semibold text-brand-600 hover:underline">Buka profil →</Link>
        </div>
      ) };
    }
    case "COMPANY": {
      const c = await db.company.findUnique({ where: { id }, include: { members: { where: { role: "OWNER" }, include: { user: true } } } });
      return c && { hidden: c.hidden, owner: c.members[0]?.user, ownerHref: c.members[0] ? `/admin/users/${c.members[0].userId}` : "#", body: (
        <div className="space-y-2">
          <p className="font-semibold text-ink">{c.name}</p>
          <p className="text-sm text-body">{c.description}</p>
          <Link href={`/admin/company-verification/${c.id}`} className="text-sm font-semibold text-brand-600 hover:underline">Lihat detail perusahaan →</Link>
        </div>
      ) };
    }
    case "JOB": {
      const j = await db.job.findUnique({ where: { id }, include: { company: { include: { members: { where: { role: "OWNER" }, include: { user: true } } } } } });
      return j && { hidden: j.status === "CLOSED", owner: j.company.members[0]?.user, ownerHref: "#", body: (
        <div className="space-y-2">
          <p className="font-semibold text-ink">{j.title} — {j.company.name}</p>
          <p className="text-sm whitespace-pre-line text-body">{j.description}</p>
        </div>
      ) };
    }
  }
  return null;
}

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const r = await db.report.findUnique({ where: { id }, include: { reporter: true, resolvedBy: { select: { name: true } } } });
  if (!r) notFound();
  const content = await loadContent(r.targetType, r.targetId);
  return (
    <>
      <PageHeader back={{ href: "/admin/moderation", label: "Moderasi Konten" }} title="Content Detail" description={r.targetLabel ?? undefined} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Konten yang dilaporkan" action={content && <Badge tone={content.hidden ? "danger" : "success"}>{content.hidden ? "Disembunyikan" : "Tayang"}</Badge>} />
          <div className="p-5">
            {content ? content.body : <p className="text-sm text-muted">Konten sudah dihapus pemiliknya.</p>}
            {content?.owner && (
              <Link href={content.ownerHref} className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
                <Avatar src={content.owner.avatarUrl} name={content.owner.name} size={36} />
                <div>
                  <p className="text-sm font-semibold text-ink">{content.owner.name}</p>
                  <p className="text-xs text-muted">
                    Pemilik konten · {content.owner.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Laporan" />
            <div className="p-5">
              <DescList
                items={[
                  { label: "Alasan", value: r.reason },
                  { label: "Pelapor", value: r.reporter?.name },
                  { label: "Tanggal", value: fmtDate(r.createdAt, "d MMM yyyy HH:mm") },
                  { label: "Status", value: r.status },
                ]}
              />
              {r.details && <p className="mt-4 rounded-lg bg-subtle px-3 py-2 text-sm text-body">{r.details}</p>}
              {r.action && (
                <p className="mt-3 text-sm text-body">
                  <b>Tindakan:</b> {r.action} {r.resolvedBy && `— ${r.resolvedBy.name}`}
                </p>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <p className="mb-3 font-semibold text-ink">{r.status === "OPEN" ? "Ambil tindakan" : "Ubah tindakan"}</p>
            <ActionForm action={resolveReport} className="space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <Field label="Catatan moderator">
                <Textarea name="note" rows={2} />
              </Field>
              <div className="grid gap-2">
                {content?.hidden ? (
                  <SubmitButton name="action" value="restore" variant="secondary">
                    <RotateCcw className="h-4 w-4" /> Pulihkan konten
                  </SubmitButton>
                ) : (
                  <SubmitButton name="action" value="hide" variant="danger">
                    <EyeOff className="h-4 w-4" /> Sembunyikan konten
                  </SubmitButton>
                )}
                <SubmitButton name="action" value="suspend" variant="dark">
                  <Ban className="h-4 w-4" /> Sembunyikan & tangguhkan akun
                </SubmitButton>
                <SubmitButton name="action" value="dismiss" variant="secondary">
                  <CheckCircle2 className="h-4 w-4" /> Tidak melanggar (abaikan)
                </SubmitButton>
              </div>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
