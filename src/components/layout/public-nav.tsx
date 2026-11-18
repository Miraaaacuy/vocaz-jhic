"use client";

import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "../brand";
import { BackButton } from "../back-button";
import { ButtonLink } from "../ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/talenta", label: "Talenta SMK" },
  { href: "/showcase", label: "Video Showcase" },
  { href: "/lowongan", label: "Lowongan" },
  { href: "/perusahaan", label: "Perusahaan" },
  { href: "/tentang", label: "Tentang VocAZ" },
];

export function PublicNav({ dashboardHref, userName }: { dashboardHref?: string; userName?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="sticky top-0 z-40 h-[76px] px-3 pt-3 sm:px-4">
      <div className="mx-auto max-w-7xl rounded-[20px] border border-white/70 bg-white/80 shadow-[0_10px_30px_-14px_rgb(8_37_36/0.25)] ring-1 ring-line/60 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-6 pr-2 pl-4">
          <div className="flex items-center gap-1">
            {/* icon-only back arrow on every public page except the homepage */}
            <BackButton className="-ml-2 p-2" labelClassName="sr-only" />
            <Logo className="h-8" priority />
          </div>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  active(l.href) ? "bg-brand-50 text-brand-800" : "text-body hover:bg-subtle hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {dashboardHref ? (
              <ButtonLink href={dashboardHref} size="md">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
                {userName && <span className="hidden max-w-[120px] truncate font-normal opacity-80 xl:inline">· {userName}</span>}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" className="text-brand-800">
                  Masuk
                </ButtonLink>
                <ButtonLink href="/register">Daftar Gratis</ButtonLink>
              </>
            )}
          </div>
          <button className="rounded-xl p-2 text-ink lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <nav aria-label="Navigasi utama" className="flex flex-col border-t border-line px-3 py-3 lg:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn("rounded-xl px-3 py-2.5 text-sm font-semibold", active(l.href) ? "bg-brand-50 text-brand-800" : "text-body")}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
              {dashboardHref ? (
                <ButtonLink href={dashboardHref} className="col-span-2">
                  Buka Dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/login" variant="secondary">
                    Masuk
                  </ButtonLink>
                  <ButtonLink href="/register">Daftar</ButtonLink>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
