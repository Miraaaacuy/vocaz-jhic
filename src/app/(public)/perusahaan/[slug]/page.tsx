import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCompany } from "@/server/queries";
import { CompanyProfileView } from "@/components/views/company-profile";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCompany((await params).slug);
  return { title: c?.name ?? "Perusahaan" };
}

export default async function PublicCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (session?.user.role === "STUDENT") redirect(`/student/career/companies/${slug}`);
  const c = await getCompany(slug);
  if (!c) notFound();
  return (
    <div className="container-page py-10">
      <CompanyProfileView c={c} jobs={c.jobs} jobHref={(id) => `/lowongan/${id}`} partners={c.partners} showContact={!!session} />
    </div>
  );
}
