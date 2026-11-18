import { RoleLayout } from "@/components/layout/role-layout";
import { requireCompany } from "@/lib/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, company } = await requireCompany();
  return (
    <RoleLayout role="COMPANY" userId={user.id} orgName={company.name}>
      {children}
    </RoleLayout>
  );
}
