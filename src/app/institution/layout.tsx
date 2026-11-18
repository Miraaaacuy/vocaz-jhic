import { RoleLayout } from "@/components/layout/role-layout";
import { requireInstitution } from "@/lib/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, institution } = await requireInstitution();
  return (
    <RoleLayout role="INSTITUTION" userId={user.id} orgName={institution.name}>
      {children}
    </RoleLayout>
  );
}
