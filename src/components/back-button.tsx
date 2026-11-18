"use client";

import Link from "@/components/link";
import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { parentPath } from "@/lib/back-path";
import { cn } from "@/lib/utils";

/** set by NavigationProgress after the first in-app navigation (fallback for browsers without the Navigation API) */
export const NAVIGATED_KEY = "vocaz:navigated";

function hasInAppHistory() {
  const nav = (window as { navigation?: { canGoBack?: boolean } }).navigation;
  if (typeof nav?.canGoBack === "boolean") return nav.canGoBack; // only counts same-origin entries
  try {
    return sessionStorage.getItem(NAVIGATED_KEY) === "1";
  } catch {
    return false;
  }
}

/** "Kembali": goes to the previous page when there is one, otherwise up to the parent section. */
export function BackButton({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  const router = useRouter();
  const parent = parentPath(usePathname());
  if (!parent) return null;
  return (
    <Link
      href={parent}
      data-back="1"
      aria-label="Kembali ke halaman sebelumnya"
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (hasInAppHistory()) {
          e.preventDefault();
          router.back();
        }
      }}
      className={cn("inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold text-body transition hover:bg-subtle hover:text-ink", className)}
    >
      <ArrowLeft className="h-5 w-5 shrink-0" />
      <span className={labelClassName}>Kembali</span>
    </Link>
  );
}
