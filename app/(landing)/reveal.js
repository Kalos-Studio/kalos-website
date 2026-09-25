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
 * ends. At 48 the aspect error between samples is well under a pixel.
 *
 * The frame's top edge is never animated. It is the top of this section, in
 * flow, so it scrolls with the page exactly as the hero's type does and the
 * gap under Book a call stays what it was drawn at. What grows is the width,
 * and the height, which is held down to the bottom of the window the whole way
 * so no white ever shows underneath. Both rules together decide the timing:
 * the frame can only be full bleed when its top reaches the window's top, so
 * progress is scroll over the distance to that point. That is also where
 * `#case-<slug>` is centred and where the snap area in page.js stops covering
 * the window -- free scrolling ends exactly at full bleed, and scrolling back
 * up retraces the same poses into the inset frame it started from.
 *
 * It used to pin the stage with sticky for a window's worth of scroll and grow
 * inside it. The frame then rose more slowly than the page, so the gap under
 * the button opened up as you scrolled, and it could reach the top of the
 * window while still inset.
 *
 * `#case-<slug>` carries no snap alignment of its own; the wrapper in page.js
 * does the snapping. It is a separate block because paged-scroll.js,
 * HashTarget and check-scroll.mjs look it up by id.
 */

// How far the picture starts zoomed in, relative to just covering the frame.
const ZOOM = 1.35;

// The inset frame at rest on the hero, as a share of the window's width. The
// wireframe draws it at 278 of 460, about 60%, at the photograph's own 16:10.
const INSET = { lg: 0.6, sm: 0.88 };
const ASPECT = 1.6;

// The inset frame's corner radius, as a share of its width, easing to square
// at full bleed (rounded corners on the window's own edges read as a gap).
// Set against the mark at hero size: its corners are soft rather than round,
// about a twelfth of the diamond's width, and at that ratio a 60% frame came
// out bubbly. A third of it sits with the mark rather than competing with it.
const RADIUS = 0.028;

const STEPS = 48;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

// The frame and picture transforms at scroll position `s`. Both origins are
// the top left, so each transform reads as "put the top left here, then
// scale".
//
// Worked out in *window* coordinates and converted to the stage's, because
// the rule is about the window: the frame starts exactly where it sits under
// the hero, its top edge rises from there to the top of the window, and its
// bottom edge never comes above the bottom of the window. The first version
// was worked out in the stage's coordinates -- the stage rode up with the page
// and the frame grew from its top -- so the inset frame reached the top of the
// window while it was still inset, with white showing underneath it.
//
// `g` is the geometry measured once per layout: the stage's size, where the
// stage starts in the document (which is also the frame's starting top in the
// window, at scroll 0), and the scroll at which the expansion completes.
function pose(s, g) {
  const { W, H, start, end } = g;
  const p = clamp01(s / end);

  const w0 = W * (W >= 1024 ? INSET.lg : INSET.sm);
  const h0 = w0 / ASPECT;

  // In the window. The height is at least whatever reaches the window's
  // bottom edge, so there is never a gap below the frame.
  const top = lerp(start, 0, p);
  const w = lerp(w0, W, p);
  const h = Math.max(lerp(h0, H, p), H - top);
  const x = (W - w) / 2;

  // Into the stage, which is in flow and scrolls with the page. With the end
  // where it is, `top` and `stageTop` are the same line and y is 0 -- the
  // frame's top edge is the section's -- but the conversion stays so the rule
  // is stated in window terms.
  const stageTop = Math.max(start - s, 0);
  const y = top - stageTop;

  const sx = w / W;
  const sy = h / H;

  // The picture's size on screen: just covering the frame, times the zoom.
  const k = Math.max(sx, sy) * lerp(ZOOM, 1, p);
  // In the frame's scaled coordinates, centred on it.
  const a = k / sx;
  const b = k / sy;
  const u = (w / 2 - (k * W) / 2) / sx;
  const v = (h / 2 - (k * H) / 2) / sy;

  // The frame is scaled non-uniformly, and its radius is scaled with it, so
  // the radius is given per axis in its own coordinates to come out round.
  const r = lerp(w0 * RADIUS, 0, p);

  return {
    frame: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`,
    radius: `${r / sx}px / ${r / sy}px`,
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

    const geometry = () => {
      const r = stop.getBoundingClientRect();
      const section = stage.parentElement.getBoundingClientRect();
      return {
        W: stage.clientWidth,
        H: stage.clientHeight,
        start: section.top + window.scrollY,
        // The scroll that centres the stop, i.e. the section filling the
        // window: see the note at the top of the file.
        end: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2,
      };
    };

    let animations = [];
    const clear = () => {
      animations.forEach((a) => a.cancel());
      animations = [];
      frame.style.transform = "";
      frame.style.borderRadius = "";
      image.style.transform = "";
    };

    // Compositor path. Keyframe offsets are fractions of the whole document's
    // scroll range, since that is what a ScrollTimeline on the root measures;
    // past the end the last pose simply holds.
    //
    // Sampled, because keyframes interpolate linearly and the pose is not
    // linear in scroll: the inverse scale is a quotient, and there are kinks
    // where the frame's bottom stops needing to be held down. `start` is
    // sampled exactly in case the end ever moves past it again.
    const build = () => {
      clear();
      if (reduced.matches) return;
      const g = geometry();
      const max = root.scrollHeight - root.clientHeight;
      if (g.end <= 0 || max <= 0) return;

      const scrolls = [];
      for (let i = 0; i <= STEPS; i++) scrolls.push((i / STEPS) * g.end);
      if (g.start > 0 && g.start < g.end) scrolls.push(g.start);
      scrolls.sort((a, b) => a - b);

      const frameFrames = [];
      const imageFrames = [];
      // The radius rides along with the frame's transform. It is not a
      // compositor property, so it is the one value here painted on the main
      // thread; a frame's lag on a corner a few pixels across is invisible,
      // where the same lag on the frame's edges was the stutter.
      for (const s of scrolls) {
        const { frame: f, radius, image: i } = pose(s, g);
        frameFrames.push({ offset: s / max, transform: f, borderRadius: radius });
        imageFrames.push({ offset: s / max, transform: i });
      }
      const last = pose(g.end, g);
      frameFrames.push({ offset: 1, transform: last.frame, borderRadius: last.radius });
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
      const g = geometry();
      if (g.end <= 0) return clear();
      const { frame: f, radius, image: i } = pose(window.scrollY, g);
      frame.style.transform = f;
      frame.style.borderRadius = radius;
      image.style.transform = i;
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
    // One window tall, in flow, on every width -- phones included, since the
    // whole point of this panel is the move. At full bleed a phone shows a
    // portrait crop of the collage, which holds up because it is a field of
    // cards rather than one picture with a subject to lose.
    //
    // `id="work"` because /work redirects to /#work.
    <section id="work" className="relative h-svh">
      <div ref={stageRef} className="relative h-full w-full overflow-hidden">
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

      {/* Where the expansion completes. See the note at the top of the file. */}
      <div
        ref={stopRef}
        id={`case-${cs.slug}`}
        className="pointer-events-none absolute inset-0"
      />
    </section>
  );
}
