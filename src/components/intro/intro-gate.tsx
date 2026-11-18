"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { BACKDROP_CLS, BOTTOM_CLS, FIRST_LABEL, FIRST_TEXT, FirstTitle, GRID_CLS, IntroLogo, SKIP_CLS, SceneLabel, SceneTitle, TEXT_CLS, TOP_CLS } from "./intro-copy";

// The intro (scenes + animations) is only downloaded when it is actually going to be shown.
const IntroStory = dynamic(() => import("./intro-story"), { ssr: false });

/**
 * Server-renders a static curtain (visible only when the inline script set
 * `<html data-intro>` before paint, so there is no flash of the homepage), then
 * lazily mounts the real intro on top of it. The curtain mirrors the intro's
 * layout and already shows the first headline, so it is the LCP and paints
 * with the HTML instead of waiting for JavaScript.
 */
export function IntroGate() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(document.documentElement.dataset.intro === "1");
  }, []);
  return (
    <>
      <div aria-hidden className="vocaz-intro fixed inset-0 z-[199] flex flex-col overflow-hidden bg-[#061c1a] text-white">
        <div className="bg-dots-light absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)]" />
        <div className={BACKDROP_CLS} />
        <div className={TOP_CLS}>
          <IntroLogo />
          {/* keeps the row as tall as the real one */}
          <span className={`${SKIP_CLS} invisible`}>Lewati intro</span>
        </div>
        <div className="relative flex flex-1 items-center">
          <div className={GRID_CLS}>
            <div className="lg:order-2">
              <SceneLabel n={1}>{FIRST_LABEL}</SceneLabel>
              <SceneTitle as="p">
                <FirstTitle />
              </SceneTitle>
              {/* reserves the description's height so the headline does not jump when the intro takes over */}
              <p className={`${TEXT_CLS} invisible`}>{FIRST_TEXT}</p>
            </div>
            {/* placeholder with the Stage's footprint so the headline sits where the intro will put it */}
            <div className="aspect-[4/5] w-full sm:aspect-[16/11] lg:order-1" />
          </div>
        </div>
        {/* same height as the dots bar + "jangan tampilkan lagi" link */}
        <div className={`${BOTTOM_CLS} invisible`}>
          <span className="h-[50px]" />
          <span className="text-xs">&nbsp;</span>
        </div>
      </div>
      {show && <IntroStory />}
    </>
  );
}
