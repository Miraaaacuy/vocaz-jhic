import { RoleLayout } from "@/components/layout/role-layout";
import { requireSchool } from "@/lib/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, school } = await requireSchool();
  return (
    <RoleLayout role="SCHOOL" userId={user.id} orgName={school.name}>
      {children}
    </RoleLayout>
  );
}
