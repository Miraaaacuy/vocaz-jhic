import { notFound } from "next/navigation";
import { Flag } from "lucide-react";
import { getCompany } from "@/server/queries";
import { reportContent } from "@/server/common-actions";
import { CompanyProfileView } from "@/components/views/company-profile";
import { FormModal } from "@/components/forms";
import { Button, Field, Select, Textarea } from "@/components/ui";
import { REPORT_REASONS } from "@/lib/constants";

export default async function StudentCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) notFound();
  return (
    <CompanyProfileView
      c={c}
      jobs={c.jobs}
      jobHref={(id) => `/student/career/jobs/${id}`}
      partners={c.partners}
      actions={
        <FormModal
          title="Laporkan perusahaan"
          action={reportContent}
          submitLabel="Kirim laporan"
          submitVariant="danger"
          trigger={
            <Button variant="secondary" size="sm">
              <Flag className="h-4 w-4" /> Laporkan
            </Button>
          }
        >
          <input type="hidden" name="targetType" value="COMPANY" />
          <input type="hidden" name="targetId" value={c.id} />
          <input type="hidden" name="targetLabel" value={c.name} />
          <Field label="Alasan" required>
            <Select name="reason" required options={REPORT_REASONS} placeholder="Pilih alasan" />
          </Field>
          <Field label="Detail">
            <Textarea name="details" rows={3} placeholder="cth. perusahaan meminta biaya saat rekrutmen" />
          </Field>
        </FormModal>
      }
    />
  );
}
