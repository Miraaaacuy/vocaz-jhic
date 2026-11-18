import { RoleLayout } from "@/components/layout/role-layout";
import { requireAdmin } from "@/lib/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <RoleLayout role="ADMIN" userId={user.id}>
      {children}
    </RoleLayout>
  );
}
