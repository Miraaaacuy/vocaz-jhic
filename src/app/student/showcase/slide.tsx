import { User } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { ReportButton } from "@/components/report-button";
import { ReelInfo, ReelSlide, type ReelRow } from "@/components/reel/reel-slide";

/** Slide for a signed-in student: open the talent's profile, or report someone else's video */
export function StudentReelSlide({ v, first, studentId }: { v: ReelRow; first?: boolean; studentId: string }) {
  const own = v.studentId === studentId;
  const profileHref = own ? "/student/profile/preview" : `/student/network/${v.student.slug}`;
  return (
    <ReelSlide
      v={v}
      first={first}
      profileHref={profileHref}
      info={
        <ReelInfo v={v} profileHref={profileHref}>
          {!own && (
            <div className="mt-4 border-t border-line pt-3">
              <ReportButton type="VIDEO" id={v.id} label={v.title} />
            </div>
          )}
        </ReelInfo>
      }
      actions={
        <>
          <ButtonLink href={profileHref} variant="white" size="md" className="ring-1 ring-line">
            <User className="h-4 w-4" /> {own ? "Profil saya" : "Lihat profil"}
          </ButtonLink>
          {/* phones have no side panel, so the report button lives next to the profile button there */}
          {!own && (
            <span className="flex-none! rounded-xl bg-white lg:hidden">
              <ReportButton type="VIDEO" id={v.id} label={v.title} compact />
            </span>
          )}
        </>
      }
    />
  );
}
