import Link from "@/components/link";
import { Bookmark, BookmarkCheck, CheckCircle2, MapPin, Play, XCircle } from "lucide-react";
import type { MatchResult } from "@/lib/match";
import type { TalentRow } from "@/lib/match-data";
import { toTalentCard } from "@/lib/match-data";
import { toggleSaveTalent } from "@/server/company-actions";
import { ActionButton } from "@/components/forms";
import { Avatar, Card, Chip, Progress } from "@/components/ui";
import { MatchBadge, TalentBadges } from "@/components/badges";

export function MatchCard({ t, m, saved, href }: { t: TalentRow; m: MatchResult; saved: boolean; href: string }) {
  const c = toTalentCard(t);
  return (
    <Card className="flex h-full flex-col p-5 transition hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start gap-3">
        <Link href={href}>
          <Avatar src={c.avatarUrl} name={c.name} size={52} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate font-semibold text-ink hover:text-brand-600">
            {c.name}
          </Link>
          <p className="truncate text-sm text-muted">{c.headline || c.major}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="h-3 w-3" /> {c.city} · {c.schoolName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MatchBadge score={m.score} />
          <span className="text-[11px] font-semibold text-muted">{m.label}</span>
        </div>
      </div>
      <Progress value={m.score} className="mt-4 h-1.5" />
      <div className="mt-3">
        <TalentBadges schoolVerified={c.schoolVerified} certTypes={c.certTypes} small />
      </div>
      <ul className="mt-3 space-y-1.5">
        {m.reasons.slice(0, 3).map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs">
            {r.ok ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <XCircle className="mt-px h-3.5 w-3.5 shrink-0 text-stone-400" />}
            <span className={r.ok ? "text-body" : "text-muted"}>{r.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.skills.slice(0, 5).map((s) => (
          <Chip key={s} className={m.matchedSkills.includes(s) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        {c.hasVideo ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
            <Play className="h-3.5 w-3.5" fill="currentColor" /> Punya video
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-1">
          <ActionButton action={toggleSaveTalent} data={{ studentId: t.id }} variant="ghost" size="sm" title="Simpan">
            {saved ? <BookmarkCheck className="h-4 w-4 text-brand-600" /> : <Bookmark className="h-4 w-4" />}
          </ActionButton>
          <Link href={href} className="inline-flex h-8 items-center rounded-lg bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100">
            Lihat profil
          </Link>
        </div>
      </div>
    </Card>
  );
}
