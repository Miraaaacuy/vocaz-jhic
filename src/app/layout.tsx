import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { NavigationProgress } from "@/components/navigation-progress";
import { WhatsAppCS } from "@/components/whatsapp-cs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
  title: { default: "VocAZ — Vocational Career A-Z", template: "%s · VocAZ" },
  description:
    "VocAZ menghubungkan talenta SMK terverifikasi dengan industri. Bangun profil, tunjukkan kompetensi lewat video showcase, dan temukan peluang karier.",
  openGraph: { title: "VocAZ — Vocational Career A-Z", description: "Temukan Pekerjaan. Tunjukkan Kompetensi.", images: ["/brand/og-logo.png"] },
};

export const viewport: Viewport = { themeColor: "#1a7370" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // self-hosted font (see globals.css) — next/font left its preload manifest empty in production builds
  preload("/fonts/jakarta-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <WhatsAppCS />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
