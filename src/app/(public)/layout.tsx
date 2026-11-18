import { PublicNav } from "@/components/layout/public-nav";
import { Footer } from "@/components/layout/footer";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getSetting } from "@/lib/settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, platform] = await Promise.all([getSession(), getSetting("platform")]);
  return (
    <div className="flex min-h-screen flex-col">
      {platform.maintenance && (
        <div className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">🛠️ VocAZ sedang dalam pemeliharaan terjadwal. Beberapa fitur mungkin tidak tersedia sementara.</div>
      )}
      <PublicNav dashboardHref={session?.user ? ROLE_HOME[session.user.role] : undefined} userName={session?.user?.name ?? undefined} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
