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
 * On a coarse pointer this stays a photograph. A phone is already running one
 * WebGL context for the hero, and a second one live at the same time is the
 * single most expensive thing in this page — for an object that is decoration
 * beside body copy, not the thing anyone came for. Worth revisiting with a real
 * device in hand rather than by assertion; the switch is this one condition.
 */
export default function MarkSlot() {
  const box = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (isCoarsePointer() || !box.current) return;
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
  }, []);

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
