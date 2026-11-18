"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATED_KEY } from "./back-button";

/** Thin top bar giving instant feedback after clicking an internal link */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const first = useRef(true);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // route committed → finish the bar
  useEffect(() => {
    // remember that this tab has in-app history, so the back button can use it (see back-button.tsx)
    if (first.current) first.current = false;
    else {
      try {
        sessionStorage.setItem(NAVIGATED_KEY, "1");
      } catch {}
    }
    clear();
    setWidth((w) => (w > 0 ? 100 : 0));
    timers.current.push(setTimeout(() => setVisible(false), 250), setTimeout(() => setWidth(0), 500));
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      clear();
      setVisible(true);
      setWidth(15);
      timers.current.push(
        setTimeout(() => setWidth(45), 150),
        setTimeout(() => setWidth(70), 600),
        setTimeout(() => setWidth(85), 1500),
        // safety: never hang forever
        setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, 15000),
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div aria-hidden data-nav-progress className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" style={{ opacity: visible ? 1 : 0, transition: "opacity .25s" }}>
      <div className="h-full bg-brand-600 shadow-[0_0_8px_var(--color-brand-400)]" style={{ transform: `scaleX(${width / 100})`, transformOrigin: "left", transition: "transform .35s ease-out" }} />
    </div>
  );
}
