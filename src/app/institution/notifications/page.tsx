import { requireInstitution } from "@/lib/session";
import { NotificationsView } from "@/components/views/notifications";

export default async function Page() {
  const { user } = await requireInstitution();
  return <NotificationsView userId={user.id} />;
}
