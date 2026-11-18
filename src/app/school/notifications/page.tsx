import { requireSchool } from "@/lib/session";
import { NotificationsView } from "@/components/views/notifications";

export default async function Page() {
  const { user } = await requireSchool();
  return <NotificationsView userId={user.id} />;
}
