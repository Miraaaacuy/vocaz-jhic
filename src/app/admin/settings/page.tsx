import { Check, Minus, Settings2, ShieldCheck, Sliders, Flag } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getWeights } from "@/lib/match-data";
import { saveMatchWeights, saveSettings } from "@/server/admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, CardHeader, Checkbox, Field, Input, PageHeader, Table } from "@/components/ui";
import { DOC_TYPES } from "@/lib/constants";

type Obj = Record<string, unknown>;

const PERMS: [string, boolean[]][] = [
  // Siswa, Perusahaan, Sekolah, Lembaga, Admin
  ["Kelola profil & showcase", [true, false, false, false, false]],
  ["Melamar lowongan", [true, false, false, false, false]],
  ["Posting lowongan & kelola pelamar", [false, true, false, false, false]],
  ["Smart Talent Match", [false, true, false, false, true]],
  ["Hubungi talent (Messages)", [true, true, false, false, false]],
  ["Verifikasi siswa (School Verified)", [false, false, true, false, false]],
  ["Monitoring karier & penempatan", [false, false, true, false, true]],
  ["Verifikasi sertifikat", [false, false, false, true, false]],
  ["Verifikasi perusahaan", [false, false, false, false, true]],
  ["Moderasi konten & kelola user", [false, false, false, false, true]],
];

export default async function SystemSettings() {
  await requireAdmin();
  const [w, rows] = await Promise.all([getWeights(), db.systemSetting.findMany()]);
  const get = (k: string) => (rows.find((r) => r.key === k)?.value ?? {}) as Obj;
  const platform = get("platform");
  const moderation = get("moderation");
  const verification = get("verification");
  const reqDocs = (verification.requiredDocs as string[]) ?? ["NIB", "NPWP"];

  return (
    <>
      <PageHeader title="System Settings" description="Pengaturan global platform VocAZ." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Sliders className="h-4 w-4 text-brand-600" /> Bobot Smart Talent Match</span>} description="Total harus 100. Perubahan langsung berlaku untuk semua skor." />
          <ActionForm action={saveMatchWeights} className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {(
                [
                  ["skills", "Keahlian"],
                  ["major", "Program keahlian"],
                  ["certification", "Sertifikasi"],
                  ["experience", "Pengalaman"],
                  ["location", "Lokasi"],
                  ["profile", "Profil & video"],
                ] as const
              ).map(([k, l]) => (
                <Field key={k} label={l}>
                  <Input name={k} type="number" min={0} max={100} defaultValue={w[k]} />
                </Field>
              ))}
            </div>
            <SubmitButton>Simpan bobot</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-brand-600" /> Platform configuration</span>} />
          <ActionForm action={saveSettings} className="space-y-4 p-5">
            <input type="hidden" name="group" value="platform" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama platform">
                <Input name="name" defaultValue={(platform.name as string) ?? "VocAZ"} />
              </Field>
              <Field label="Maks. ukuran video (MB)">
                <Input name="maxVideoMB" type="number" defaultValue={(platform.maxVideoMB as number) ?? 100} />
              </Field>
            </div>
            <Checkbox name="allowRegistration" defaultChecked={(platform.allowRegistration as boolean) ?? true} label="Izinkan registrasi pengguna baru" />
            <Checkbox name="maintenance" defaultChecked={!!platform.maintenance} label="Mode maintenance (tampilkan banner pemeliharaan)" />
            <SubmitButton>Simpan</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /> Verification rules</span>} />
          <ActionForm action={saveSettings} className="space-y-4 p-5">
            <input type="hidden" name="group" value="verification" />
            <p className="text-sm font-semibold text-ink">Dokumen wajib verifikasi perusahaan</p>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map((d) => (
                <Checkbox key={d.value} name="requiredDocs" value={d.value} defaultChecked={reqDocs.includes(d.value)} label={d.label} />
              ))}
            </div>
            <SubmitButton>Simpan</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Flag className="h-4 w-4 text-brand-600" /> Moderation rules</span>} />
          <ActionForm action={saveSettings} className="space-y-4 p-5">
            <input type="hidden" name="group" value="moderation" />
            <Field label="Ambang laporan untuk auto-hide konten" hint="Konten otomatis disembunyikan setelah dilaporkan sejumlah ini.">
              <Input name="autoHideThreshold" type="number" min={1} defaultValue={(moderation.autoHideThreshold as number) ?? 3} />
            </Field>
            <Checkbox name="requireVideoReview" defaultChecked={!!moderation.requireVideoReview} label="Video baru perlu ditinjau sebelum tayang" />
            <SubmitButton>Simpan</SubmitButton>
          </ActionForm>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Roles & permissions" description="Matriks hak akses per peran (ditetapkan sistem)." />
          <Table>
            <thead>
              <tr>
                <th>Kemampuan</th>
                {["Siswa", "Perusahaan", "Sekolah/BKK", "Lembaga", "Admin"].map((r) => (
                  <th key={r} className="text-center">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([label, row]) => (
                <tr key={label}>
                  <td className="text-body">{label}</td>
                  {row.map((v, i) => (
                    <td key={i} className="text-center">
                      {v ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-line-strong" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
