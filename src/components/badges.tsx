import { Award, BadgeCheck, GraduationCap, ShieldCheck, Zap } from "lucide-react";
import type { CompanyVerificationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function MatchBadge({ score, className, size = "md" }: { score: number; className?: string; size?: "sm" | "md" }) {
  const tone =
    score >= 80
      ? "bg-gradient-to-r from-accent-700 to-accent-600 text-white"
      : score >= 60
        ? "bg-gradient-to-r from-brand-700 to-brand-600 text-white"
        : score >= 40
          ? "bg-amber-100 text-amber-900"
          : "bg-stone-200 text-stone-700";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap shadow-sm",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        tone,
        className,
      )}
    >
      <Zap className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} fill="currentColor" />
      {score}% Match
    </span>
  );
}

export function SchoolVerifiedBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-sky-50 font-semibold text-sky-700 ring-1 ring-sky-200", small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs")}>
      <GraduationCap className="h-3 w-3" /> School Verified
    </span>
  );
}

export function BnspBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-50 font-semibold text-amber-700 ring-1 ring-amber-300", small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs")}>
      <Award className="h-3 w-3" /> LSP – BNSP Verified
    </span>
  );
}

export function IndustryBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200", small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs")}>
      <ShieldCheck className="h-3 w-3" /> Industry Certified
    </span>
  );
}

export function CompetencyBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200", small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs")}>
      <BadgeCheck className="h-3 w-3" /> Competency Verified
    </span>
  );
}

export function TalentBadges({
  schoolVerified,
  certTypes,
  competency,
  small,
}: {
  schoolVerified?: boolean;
  certTypes: string[];
  competency?: boolean;
  small?: boolean;
}) {
  const hasBnsp = certTypes.includes("BNSP");
  const hasIndustry = certTypes.includes("INDUSTRY");
  if (!schoolVerified && !hasBnsp && !hasIndustry && !competency) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {hasBnsp && <BnspBadge small={small} />}
      {hasIndustry && <IndustryBadge small={small} />}
      {schoolVerified && <SchoolVerifiedBadge small={small} />}
      {competency && <CompetencyBadge small={small} />}
    </div>
  );
}

export function VerifiedCompanyMark({ status, withLabel }: { status: CompanyVerificationStatus; withLabel?: boolean }) {
  if (status !== "VERIFIED") return null;
  return withLabel ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
      <BadgeCheck className="h-3.5 w-3.5" /> Verified Company
    </span>
  ) : (
    <BadgeCheck className="inline h-4 w-4 shrink-0 text-teal-600" aria-label="Verified Company" />
  );
}
