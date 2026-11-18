import Link from "@/components/link";
import { Bookmark, BookmarkCheck, CheckCircle2, Filter, Share2, Sparkles, Video, XCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { preferenceRequirement, scoreTalents, talentInclude } from "@/lib/match-data";
import { videoInclude } from "@/server/queries";
import { toggleSaveTalent } from "@/server/company-actions";
import { ActionButton, CopyLinkButton } from "@/components/forms";
import { ContactButton } from "@/components/contact-button";
import { Avatar, Card, Chip, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { MatchBadge } from "@/components/badges";
import { ReelFeed, ReelSlide } from "@/components/reel/reel-slide";

const PAGE_SIZE = 12;

/** TikTok-style showcase feed with a Smart Match panel per video (Figma: Smart Talent Match – Talent Feed) */
export async function ShowcaseFeed({ page = 1, skill, videoId }: { page?: number; skill?: string; videoId?: string }) {
  const { company } = await requireCompany();
  const where: Prisma.ShowcaseVideoWhereInput = {
    status: "PUBLISHED",
    student: { hidden: false, ...(skill ? { skills: { some: { skill: { name: { contains: skill } } } } } : {}) },
  };
  const [total, list, first, pref] = await Promise.all([
    db.showcaseVideo.count({ where }),
    db.showcaseVideo.findMany({
      where: videoId ? { ...where, id: { not: videoId } } : where,
      include: videoInclude,
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: videoId ? PAGE_SIZE - 1 : PAGE_SIZE,
    }),
    // deep link (/company/showcase/[id]): that video leads the feed
    videoId ? db.showcaseVideo.findFirst({ where: { id: videoId, status: "PUBLISHED" }, include: videoInclude }) : null,
    db.talentPreference.findUnique({ where: { companyId: company.id } }),
  ]);
  const videos = first ? [first, ...list] : list;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const href = (p: number) => `/company/showcase?page=${p}${skill ? `&skill=${encodeURIComponent(skill)}` : ""}`;

  const head = (
    <div className="reel-snap" style={{ ["--reel-top" as string]: "88px" }}>
      <PageHeader title="Video Talent Showcase" description="Scroll untuk melihat kemampuan nyata talenta, lengkap dengan skor kecocokan terhadap kebutuhan Anda." />
      <Tabs
        active="/company/showcase"
        tabs={[
          { href: "/company/talent-match", label: "Smart Talent Search" },
          { href: "/company/showcase", label: "Video Talent Showcase" },
          { href: "/company/talent-match/saved", label: "Talent Tersimpan" },
        ]}
      />
      <form action="/company/showcase" className="mb-6 max-w-md">
        <div className="relative">
          <Filter className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="skill" aria-label="Filter berdasarkan skill" defaultValue={skill} placeholder="Filter by Skills…" className="field h-11 rounded-full! pl-10" />
        </div>
      </form>
    </div>
  );

  if (!videos.length) {
    return (
      <>
        {head}
        <Card>
          <EmptyState icon={Video} title="Belum ada video" description={skill ? "Tidak ada video untuk skill itu. Coba kata kunci lain." : undefined} />
        </Card>
      </>
    );
  }

  // score every talent in the feed once (not one query per video)
  const ids = [...new Set(videos.map((v) => v.student.id))];
  const [students, savedRows] = await Promise.all([
    db.studentProfile.findMany({ where: { id: { in: ids } }, include: talentInclude }),
    db.savedTalent.findMany({ where: { companyId: company.id, studentId: { in: ids } }, select: { studentId: true } }),
  ]);
  const matches = new Map((await scoreTalents(students, preferenceRequirement(pref))).map((x) => [x.talent.id, x.match]));
  const saved = new Set(savedRows.map((r) => r.studentId));

  return (
    <>
      {head}
      <ReelFeed top={64} prevHref={!videoId && page > 1 ? href(page - 1) : undefined} nextHref={videoId ? "/company/showcase" : page < totalPages ? href(page + 1) : undefined}>
        {videos.map((v, i) => {
          const s = v.student;
          const match = matches.get(s.id);
          const profileHref = `/company/talent-match/${s.slug}`;
          return (
            <ReelSlide
              key={v.id}
              v={v}
              first={i === 0}
              profileHref={profileHref}
              badge={match && <MatchBadge score={match.score} />}
              info={
                <>
                  <div className="flex items-center gap-3">
                    <Avatar src={s.user.avatarUrl} name={s.user.name} size={52} />
                    <div className="min-w-0">
                      <Link href={profileHref} className="block truncate text-lg font-bold text-ink hover:text-brand-700">
                        {s.user.name}
                      </Link>
                      <p className="truncate text-sm text-muted">{s.headline ?? s.major}</p>
                    </div>
                  </div>
                  <h2 className="mt-4 text-base leading-snug font-bold text-ink">{v.title}</h2>
                  {match && (
                    <div className="mt-4 rounded-2xl bg-brand-50/70 p-4 ring-1 ring-brand-100">
                      <p className="flex items-center gap-2 font-bold text-brand-800">
                        <Sparkles className="h-4 w-4" /> Mengapa kandidat ini sesuai
                      </p>
                      <ul className="mt-2.5 space-y-1.5">
                        {match.reasons.slice(0, 5).map((r, k) => (
                          <li key={k} className="flex items-start gap-1.5 text-sm">
                            {r.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />}
                            <span className={r.ok ? "text-body" : "text-muted"}>{r.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.skills.map((k) => (
                      <Chip key={k.skillId} className={match?.matchedSkills.includes(k.skill.name) ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : ""}>
                        {k.skill.name}
                      </Chip>
                    ))}
                  </div>
                  <Link href={profileHref} className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
                    Lihat profil lengkap →
                  </Link>
                </>
              }
              actions={
                <>
                  <ActionButton action={toggleSaveTalent} data={{ studentId: s.id }} variant="white" size="md" className="ring-1 ring-line">
                    {saved.has(s.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />} {saved.has(s.id) ? "Saved" : "Save"}
                  </ActionButton>
                  <ContactButton userId={s.user.id} name={s.user.name} size="md" full />
                  <CopyLinkButton path={`/talenta/${s.slug}`}>
                    <Share2 className="h-4 w-4" /> Share
                  </CopyLinkButton>
                </>
              }
            />
          );
        })}
      </ReelFeed>
    </>
  );
}
