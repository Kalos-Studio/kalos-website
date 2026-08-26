"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { isCoarsePointer } from "./device";

// The renderer is ~250-300KB gzipped and already loaded once for the hero, but
// a second WebGL context is a second per-frame cost, so this one is not created
// until the section it belongs to is close to view.
const MarkTurning = dynamic(() => import("./mark-turning"), { ssr: false });

/**
 * The slot beside the dictionary entry: the turning mark where it can afford to
 * be, the sand plate where it cannot.
 *
 * `sharesPageWithHero` is the whole of that judgement. On a coarse pointer this
 * used to stay a photograph unconditionally, and the reason was never the phone
 * on its own: it was that a phone showing this section was already running one
 * WebGL context for the hero above it, and a second live context is the single
 * most expensive thing on that page — for an object that is decoration beside
 * body copy rather than the thing anyone came for.
 *
 * That is still true of a page with a hero, so it stays the default. It is not
 * true of /about, which has no hero and where this mark is the only 3D on the
 * route and the object the page is built around. There the fallback was actively
 * worse than the cost it avoided: a rounded photograph of black sand, centred at
 * the size of a crest, on top of a page whose ground is generated black sand. A
 * picture of the wall it is hanging on, which is the same reason the plate came
 * off the homepage.
 */
export default function MarkSlot({ sharesPageWithHero = true }) {
  const box = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if ((sharesPageWithHero && isCoarsePointer()) || !box.current) return;
    // rootMargin, so the context is created and the first frame is drawn before
    // the reader arrives rather than in front of them.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(box.current);
    return () => io.disconnect();
  }, [sharesPageWithHero]);

  return (
    <div className="ln-sand" ref={box}>
      {live ? (
        <MarkTurning />
      ) : (
        <Image
          src="/home/gold-sand.webp"
          alt="Black sand in shallow focus, scattered with grains of gold"
          width={900}
          height={795}
          sizes="(min-width: 860px) 480px, 100vw"
        />
      )}
    </div>
  );
}
