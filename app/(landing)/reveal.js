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
 *   - The frame grows, from a centred inset to the whole window.
 *   - The picture inside zooms *out* while the frame grows. It starts at
 *     ZOOM times the size that would just cover the frame and settles at
 *     exactly covering it. Without this the frame simply uncovers more of a
 *     still image, which reads as a window opening rather than as the image
 *     arriving.
 *
 * **Both are transforms, and both run on the compositor.** The first version
 * grew the frame with `clip-path` and wrote both values from a scroll listener
 * in requestAnimationFrame. That stuttered, for two reasons:
 *
 *   - clip-path is a repaint of a full-window photograph on every frame.
 *   - Scrolling happens on the compositor; a scroll listener hears about it a
 *     frame later on the main thread. The sticky stage moved in step with the
 *     scroll and the picture inside it arrived one frame behind, so it swam.
 *
 * So the frame is scaled instead (non-uniformly, sx by sy, with overflow
 * hidden, which clips in its own scaled coordinates) and the picture carries
 * the inverse of that times the zoom, so it keeps its aspect. And both are Web
 * Animations on a ScrollTimeline, which Chrome and Safari run on the
 * compositor off the scroll position itself: no listener, no main thread, no
 * lag. A browser without ScrollTimeline gets the same numbers written per
 * frame, which is the old behaviour and an acceptable floor.
 *
 * The inverse scale is not linear in progress, and keyframes interpolate
 * linearly, so the curve is sampled at STEPS points rather than given as two
 * ends. At 32 the aspect error between samples is well under a pixel.
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

const STEPS = 32;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

// The frame and picture transforms at progress p, for a W x H stage. Both
// origins are the top left, so each transform reads as "put the top left here,
// then scale".
function pose(p, W, H) {
  const w0 = W * (W >= 1024 ? INSET.lg : INSET.sm);
  const h0 = Math.min(w0 / ASPECT, H);
  // Top-aligned on a wide window, the way the wireframe sits it under the
  // hero; centred where the stage is only as tall as the picture.
  const y0 = W >= 1024 ? 0 : (H - h0) / 2;

  const w = lerp(w0, W, p);
  const h = lerp(h0, H, p);
  const x = (W - w) / 2;
  const y = lerp(y0, 0, p);
  const sx = w / W;
  const sy = h / H;

  // The picture's size on screen: just covering the frame, times the zoom.
  const k = Math.max(sx, sy) * lerp(ZOOM, 1, p);
  // In the frame's scaled coordinates, centred on it.
  const a = k / sx;
  const b = k / sy;
  const u = (w / 2 - (k * W) / 2) / sx;
  const v = (h / 2 - (k * H) / 2) / sy;

  return {
    frame: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`,
    image: `translate(${u}px, ${v}px) scale(${a}, ${b})`,
  };
}

export default function Reveal({ cs }) {
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const stopRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const stop = stopRef.current;
    const image = frame?.querySelector("img");
    if (!stage || !frame || !stop || !image) return;

    frame.style.transformOrigin = "0 0";
    image.style.transformOrigin = "0 0";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const compositor = typeof window.ScrollTimeline === "function";

    // Where this study's stop is: the scroll position that centres it.
    const endOf = () => {
      const r = stop.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
    };

    let animations = [];
    const clear = () => {
      animations.forEach((a) => a.cancel());
      animations = [];
      frame.style.transform = "";
      image.style.transform = "";
    };

    // Compositor path. Keyframe offsets are fractions of the whole document's
    // scroll range, since that is what a ScrollTimeline on the root measures;
    // past this study's stop the last pose simply holds.
    const build = () => {
      clear();
      if (reduced.matches) return;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const end = endOf();
      const max = root.scrollHeight - root.clientHeight;
      if (end <= 0 || max <= 0) return;

      const frameFrames = [];
      const imageFrames = [];
      for (let i = 0; i <= STEPS; i++) {
        const p = i / STEPS;
        const offset = (p * end) / max;
        const { frame: f, image: g } = pose(p, W, H);
        frameFrames.push({ offset, transform: f });
        imageFrames.push({ offset, transform: g });
      }
      const last = pose(1, W, H);
      frameFrames.push({ offset: 1, transform: last.frame });
      imageFrames.push({ offset: 1, transform: last.image });

      const timeline = new window.ScrollTimeline({ source: root, axis: "block" });
      const options = { timeline, fill: "both", easing: "linear" };
      animations = [
        frame.animate(frameFrames, options),
        image.animate(imageFrames, options),
      ];
    };

    // Fallback path, for browsers without ScrollTimeline.
    let raf = 0;
    const draw = () => {
      raf = 0;
      if (reduced.matches) return clear();
      const end = endOf();
      const p = end <= 0 ? 1 : clamp01(window.scrollY / end);
      const { frame: f, image: g } = pose(p, stage.clientWidth, stage.clientHeight);
      frame.style.transform = f;
      image.style.transform = g;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const refresh = compositor ? build : schedule;
    refresh();
    // Anything that changes the stage or the document's length moves the
    // offsets: a resize, the font landing, an image above settling.
    const resize = new ResizeObserver(refresh);
    resize.observe(stage);
    resize.observe(document.body);
    reduced.addEventListener("change", refresh);
    if (!compositor) window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      reduced.removeEventListener("change", refresh);
      window.removeEventListener("scroll", schedule);
      clear();
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
            className="absolute inset-0 overflow-hidden will-change-transform"
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
