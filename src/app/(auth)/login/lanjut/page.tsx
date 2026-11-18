import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeFor } from "@/lib/redirects";

// Landing spot after Google/Facebook login: send the user to their role's dashboard (or the page they came from)
export default async function ContinueAfterLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(homeFor(session.user.role, (await searchParams).next));
}
