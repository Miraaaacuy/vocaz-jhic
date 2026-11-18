import Link from "@/components/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye, MapPin, MessageSquare, Pencil, Users, XCircle, RotateCcw, CheckCircle2 } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { jobRequirement, scoreOne, talentInclude, toTalentCard } from "@/lib/match-data";
import { setJobStatus, updateApplication } from "@/server/company-actions";
import { startConversation } from "@/server/common-actions";
import { ActionButton, ActionForm, SubmitButton } from "@/components/forms";
import { MatchPanel } from "@/components/views/talent-profile";
import { MatchBadge, TalentBadges } from "@/components/badges";
import { Avatar, Badge, Button, ButtonLink, Card, Chip, EmptyState, Field, PageHeader, Select, Textarea } from "@/components/ui";
import { APP_STATUS_LABEL, APP_STATUS_TONE, JOB_STATUS_LABEL, JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { cn, fmtDate, timeAgo } from "@/lib/utils";

const STAGES: (ApplicationStatus | "ALL")[] = ["ALL", "APPLIED", "REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];

export default async function JobApplicants({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ app?: string; stage?: string; published?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { company } = await requireCompany();
  const job = await db.job.findFirst({ where: { id, companyId: company.id } });
  if (!job) notFound();
  const apps = await db.application.findMany({
    where: { jobId: id, status: { not: "WITHDRAWN" } },
    include: { student: { include: talentInclude } },
    orderBy: { createdAt: "desc" },
  });
  const req = jobRequirement(job);
  const scored = (await Promise.all(apps.map(async (a) => ({ a, m: await scoreOne(a.student, req) })))).sort((x, y) => y.m.score - x.m.score);
  const stage = (sp.stage ?? "ALL") as ApplicationStatus | "ALL";
  const list = stage === "ALL" ? scored : scored.filter((s) => s.a.status === stage);
  const selected = scored.find((s) => s.a.id === sp.app) ?? list[0];
  const count = (s: ApplicationStatus | "ALL") => (s === "ALL" ? scored.length : scored.filter((x) => x.a.status === s).length);
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { stage: sp.stage, app: sp.app, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && v !== "ALL" && p.set(k, v));
    return `/company/recruitment/${id}${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      {sp.published && (
        <Card className="mb-5 flex items-center gap-3 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> Lowongan berhasil dipublikasikan dan kini tampil di halaman Lowongan VocAZ.
        </Card>
      )}
      <PageHeader
        back={{ href: "/company/recruitment", label: "Rekrutmen" }}
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Badge tone={job.status === "ACTIVE" ? "success" : job.status === "DRAFT" ? "neutral" : "danger"}>{JOB_STATUS_LABEL[job.status]}</Badge>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {job.city} · {WORK_MODE_LABEL[job.workMode]}
            </span>
            <span>{JOB_TYPE_LABEL[job.type]}</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" /> {job.views} dilihat
            </span>
            <span>Batas {fmtDate(job.deadline)}</span>
          </span>
        }
        action={
          <>
            <ButtonLink href={`/lowongan/${job.id}`} variant="secondary" target="_blank">
              <ExternalLink className="h-4 w-4" /> Lihat publik
            </ButtonLink>
            <ButtonLink href={`/company/recruitment/${job.id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" /> Edit
            </ButtonLink>
            {job.status === "ACTIVE" ? (
              <ActionButton action={setJobStatus} data={{ id: job.id, status: "CLOSED" }} confirm="Tutup lowongan ini? Pelamar baru tidak dapat melamar." variant="danger">
                <XCircle className="h-4 w-4" /> Tutup
              </ActionButton>
            ) : (
              <ActionButton action={setJobStatus} data={{ id: job.id, status: "ACTIVE" }}>
                <RotateCcw className="h-4 w-4" /> {job.status === "DRAFT" ? "Publikasikan" : "Buka kembali"}
              </ActionButton>
            )}
          </>
        }
      />

      <div className="scrollbar-none -mx-1 mb-5 flex gap-2 overflow-x-auto px-1">
        {STAGES.map((s) => (
          <Link
            key={s}
            href={href({ stage: s, app: undefined })}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              stage === s ? "bg-ink text-white" : "bg-surface text-body ring-1 ring-line hover:bg-subtle",
            )}
          >
            {s === "ALL" ? "Semua" : APP_STATUS_LABEL[s]}
            <span className={cn("rounded-full px-1.5 text-xs", stage === s ? "bg-white/20" : "bg-subtle")}>{count(s)}</span>
          </Link>
        ))}
      </div>

      {scored.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Belum ada pelamar" description="Coba cari kandidat secara proaktif lewat Smart Talent Match." action={<ButtonLink href={`/company/talent-match?job=${job.id}`}>Cari talent yang cocok</ButtonLink>} />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="h-fit overflow-hidden">
            <div className="border-b border-line px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">Diurutkan berdasarkan % match</div>
            <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              {list.map(({ a, m }) => (
                <li key={a.id}>
                  <Link href={href({ app: a.id })} className={cn("flex items-center gap-3 px-4 py-3 transition hover:bg-subtle", selected?.a.id === a.id && "bg-brand-50/70")}>
                    <Avatar src={a.student.user.avatarUrl} name={a.student.user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{a.student.user.name}</p>
                      <p className="truncate text-xs text-muted">
                        {APP_STATUS_LABEL[a.status]} · {timeAgo(a.createdAt)}
                      </p>
                    </div>
                    <MatchBadge score={m.score} size="sm" />
                  </Link>
                </li>
              ))}
              {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Tidak ada pelamar di tahap ini.</li>}
            </ul>
          </Card>

          {selected && (
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Avatar src={selected.a.student.user.avatarUrl} name={selected.a.student.user.name} size={64} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-ink">{selected.a.student.user.name}</h2>
                      <Badge tone={APP_STATUS_TONE[selected.a.status]}>{APP_STATUS_LABEL[selected.a.status]}</Badge>
                    </div>
                    <p className="text-body">{selected.a.student.headline}</p>
                    <p className="text-sm text-muted">
                      {selected.a.student.major} · {selected.a.student.school?.name} · {selected.a.student.city}
                    </p>
                    <div className="mt-2">
                      <TalentBadges schoolVerified={selected.a.student.schoolVerified} certTypes={selected.a.student.certificates.map((c) => c.type)} small />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {toTalentCard(selected.a.student).skills.map((s) => (
                        <Chip key={s} className={selected.m.matchedSkills.includes(s) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <ButtonLink href={`/company/talent-match/${selected.a.student.slug}?job=${job.id}`} variant="secondary" size="sm">
                      Profil lengkap
                    </ButtonLink>
                    <form action={startConversation}>
                      <input type="hidden" name="userId" value={selected.a.student.userId} />
                      <input type="hidden" name="subject" value={job.title} />
                      <Button size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4" /> Pesan
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>

              <MatchPanel match={selected.m} />

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-5">
                  <h3 className="mb-2 font-semibold text-ink">Surat lamaran</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-body">{selected.a.coverLetter || "Tidak ada surat lamaran."}</p>
                  <p className="mt-3 text-xs text-muted">Dilamar {fmtDate(selected.a.createdAt, "d MMM yyyy, HH:mm")}</p>
                </Card>
                <Card className="p-5">
                  <h3 className="mb-3 font-semibold text-ink">Update status</h3>
                  <ActionForm action={updateApplication} className="space-y-3">
                    <input type="hidden" name="id" value={selected.a.id} />
                    <Field label="Tahap">
                      <Select
                        name="status"
                        defaultValue={selected.a.status}
                        options={(["APPLIED", "REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"] as ApplicationStatus[]).map((s) => ({ value: s, label: APP_STATUS_LABEL[s] }))}
                      />
                    </Field>
                    <Field label="Catatan untuk kandidat (opsional)">
                      <Textarea name="note" rows={3} defaultValue={selected.a.recruiterNote ?? ""} placeholder="cth. Jadwal interview Kamis 10.00 WIB via Google Meet" />
                    </Field>
                    <SubmitButton className="w-full">Simpan & kirim notifikasi</SubmitButton>
                  </ActionForm>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
