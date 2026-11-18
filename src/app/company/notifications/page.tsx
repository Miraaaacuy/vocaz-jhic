import { requireCompany } from "@/lib/session";
import { NotificationsView } from "@/components/views/notifications";

export default async function Page() {
  const { user } = await requireCompany();
  return <NotificationsView userId={user.id} />;
}
