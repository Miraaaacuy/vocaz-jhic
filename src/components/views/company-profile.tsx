import { Building2, Calendar, Globe, Mail, MapPin, Phone, School, Users } from "lucide-react";
import type { Company } from "@prisma/client";
import { Avatar, Card, EmptyState } from "../ui";
import { VerifiedCompanyMark } from "../badges";
import { JobCard, type JobCardData } from "../cards";
import { COMPANY_VERIFY_LABEL, PARTNER_TYPE_LABEL } from "@/lib/constants";

export function CompanyProfileView({
  c,
  jobs,
  jobHref,
  partners = [],
  actions,
  showContact = true,
}: {
  c: Company;
  jobs: (JobCardData & { id: string })[];
  jobHref: (id: string) => string;
  partners?: { id: string; type: keyof typeof PARTNER_TYPE_LABEL; school: { name: string } }[];
  actions?: React.ReactNode;
  showContact?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        {c.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverUrl} alt="" className="h-36 w-full object-cover sm:h-44" />
        ) : (
          <div className="h-36 bg-gradient-to-r from-teal-700 via-teal-600 to-brand-600 sm:h-44" />
        )}
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar src={c.logoUrl} name={c.name} size={96} square className="bg-white ring-4 ring-white" />
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          <h1 className="mt-4 flex flex-wrap items-center gap-2 text-2xl font-bold text-ink">
            {c.name} <VerifiedCompanyMark status={c.verificationStatus} withLabel />
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {c.industry}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {c.city}, {c.province}
            </span>
            {c.size && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {c.size} karyawan
              </span>
            )}
            {c.foundedYear && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Berdiri {c.foundedYear}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-7">
            <h2 className="mb-3 text-lg font-bold text-ink">Tentang Perusahaan</h2>
            <p className="leading-relaxed whitespace-pre-line text-body">{c.description || "Belum ada deskripsi."}</p>
          </Card>
          <div>
            <h2 className="mb-4 text-lg font-bold text-ink">Lowongan Aktif ({jobs.length})</h2>
            {jobs.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((j) => (
                  <JobCard key={j.id} job={j} href={jobHref(j.id)} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState icon={Building2} title="Belum ada lowongan aktif" description="Pantau terus, lowongan baru akan muncul di sini." />
              </Card>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-ink">Status Verifikasi</h3>
            <p className="text-sm text-body">{COMPANY_VERIFY_LABEL[c.verificationStatus]}</p>
            <p className="mt-1 text-xs text-muted">
              {c.verificationStatus === "VERIFIED"
                ? "Dokumen legal perusahaan telah ditinjau dan disetujui oleh tim VocAZ."
                : "Perusahaan ini belum menyelesaikan verifikasi dokumen legal."}
            </p>
          </Card>
          {showContact && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-ink">Kontak</h3>
              <ul className="space-y-2 text-sm text-body">
                {c.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted" />
                    <a href={c.website} target="_blank" rel="noreferrer" className="truncate text-brand-600 hover:underline">
                      {c.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
                {c.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted" /> {c.email}
                  </li>
                )}
                {c.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted" /> {c.phone}
                  </li>
                )}
                {c.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> {c.address}
                  </li>
                )}
              </ul>
            </Card>
          )}
          {partners.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-ink">Mitra Sekolah</h3>
              <ul className="space-y-2.5">
                {partners.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <School className="h-4 w-4 text-teal-600" />
                    <span className="flex-1 text-body">{p.school.name}</span>
                    <span className="text-xs text-muted">{PARTNER_TYPE_LABEL[p.type]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
