import { BadgeCheck, PlayCircle, Sparkles } from "lucide-react";
import { Logo, SponsorStrip } from "@/components/brand";
import { BackButton } from "@/components/back-button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="mesh-dark relative hidden overflow-hidden text-white lg:flex lg:flex-col">
        <span aria-hidden className="absolute -top-24 -right-24 h-80 w-80 rounded-full border border-white/10" />
        <span aria-hidden className="absolute top-10 -right-10 h-48 w-48 rounded-full border border-white/10" />
        <div className="bg-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative flex flex-1 flex-col p-10 xl:p-14">
          <Logo white className="h-11" />
          <div className="my-auto max-w-md">
            <h2 className="text-4xl leading-[1.1] font-extrabold tracking-[-0.03em] xl:text-[40px]">
              Temukan Pekerjaan.
              <br />
              <span className="text-accent-300">Tunjukkan Kompetensi.</span>
            </h2>
            <p className="mt-4 text-white/75">Ekosistem karier vokasi yang menghubungkan siswa SMK, sekolah, lembaga sertifikasi, dan industri.</p>
            <ul className="mt-8 space-y-4">
              {[
                [BadgeCheck, "Profil terverifikasi sekolah & lembaga sertifikasi BNSP"],
                [PlayCircle, "Video Talent Showcase — tunjukkan skill, bukan cuma CV"],
                [Sparkles, "Smart Talent Match — skor kecocokan kandidat secara transparan"],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof BadgeCheck;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-300 ring-1 ring-white/15">
                      <I className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-white/90">{text as string}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow-pop)]">
            <SponsorStrip compact className="gap-x-5" />
          </div>
        </div>
      </aside>
      <main className="flex flex-col bg-canvas">
        {/* phones: logo + back; desktop: back only (the logo lives in the side panel) */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:py-5">
          <span className="lg:hidden">
            <Logo className="h-9" />
          </span>
          <BackButton className="px-2.5 py-2" />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-6 lg:py-12">{children}</div>
        <div className="border-t border-line bg-surface px-4 py-4 lg:hidden">
          <SponsorStrip compact className="gap-x-4" />
        </div>
      </main>
    </div>
  );
}
