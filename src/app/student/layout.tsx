import { RoleLayout } from "@/components/layout/role-layout";
import { requireStudent } from "@/lib/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user } = await requireStudent();
  return (
    <RoleLayout role="STUDENT" userId={user.id}>
      {children}
    </RoleLayout>
  );
}
