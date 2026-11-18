"use client";

import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  Briefcase,
  Building2,
  ChartColumn,
  ExternalLink,
  Flag,
  Handshake,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  School,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  Video,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { NAV } from "@/lib/nav";
import { BackButton } from "../back-button";
import { ROLE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo, SponsorStrip } from "../brand";
import { Avatar } from "../ui";

const ICONS = {
  home: Home,
  user: User,
  briefcase: Briefcase,
  video: Video,
  users: Users,
  message: MessageSquare,
  bell: Bell,
  settings: Settings,
  sparkles: Sparkles,
  building: Building2,
  shield: ShieldCheck,
  sliders: SlidersHorizontal,
  chart: ChartColumn,
  school: School,
  handshake: Handshake,
  award: Award,
  flag: Flag,
} as const;

export function DashboardShell({
  role,
  user,
  orgName,
  unread,
  unreadMessages,
  logout,
  children,
}: {
  role: Role;
  user: { name: string; avatarUrl?: string | null; email?: string | null };
  orgName?: string;
  unread: number;
  unreadMessages: number;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const base = NAV[role][0].items[0].href;

  const isActive = (href: string) => (href === base ? path === base : path === href || path.startsWith(href + "/"));
  // pick the most specific child match
  const childActive = (href: string, siblings: { href: string }[]) => {
    const best = siblings
      .filter((s) => path === s.href || path.startsWith(s.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return best?.href === href;
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo white className="h-9" href={base} />
        <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative mx-4 mb-5 overflow-hidden rounded-2xl bg-white/[0.07] px-3.5 py-3 text-white ring-1 ring-white/10">
        <div className="bg-dots-light absolute inset-0 opacity-50" />
        <div className="relative flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={orgName ?? user.name} size={36} className="ring-2 ring-accent-400/70" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-accent-200 uppercase">{ROLE_LABEL[role]}</p>
            <p className="truncate text-sm font-semibold">{orgName ?? user.name}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV[role].map((g, gi) => (
          <div key={gi}>
            {g.title && <p className="mb-1.5 px-3 text-[11px] font-bold tracking-wider text-white/55 uppercase">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = ICONS[it.icon as keyof typeof ICONS] ?? Home;
                const on = isActive(it.href);
                const badge = it.icon === "message" ? unreadMessages : it.icon === "bell" ? unread : 0;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        on
                          ? "bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-accent-400"
                          : "text-white/75 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px]", on ? "text-accent-300" : "text-white/55")} />
                      <span className="flex-1">{it.label}</span>
                      {badge > 0 && <span className="rounded-full bg-accent-600 px-1.5 text-[11px] font-bold text-white">{badge > 99 ? "99+" : badge}</span>}
                    </Link>
                    {it.children && on && (
                      <ul className="mt-1 mb-1 ml-[21px] space-y-0.5 border-l border-white/15 pl-3">
                        {it.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className={cn(
                                "block rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition",
                                childActive(c.href, it.children!) ? "bg-white/[0.12] font-semibold text-white" : "text-white/65 hover:text-white",
                              )}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/[0.06] hover:text-white">
          <ExternalLink className="h-[18px] w-[18px] text-white/55" /> Lihat Website
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white/75 hover:bg-red-500/15 hover:text-red-200">
            <LogOut className="h-[18px] w-[18px] text-white/55" /> Keluar
          </button>
        </form>
      </div>
    </div>
  );

  const notifHref = NAV[role].flatMap((g) => g.items).find((i) => i.icon === "bell")?.href;
  const msgHref = NAV[role].flatMap((g) => g.items).find((i) => i.icon === "message")?.href;
  const settingsHref = NAV[role].flatMap((g) => g.items).find((i) => i.icon === "settings")?.href;

  return (
    <div className="dash-bg min-h-screen">
      {/* deep-green rail: gives the dashboards a strong frame instead of white-on-white */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-brand-950 bg-[radial-gradient(20rem_16rem_at_0%_0%,rgb(34_144_133/0.38),transparent_70%),radial-gradient(18rem_14rem_at_100%_100%,rgb(242_92_18/0.14),transparent_70%)] lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="animate-fade-in absolute inset-y-0 left-0 w-72 bg-brand-950 bg-[radial-gradient(20rem_16rem_at_0%_0%,rgb(34_144_133/0.38),transparent_70%),radial-gradient(18rem_14rem_at_100%_100%,rgb(242_92_18/0.14),transparent_70%)] shadow-xl">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/70 bg-white/75 px-4 backdrop-blur-md sm:px-6">
          <button className="rounded-lg p-2 text-ink lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          {/* shown on every page except the role dashboard itself */}
          <BackButton className="-ml-1 px-2.5 py-2" labelClassName="hidden sm:inline" />
          <div className="flex-1" />
          {msgHref && (
            <TopIcon href={msgHref} count={unreadMessages} label="Pesan">
              <MessageSquare className="h-5 w-5" />
            </TopIcon>
          )}
          {notifHref && (
            <TopIcon href={notifHref} count={unread} label="Notifikasi">
              <Bell className="h-5 w-5" />
            </TopIcon>
          )}
          <div className="mx-1 h-8 w-px bg-line" />
          <Link href={settingsHref ?? "#"} className="flex items-center gap-3 rounded-xl px-1.5 py-1 hover:bg-subtle">
            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-semibold leading-tight text-ink">{orgName ?? user.name}</p>
              <p className="text-xs text-muted">{orgName ? user.name : ROLE_LABEL[role]}</p>
            </div>
            <Avatar src={user.avatarUrl} name={orgName ?? user.name} size={36} className="ring-2 ring-brand-100" />
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* grid items may shrink below their content (long truncated rows, charts) → no sideways scroll on phones */}
          <div className="mx-auto max-w-7xl animate-fade-in [&_.grid>*]:min-w-0">{children}</div>
        </main>
        <footer className="border-t border-line/70 bg-surface px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
            <p className="text-xs text-muted">© {new Date().getFullYear()} VocAZ · Vocational Career A-Z</p>
            <SponsorStrip compact className="gap-x-5" />
          </div>
        </footer>
      </div>
    </div>
  );
}

function TopIcon({ href, count, label, children }: { href: string; count: number; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative rounded-xl p-2 text-body transition hover:bg-brand-50 hover:text-brand-700" aria-label={label}>
      {children}
      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
