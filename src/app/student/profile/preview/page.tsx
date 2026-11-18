import { Eye, Pencil } from "lucide-react";
import { requireStudent } from "@/lib/session";
import { getTalent } from "@/server/queries";
import { TalentProfileView } from "@/components/views/talent-profile";
import { ButtonLink, Card } from "@/components/ui";

export default async function PreviewPage() {
  const { student } = await requireStudent();
  const t = (await getTalent(student.slug))!;
  return (
    <>
      <Card className="mb-6 flex flex-col gap-3 border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center">
        <Eye className="h-5 w-5 shrink-0 text-sky-700" />
        <p className="flex-1 text-sm text-sky-800">Ini tampilan profilmu seperti yang dilihat oleh recruiter di VocAZ.</p>
        <ButtonLink href="/student/profile" size="sm" variant="secondary">
          <Pencil className="h-4 w-4" /> Edit profil
        </ButtonLink>
        <ButtonLink href={`/talenta/${student.slug}`} size="sm" variant="ghost" target="_blank">
          Lihat versi publik
        </ButtonLink>
      </Card>
      <TalentProfileView t={t} mode="full" videoHref={(id) => `/student/showcase/watch/${id}`} />
    </>
  );
}
