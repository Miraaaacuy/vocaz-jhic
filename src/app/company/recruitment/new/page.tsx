import { requireCompany } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { JobForm } from "../job-form";

export default async function NewJob() {
  const { company } = await requireCompany();
  return (
    <>
      <PageHeader title="Buat Lowongan" description="Isi detail lowongan. Kriteria Smart Match membantu menemukan kandidat terbaik." back={{ href: "/company/recruitment", label: "Rekrutmen" }} />
      <JobForm defaultCity={company.city} />
    </>
  );
}
