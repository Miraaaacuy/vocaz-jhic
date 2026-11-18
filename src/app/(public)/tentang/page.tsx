import type { Metadata } from "next";
import { ArrowDown, Award, BadgeCheck, Building2, CheckCircle2, GraduationCap, School, ShieldCheck, Sparkles, Target, TriangleAlert } from "lucide-react";
import { platformStats } from "@/server/queries";
import { ButtonLink, Card, SectionTitle } from "@/components/ui";
import { SponsorStrip } from "@/components/brand";

export const metadata: Metadata = { title: "Tentang VocAZ" };

const FAQ = [
  ["Apakah VocAZ gratis untuk siswa?", "Ya. Siswa dapat membuat profil, mengunggah video showcase, dan melamar pekerjaan tanpa biaya."],
  ["Bagaimana badge verifikasi diberikan?", "School Verified diberikan oleh BKK sekolah, sedangkan badge LSP–BNSP dan Industry Certified diberikan setelah lembaga sertifikasi memverifikasi sertifikat yang diunggah siswa."],
  ["Bagaimana Smart Talent Match menghitung persentase kecocokan?", "Skor 0–100% dihitung dari 6 komponen berbobot: keahlian (40), program keahlian (15), sertifikasi terverifikasi (15), pengalaman (15), lokasi (10), dan kelengkapan profil & video (5). Setiap poin disertai alasan yang bisa dibaca recruiter."],
  ["Apakah perusahaan harus terverifikasi untuk merekrut?", "Tidak. Perusahaan dapat langsung menggunakan VocAZ, namun status Verified Company diberikan setelah Super Admin meninjau dokumen legal."],
  ["Apa peran sekolah / BKK?", "BKK memverifikasi siswa, memantau aktivitas karier, status rekrutmen, dan penempatan kerja siswa — tanpa menjadi recruiter."],
];

export default async function AboutPage() {
  const s = await platformStats();
  return (
    <>
      <section className="bg-surface">
        <div className="container-page py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> Tentang VocAZ
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Vocational Career <span className="text-brand-600">A to Z</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-body">
            VocAZ adalah ekosistem karier vokasi yang menghubungkan siswa SMK, sekolah/BKK, lembaga sertifikasi, dan industri dalam satu platform berbasis kepercayaan.
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [s.students, "Talenta"],
              [s.companies, "Perusahaan"],
              [s.schools, "Sekolah"],
              [s.hired, "Diterima kerja"],
            ].map(([n, l]) => (
              <div key={l as string} className="rounded-2xl border border-line bg-canvas p-4">
                <p className="text-3xl font-extrabold text-brand-600">{n}</p>
                <p className="text-sm text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <Card className="p-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TriangleAlert className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">Masalah yang kami selesaikan</h2>
            <ul className="mt-4 space-y-3 text-body">
              {[
                "Lulusan SMK sulit menunjukkan kompetensi nyata — CV saja tidak cukup.",
                "Perusahaan kesulitan memvalidasi klaim skill dan sertifikat kandidat.",
                "Sekolah/BKK tidak punya data real-time tentang karier dan penempatan alumni.",
                "Sertifikat kompetensi tersebar dan mudah dipalsukan.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" /> {t}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">Solusi VocAZ</h2>
            <ul className="mt-4 space-y-3 text-body">
              {[
                "Video Talent Showcase — siswa menunjukkan skill secara nyata.",
                "Verifikasi berlapis oleh sekolah dan lembaga sertifikasi (LSP/BNSP & industri).",
                "Smart Talent Match — rekomendasi kandidat dengan skor kecocokan yang transparan.",
                "Career Monitoring untuk BKK: dari lamaran sampai penempatan.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-20 bg-surface py-16">
        <div className="container-page">
          <SectionTitle center eyebrow="Cara Kerja" title="Alur ekosistem VocAZ" />
          <div className="mx-auto grid max-w-4xl gap-3">
            {[
              [GraduationCap, "Siswa membangun profil", "Data pribadi, pendidikan, skill, portfolio, dan video showcase."],
              [School, "Sekolah memverifikasi", "BKK memvalidasi status siswa → badge School Verified."],
              [Award, "Lembaga memverifikasi sertifikat", "Siswa mengunggah sertifikat → lembaga Verify/Reject → badge LSP–BNSP / Industry Certified."],
              [Sparkles, "Perusahaan menemukan talenta", "Smart Talent Match & Video Showcase → hubungi talent → Messages."],
              [Building2, "Rekrutmen & penempatan", "Lamaran diproses hingga Diterima → tercatat sebagai Placement di dashboard BKK."],
              [ShieldCheck, "Super Admin mengawasi", "Verifikasi perusahaan, moderasi konten, dan monitoring platform."],
            ].map(([Icon, title, desc], i, arr) => {
              const I = Icon as typeof Award;
              return (
                <div key={i}>
                  <Card className="flex items-start gap-4 p-5">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <I className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">
                        {i + 1}. {title as string}
                      </p>
                      <p className="text-sm text-muted">{desc as string}</p>
                    </div>
                  </Card>
                  {i < arr.length - 1 && <ArrowDown className="mx-auto my-1 h-4 w-4 text-line-strong" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <SectionTitle center eyebrow="Value" title="Manfaat untuk setiap pihak" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              [GraduationCap, "Siswa", "Profil profesional yang dipercaya industri, peluang kerja/PKL yang relevan, dan rekomendasi lowongan dengan skor kecocokan."],
              [Building2, "Perusahaan", "Menemukan kandidat tervalidasi lebih cepat, melihat skill nyata lewat video, dan mengelola seluruh pipeline rekrutmen."],
              [School, "Sekolah / BKK", "Memantau aktivitas karier siswa, status rekrutmen, penempatan, dan memperluas mitra industri."],
              [BadgeCheck, "Lembaga Sertifikasi", "Verifikasi sertifikat digital yang terarsip rapi dan meningkatkan nilai sertifikasi di mata industri."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Award;
              return (
                <Card key={t as string} className="p-6">
                  <I className="h-8 w-8 text-brand-600" />
                  <h3 className="mt-4 font-bold text-ink">{t as string}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{d as string}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-surface py-16">
        <div className="container-page max-w-3xl">
          <SectionTitle center eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
          <div className="space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="card group p-5 open:shadow-[var(--shadow-pop)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {q}
                  <span className="text-xl text-brand-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-body">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page text-center">
          <p className="mb-6 text-sm font-bold tracking-[0.14em] text-muted uppercase">Dikembangkan untuk JHIC 2.0 bersama</p>
          <SponsorStrip />
          <div className="mt-12">
            <ButtonLink href="/register" size="lg">
              Bergabung dengan VocAZ
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
