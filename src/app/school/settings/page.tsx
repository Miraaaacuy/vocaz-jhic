import { requireSchool } from "@/lib/session";
import { SettingsView, type OAuthNotice } from "@/components/views/settings";

export default async function Page({ searchParams }: { searchParams: Promise<OAuthNotice> }) {
  const { user } = await requireSchool();
  return <SettingsView userId={user.id} notice={await searchParams} />;
}
