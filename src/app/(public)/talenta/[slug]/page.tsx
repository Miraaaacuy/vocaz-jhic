import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Bookmark, MessageSquare, UserPlus } from "lucide-react";
import { getTalent } from "@/server/queries";
import { getSession } from "@/lib/session";
import { TalentProfileView } from "@/components/views/talent-profile";
import { ButtonLink } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getTalent((await params).slug);
  return { title: t ? `${t.user.name} — ${t.headline ?? t.major}` : "Talenta" };
}

export default async function PublicTalentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (session?.user.role === "COMPANY") redirect(`/company/talent-match/${slug}`);
  if (session?.user.role === "STUDENT") redirect(`/student/network/${slug}`);
  // School, institution & admin accounts see the full profile here
  const t = await getTalent(slug);
  if (!t || (!t.isPublic && !session)) notFound();
  const loginHref = `/login?next=/talenta/${slug}`;
  const full = !!session;

  return (
    <div className="container-page py-10">
      <TalentProfileView
        t={t}
        mode={full ? "full" : "public"}
        loginHref={loginHref}
        actions={
          !full && (
            <>
              <ButtonLink href={loginHref} variant="secondary" size="sm">
                <Bookmark className="h-4 w-4" /> Simpan
              </ButtonLink>
              <ButtonLink href={loginHref} variant="secondary" size="sm">
                <UserPlus className="h-4 w-4" /> Connect
              </ButtonLink>
              <ButtonLink href={loginHref} size="sm">
                <MessageSquare className="h-4 w-4" /> Hubungi
              </ButtonLink>
            </>
          )
        }
      />
    </div>
  );
}
