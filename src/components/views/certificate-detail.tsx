import { FileText, School } from "lucide-react";
import type { Certificate, Institution, StudentProfile, User, School as SchoolT } from "@prisma/client";
import { Avatar, Badge, Card, CardHeader, Chip, DescList } from "../ui";
import { CERT_TYPE_LABEL, VERIFY_STATUS_LABEL } from "@/lib/constants";
import { fmtDate, strArr } from "@/lib/utils";

export function CertificateDetail({
  c,
  actions,
}: {
  c: Certificate & { institution: Institution | null; student: StudentProfile & { user: User; school: SchoolT | null }; reviewedBy?: { name: string } | null };
  actions?: React.ReactNode;
}) {
  const isPdf = c.fileUrl?.toLowerCase().endsWith(".pdf");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Informasi sertifikat" action={<Badge tone={c.status === "VERIFIED" ? "success" : c.status === "REJECTED" ? "danger" : "warning"}>{VERIFY_STATUS_LABEL[c.status]}</Badge>} />
          <div className="p-5">
            <DescList
              items={[
                { label: "Nama sertifikat", value: c.name },
                { label: "Nomor sertifikat", value: <span className="font-mono">{c.number}</span> },
                { label: "Jenis", value: CERT_TYPE_LABEL[c.type] },
                { label: "Penerbit", value: c.institution?.name ?? c.issuer },
                { label: "Tanggal terbit", value: fmtDate(c.issuedAt) },
                { label: "Berlaku hingga", value: c.expiresAt ? fmtDate(c.expiresAt) : "Tidak ada" },
                { label: "Diajukan", value: fmtDate(c.createdAt, "d MMM yyyy HH:mm") },
                { label: "Skill terkait", value: <span className="flex flex-wrap gap-1">{strArr(c.relatedSkills).map((s) => <Chip key={s}>{s}</Chip>)}</span> },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Dokumen sertifikat"
            action={
              c.fileUrl && (
                <a href={c.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                  <FileText className="h-4 w-4" /> Buka di tab baru
                </a>
              )
            }
          />
          <div className="p-4">
            {c.fileUrl ? (
              isPdf ? (
                <iframe src={c.fileUrl} className="h-[520px] w-full rounded-lg border border-line bg-subtle" title="Dokumen sertifikat" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.fileUrl} alt="Sertifikat" className="mx-auto max-h-[520px] rounded-lg border border-line" />
              )
            ) : (
              <p className="text-sm text-muted">Tidak ada dokumen.</p>
            )}
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="p-5">
          <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">Siswa</p>
          <div className="flex items-center gap-3">
            <Avatar src={c.student.user.avatarUrl} name={c.student.user.name} size={52} />
            <div>
              <p className="font-semibold text-ink">{c.student.user.name}</p>
              <p className="text-sm text-muted">{c.student.major}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-body">
              <School className="h-4 w-4 text-muted" /> {c.student.school?.name ?? "-"}
            </p>
            <p className="text-muted">NISN: {c.student.nisn ?? "-"}</p>
            <p className="text-muted">Lulus: {c.student.graduationYear}</p>
          </div>
        </Card>
        {c.status !== "PENDING" && (
          <Card className="p-5">
            <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Hasil verifikasi</p>
            <p className="text-sm text-body">
              {VERIFY_STATUS_LABEL[c.status]} pada {fmtDate(c.reviewedAt, "d MMM yyyy HH:mm")}
              {c.reviewedBy && ` oleh ${c.reviewedBy.name}`}
            </p>
            {c.reviewNote && <p className="mt-2 rounded-lg bg-subtle px-3 py-2 text-sm text-body">{c.reviewNote}</p>}
          </Card>
        )}
        {actions}
      </div>
    </div>
  );
}
