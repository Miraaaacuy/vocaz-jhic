import { Flag } from "lucide-react";
import type { ReportTarget } from "@prisma/client";
import { reportContent } from "@/server/common-actions";
import { FormModal } from "./forms";
import { Button, Field, Select, Textarea } from "./ui";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportButton({ type, id, label, compact }: { type: ReportTarget; id: string; label: string; compact?: boolean }) {
  return (
    <FormModal
      title="Laporkan konten"
      description={label}
      action={reportContent}
      submitLabel="Kirim laporan"
      submitVariant="danger"
      trigger={
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="text-muted" title="Laporkan">
          <Flag className="h-4 w-4" /> {!compact && "Laporkan"}
        </Button>
      }
    >
      <input type="hidden" name="targetType" value={type} />
      <input type="hidden" name="targetId" value={id} />
      <input type="hidden" name="targetLabel" value={label} />
      <Field label="Alasan" required>
        <Select name="reason" required options={REPORT_REASONS} placeholder="Pilih alasan" />
      </Field>
      <Field label="Detail tambahan">
        <Textarea name="details" rows={3} />
      </Field>
    </FormModal>
  );
}
