import { requireStudent } from "@/lib/session";
import { NotificationsView } from "@/components/views/notifications";

export default async function Page() {
  const { user } = await requireStudent();
  return <NotificationsView userId={user.id} />;
}
