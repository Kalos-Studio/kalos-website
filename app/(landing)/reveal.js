"use client";

import { useEffect, useRef } from "react";
import CoverImage from "../work/CoverImage";
import ViewTransitionLink from "../view-transition-link";

/**
 * The first case study, which opens as an inset picture peeking over the fold
 * and grows to full bleed as the page scrolls -- the Venice / Collins move.
 *
 * Two things happen at once and both are needed for it to read that way:
 *
 *   - The frame grows, from a centred inset to the whole window. That is a
 *     `clip-path` on a box that is full bleed the entire time, so layout never
 *     changes and nothing below it moves.
 *   - The picture inside zooms *out* while the frame grows. It starts at
 *     ZOOM times the size that would just cover the frame and settles at
 *     exactly covering it. Without this the frame simply uncovers more of a
 *     still image, which reads as a window opening rather than as the image
 *     arriving.
 *
 * Progress is scroll position over the distance from the top of the page to
 * this study's own snap stop, so the expansion is complete exactly where the
 * page comes to rest on it and nothing is tuned by eye. With mandatory snapping
 * one flick from the hero plays the whole thing across the glide.
 *
 * The snap stop is its own element (`#case-<slug>`) at the foot of the section
 * rather than the sticky stage. A sticky element's snap position is resolved
 * against where it is stuck, which moves with the scroll it is trying to
 * resolve; an ordinary block at the end of the runway has one position. It is
 * also what paged-scroll.js, HashTarget and check-scroll.mjs already look for.
 */

// How far the picture starts zoomed in, relative to just covering the frame.
const ZOOM = 1.35;

// The inset frame at rest on the hero, as a share of the window's width. The
// wireframe draws it at 278 of 460, about 60%, at the photograph's own 16:10.
const INSET = { lg: 0.6, sm: 0.88 };
const ASPECT = 1.6;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

export default function Reveal({ cs }) {
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const stopRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const stop = stopRef.current;
    if (!stage || !frame || !stop) return;

    const img = () => frame.querySelector("img");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    const draw = () => {
      raf = 0;
      const W = stage.clientWidth;
      const H = stage.clientHeight;

      // Where this study's stop is: the scroll position that centres it.
      const r = stop.getBoundingClientRect();
      const end = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
      const p = reduced.matches || end <= 0 ? 1 : clamp01(window.scrollY / end);

      // The frame, from inset to full. Top-aligned on a wide window, the way the
      // wireframe sits it under the hero; centred where the stage is only as
      // tall as the picture, since there is no room above it to speak of.
      const w0 = W * (W >= 1024 ? INSET.lg : INSET.sm);
      const h0 = Math.min(w0 / ASPECT, H);
      const y0 = W >= 1024 ? 0 : (H - h0) / 2;
      const w = lerp(w0, W, p);
      const h = lerp(h0, H, p);
      const x = (W - w) / 2;
      const y = lerp(y0, 0, p);

      frame.style.clipPath = `inset(${y}px ${W - x - w}px ${H - y - h}px ${x}px)`;

      // The picture fills the stage at scale 1. Scale it to cover the frame,
      // times the zoom, and put its centre on the frame's.
      const k = Math.max(w / W, h / H) * lerp(ZOOM, 1, p);
      const tx = x + w / 2 - (k * W) / 2;
      const ty = y + h / 2 - (k * H) / 2;
      const el = img();
      if (el) {
        el.style.transformOrigin = "0 0";
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${k})`;
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    // next/image swaps the <img> in once hydrated; draw again when it lands so
    // the first frame is not the unscaled picture.
    const observer = new MutationObserver(schedule);
    observer.observe(frame, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
      observer.disconnect();
    };
  }, []);

  const vtName = `cover-${cs.slug}`;

  return (
    // The runway. On a wide window the stage is a full viewport held by sticky
    // for one extra view, which is the scroll the expansion plays across. Below
    // lg the panels are 16:9 strips rather than full windows (a landscape
    // picture cropped to a portrait phone loses everything that makes it this
    // picture), so the stage is one of those strips and does not stick.
    <section className="relative h-[56.25vw] lg:h-[200svh]">
      <div ref={stageRef} className="relative h-full w-full overflow-hidden lg:sticky lg:top-0 lg:h-svh">
        <ViewTransitionLink
          href={`/work/${cs.slug}`}
          vtName={vtName}
          aria-label={cs.title}
          className="block h-full w-full"
        >
          <CoverImage
            cover={cs.cover}
            className="absolute inset-0 overflow-hidden will-change-[clip-path]"
            imageClassName="object-cover will-change-transform"
            sizes="100vw"
            priority
            containerProps={{
              ref: frameRef,
              style: { viewTransitionName: vtName },
              "data-vt-cover": "",
              "data-vt-target": vtName,
            }}
          />
        </ViewTransitionLink>
      </div>

      {/* The snap stop. See the note at the top of the file. */}
      <div
        ref={stopRef}
        id={`case-${cs.slug}`}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-full snap-always snap-center lg:h-svh"
      />
    </section>
  );
}
