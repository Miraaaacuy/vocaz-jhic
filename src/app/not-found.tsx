import { Logo, SponsorStrip } from "@/components/brand";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 text-center">
      <Logo className="h-12" />
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <div>
        <h1 className="text-2xl font-bold text-ink">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-muted">Halaman yang kamu cari mungkin sudah dipindahkan atau tidak tersedia.</p>
      </div>
      <ButtonLink href="/">Kembali ke Beranda</ButtonLink>
      <SponsorStrip compact className="mt-8" />
    </div>
  );
}
