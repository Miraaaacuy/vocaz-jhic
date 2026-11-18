import Link from "@/components/link";
import { Globe, Link2, Mail, Phone } from "lucide-react";
import { Logo, SponsorStrip } from "../brand";
import { APP_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mesh-dark mt-auto text-white">
      <div className="container-page pt-12">
        {/* sponsor logos sit on a white card so they stay legible on the dark footer */}
        <div className="rounded-[28px] bg-white px-6 py-7 shadow-[var(--shadow-pop)]">
          <p className="mb-5 text-center text-xs font-bold tracking-[0.16em] text-muted uppercase">Didukung oleh</p>
          <SponsorStrip />
        </div>
      </div>
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo white className="h-12" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">{APP_TAGLINE}. Ekosistem karier vokasi yang menghubungkan siswa SMK, sekolah, lembaga sertifikasi, dan industri.</p>
        </div>
        <FooterCol
          title="Platform"
          links={[
            ["/talenta", "Talenta SMK"],
            ["/showcase", "Video Showcase"],
            ["/lowongan", "Lowongan"],
            ["/perusahaan", "Perusahaan"],
          ]}
        />
        <FooterCol
          title="Bergabung"
          links={[
            ["/register?role=student", "Untuk Siswa"],
            ["/register?role=company", "Untuk Perusahaan"],
            ["/register?role=school", "Untuk Sekolah / BKK"],
            ["/register?role=institution", "Untuk Lembaga Sertifikasi"],
          ]}
        />
        <div>
          <FooterCol
            title="VocAZ"
            links={[
              ["/tentang", "Tentang Kami"],
              ["/tentang#cara-kerja", "Cara Kerja"],
              ["/tentang#faq", "Pusat Bantuan"],
            ]}
          />
          {/* full page load so the intro script on the homepage runs */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/?intro=1" className="mt-2 block text-sm text-white/75 transition hover:text-white">
            ▶ Putar intro VocAZ
          </a>
          <div className="mt-5 flex gap-2">
            {[Mail, Phone, Globe, Link2].map((I, i) => (
              <span key={i} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/75 ring-1 ring-white/15">
                <I className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/70 sm:flex-row">
          <p>© {new Date().getFullYear()} VocAZ — Vocational Career A-Z. All rights reserved.</p>
          <p>Dibuat untuk JHIC 2.0 · Hosted on Jagoan Hosting</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 font-bold text-white">{title}</p>
      <ul className="space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-white/75 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
