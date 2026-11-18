import { Eye } from "lucide-react";
import { ButtonLink, PageHeader, Tabs } from "@/components/ui";

const TABS = [
  { href: "/student/profile", label: "Informasi Pribadi" },
  { href: "/student/profile/education", label: "Pendidikan & Pengalaman" },
  { href: "/student/profile/skills", label: "Skill & Prestasi" },
  { href: "/student/profile/portfolio", label: "Portfolio" },
  { href: "/student/profile/certifications", label: "Sertifikasi" },
];

export function ProfileTabs({ active }: { active: string }) {
  return (
    <>
      <PageHeader
        title="My Profile"
        description="Pusat identitas profesionalmu. Profil yang lengkap lebih mudah ditemukan perusahaan."
        action={
          <ButtonLink href="/student/profile/preview" variant="secondary">
            <Eye className="h-4 w-4" /> Preview sebagai recruiter
          </ButtonLink>
        }
      />
      <Tabs tabs={TABS} active={active} />
    </>
  );
}
