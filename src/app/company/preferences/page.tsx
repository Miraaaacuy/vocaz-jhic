import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { saveTalentPreferences } from "@/server/company-actions";
import { ActionForm, SubmitButton, TagInput } from "@/components/forms";
import { ButtonLink, Card, CardHeader, Field, PageHeader, Select, Textarea } from "@/components/ui";
import { CERT_PREF_LABEL, CITIES, JOB_TYPE_LABEL, MAJORS, PROVINCES } from "@/lib/constants";
import { getWeights } from "@/lib/match-data";
import { strArr } from "@/lib/utils";

export default async function Preferences() {
  const { company } = await requireCompany();
  const [p, skills, W] = await Promise.all([db.talentPreference.findUnique({ where: { companyId: company.id } }), db.skill.findMany({ select: { name: true } }), getWeights()]);
  const jobTypes = strArr(p?.jobTypes);
  return (
    <>
      <PageHeader
        title="Talent Preferences"
        description="Profil talenta ideal perusahaan Anda. Data ini menjadi acuan default Smart Talent Match."
        action={
          <ButtonLink href="/company/talent-match" variant="secondary">
            <Sparkles className="h-4 w-4" /> Lihat hasil match
          </ButtonLink>
        }
      />
      <ActionForm action={saveTalentPreferences} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader title="Kriteria talenta" />
          <div className="space-y-5 p-5">
            <Field label="Skill yang dicari" hint="Skill ini diperlakukan sebagai skill wajib saat mencocokkan.">
              <TagInput name="skills" defaultValue={strArr(p?.skills)} suggestions={skills.map((s) => s.name)} placeholder="cth. React" />
            </Field>
            <Field label="Program keahlian">
              <TagInput name="majors" defaultValue={strArr(p?.majors)} suggestions={MAJORS} placeholder="cth. Rekayasa Perangkat Lunak" />
            </Field>
            <Field label="Lokasi (kota / provinsi)">
              <TagInput name="locations" defaultValue={strArr(p?.locations)} suggestions={[...Object.keys(CITIES), ...PROVINCES]} placeholder="cth. Malang" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pengalaman minimal">
                <Select
                  name="minExperienceMonths"
                  defaultValue={String(p?.minExperienceMonths ?? 0)}
                  options={[
                    { value: "0", label: "Tidak disyaratkan" },
                    { value: "3", label: "3 bulan (PKL)" },
                    { value: "6", label: "6 bulan" },
                    { value: "12", label: "1 tahun" },
                  ]}
                />
              </Field>
              <Field label="Sertifikasi">
                <Select name="certification" defaultValue={p?.certification ?? "ANY"} options={Object.entries(CERT_PREF_LABEL).map(([value, label]) => ({ value, label }))} />
              </Field>
            </div>
            <div>
              <p className="label">Jenis kebutuhan</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(JOB_TYPE_LABEL).map(([v, l]) => (
                  <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-3 py-2 text-sm">
                    <input type="checkbox" name="jobTypes" value={v} defaultChecked={jobTypes.includes(v)} className="h-4 w-4" /> {l}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Catatan internal">
              <Textarea name="notes" rows={3} defaultValue={p?.notes ?? ""} placeholder="cth. Prioritaskan kandidat dengan portfolio web" />
            </Field>
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="font-semibold text-ink">Bobot Smart Match</p>
            <p className="mt-1 text-xs text-muted">Ditentukan platform agar skor adil & konsisten.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Keahlian", W.skills],
                ["Program keahlian", W.major],
                ["Sertifikasi terverifikasi", W.certification],
                ["Pengalaman", W.experience],
                ["Lokasi", W.location],
                ["Profil & video", W.profile],
              ].map(([l, w]) => (
                <li key={l as string} className="flex items-center gap-3">
                  <span className="flex-1 text-body">{l}</span>
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-subtle">
                    <span className="block h-full bg-brand-600" style={{ width: `${((w as number) / 40) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right font-semibold text-ink">{w}</span>
                </li>
              ))}
            </ul>
          </Card>
          <SubmitButton size="lg" className="w-full" pendingText="Menyimpan…">
            Simpan Preferensi
          </SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
