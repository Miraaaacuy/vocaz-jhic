import { Bookmark, MessageSquare, User } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { ReelSlide, type ReelRow } from "@/components/reel/reel-slide";

/** Slide for visitors: profile is public, saving and contacting need an account */
export function PublicReelSlide({ v, first }: { v: ReelRow; first?: boolean }) {
  const login = `/login?next=/showcase/${v.id}`;
  return (
    <ReelSlide
      v={v}
      first={first}
      profileHref={`/talenta/${v.student.slug}`}
      actions={
        <>
          <ButtonLink href={`/talenta/${v.student.slug}`} variant="white" size="md" className="ring-1 ring-line">
            <User className="h-4 w-4" /> Profil
          </ButtonLink>
          <ButtonLink href={login} variant="white" size="md" className="ring-1 ring-line">
            <Bookmark className="h-4 w-4" /> Simpan
          </ButtonLink>
          <ButtonLink href={login} size="md">
            <MessageSquare className="h-4 w-4" /> Hubungi
          </ButtonLink>
        </>
      }
    />
  );
}
