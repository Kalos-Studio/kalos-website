"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import CoverImage from "../work/CoverImage";
import ViewTransitionLink from "../view-transition-link";

/**
 * The work, on one full-window stage.
 *
 * Two movements, one after the other, on the same stage:
 *
 *   1. THE REVEAL. The first study opens as an inset picture peeking over the
 *      fold and grows to full bleed as the page scrolls -- the Venice / Collins
 *      move. Most of this note is about it.
 *   2. THE FADES. Once it is full bleed the stage pins, and every study after
 *      it fades in over the one before, settling from a slight zoom, one per
 *      snap stop.
 *
 * Why the second is a fade on a pinned stage rather than panels scrolling past.
 * The panels were full-bleed blocks stacked down the page, and unless the
 * window was exactly the picture's shape you saw the one above or below at the
 * edges -- and between two stops you always saw the edge between two pictures
 * sliding past. A pinned stage is exactly one window whatever the window is,
 * so there are no neighbours to see, and a fade has no edge.
 *
 * The fit rule for those covers, since the stage is whatever shape the window
 * is: on a landscape window (5:4 and wider) the cover fills it, cropped around
 * its `cardPosition`. On anything narrower -- a phone, a portrait tablet -- a
 * crop would keep a third of a 16:9 picture and cut Priority's headline in
 * half, so the whole picture is shown instead, over a blurred, enlarged copy of
 * itself that fills the window. Full bleed either way, and nothing important
 * is ever cut. A CSS media query decides, so there is no measuring.
 *
 * The first study (the reveal):
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
 * The first study's `#case-<slug>` carries no snap alignment of its own; the
 * snap area in page.js does the snapping. It is a separate block because
 * paged-scroll.js, HashTarget and check-scroll.mjs look it up by id.
 *
 * The rest (the fades):
 *
 * The stage is sticky, so it scrolls in flow until its top reaches the window's
 * -- which is exactly when the reveal completes, so the reveal never knew the
 * difference -- and then holds for one window per study after the first. Each
 * of those studies has its own `#case-<slug>` stop block, a window tall, laid
 * down the runway in order, and its layer fades in across the scroll from the
 * stop before it to its own. Same compositor path as the reveal: opacity and
 * transform on a ScrollTimeline.
 *
 * Only the layer on top may be clicked. They are stacked, so an invisible layer
 * above the visible one would take its clicks; the others are `inert`, set from
 * a scroll listener that only acts when the current study changes. That is the
 * one thing here decided on the main thread, and it is not visual.
 */

// The zoom a fading-in cover settles from.
const SETTLE_ZOOM = 1.06;

// Landscape enough to crop to fill is `[@media(min-aspect-ratio:5/4)]:`, see
// the fit rule above. Written out in full in each class list rather than kept
// in a constant: Tailwind finds classes by scanning the source for them, so a
// class assembled from a variable at runtime is never generated. That shipped
// once here, and every cover showed whole on a laptop with blurred bands.

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

export default function Stage({ first, rest }) {
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const stopRef = useRef(null);
  const layerRefs = useRef([]);
  const layerStopRefs = useRef([]);
  const hitRefs = useRef([]);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const stop = stopRef.current;
    const image = frame?.querySelector("img");
    const layers = layerRefs.current.slice(0, rest.length);
    const layerStops = layerStopRefs.current.slice(0, rest.length);
    const hits = hitRefs.current.slice(0, rest.length + 1);
    if (!stage || !frame || !stop || !image) return;
    if (layers.some((l) => !l) || layerStops.some((l) => !l)) return;

    frame.style.transformOrigin = "0 0";
    image.style.transformOrigin = "0 0";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const compositor = typeof window.ScrollTimeline === "function";

    const geometry = () => {
      const r = stop.getBoundingClientRect();
      const section = stage.parentElement.getBoundingClientRect();
      const end = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
      return {
        W: stage.clientWidth,
        H: stage.clientHeight,
        start: section.top + window.scrollY,
        // The scroll that centres the stop, i.e. the section filling the
        // window: see the note at the top of the file.
        end,
        // Each later study's stop, and so the scroll range its fade plays
        // across: from the stop before it to its own.
        fades: layerStops.map((el, i, all) => {
          const at = el.getBoundingClientRect().top + window.scrollY;
          const from =
            i === 0 ? end : all[i - 1].getBoundingClientRect().top + window.scrollY;
          return { from, to: at };
        }),
      };
    };

    // A layer's opacity and zoom at scroll s.
    const fadeAt = (s, { from, to }, still) => {
      const t = clamp01((s - from) / (to - from));
      const z = still ? 1 : lerp(SETTLE_ZOOM, 1, t);
      return { opacity: t, transform: `scale(${z})` };
    };

    let animations = [];
    const clear = () => {
      animations.forEach((a) => a.cancel());
      animations = [];
      frame.style.transform = "";
      frame.style.borderRadius = "";
      image.style.transform = "";
      for (const layer of layers) {
        layer.style.opacity = "";
        layer.style.transform = "";
      }
    };

    // Compositor path. Keyframe offsets are fractions of the whole document's
    // scroll range, since that is what a ScrollTimeline on the root measures;
    // past the end the last pose simply holds.
    //
    // Sampled, because keyframes interpolate linearly and the pose is not
    // linear in scroll: the inverse scale is a quotient, and there are kinks
    // where the frame's bottom stops needing to be held down. `start` is
    // sampled exactly in case the end ever moves past it again.
    //
    // Under reduced motion the reveal is left at full bleed and the fades lose
    // their zoom, but the fades stay: which study is showing is content, not
    // motion, and without them the stage would only ever show the first.
    const build = () => {
      clear();
      const g = geometry();
      const max = root.scrollHeight - root.clientHeight;
      if (g.end <= 0 || max <= 0) return;
      const timeline = new window.ScrollTimeline({ source: root, axis: "block" });
      const options = { timeline, fill: "both", easing: "linear" };

      if (!reduced.matches) {
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

        animations.push(
          frame.animate(frameFrames, options),
          image.animate(imageFrames, options),
        );
      }

      // Explicit ends at 0 and 1, because a keyframe list that starts past
      // offset 0 interpolates from the element's own style before it -- which
      // for the transform is no zoom, so the layer would zoom *in* on the way
      // to its fade and back out again.
      layers.forEach((layer, i) => {
        const range = g.fades[i];
        const still = reduced.matches;
        const a = fadeAt(range.from, range, still);
        const b = fadeAt(range.to, range, still);
        animations.push(
          layer.animate(
            [
              { offset: 0, ...a },
              { offset: range.from / max, ...a },
              { offset: range.to / max, ...b },
              { offset: 1, ...b },
            ],
            options,
          ),
        );
      });
    };

    // Fallback path, for browsers without ScrollTimeline.
    let raf = 0;
    const draw = () => {
      raf = 0;
      const g = geometry();
      if (g.end <= 0) return clear();
      const s = window.scrollY;
      if (reduced.matches) {
        frame.style.transform = "";
        frame.style.borderRadius = "";
        image.style.transform = "";
      } else {
        const { frame: f, radius, image: i } = pose(s, g);
        frame.style.transform = f;
        frame.style.borderRadius = radius;
        image.style.transform = i;
      }
      layers.forEach((layer, i) => {
        const { opacity, transform } = fadeAt(s, g.fades[i], reduced.matches);
        layer.style.opacity = String(opacity);
        layer.style.transform = transform;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // Which study is on top, so only it can be clicked or focused. The study
    // whose stop is nearest the current scroll: past the midpoint of a fade the
    // incoming picture is the one mostly showing.
    let current = -1;
    const pick = () => {
      const g = geometry();
      const s = window.scrollY;
      const stops = [g.end, ...g.fades.map((f) => f.to)];
      let best = 0;
      stops.forEach((at, i) => {
        if (Math.abs(at - s) < Math.abs(stops[best] - s)) best = i;
      });
      if (best === current) return;
      current = best;
      hits.forEach((el, i) => {
        if (el) el.inert = i !== best;
      });
    };

    const refresh = () => {
      if (compositor) build();
      else schedule();
      pick();
    };
    const onScroll = () => {
      if (!compositor) schedule();
      pick();
    };

    refresh();
    // Anything that changes the stage or the document's length moves the
    // offsets: a resize, the font landing, an image above settling.
    const resize = new ResizeObserver(refresh);
    resize.observe(stage);
    resize.observe(document.body);
    reduced.addEventListener("change", refresh);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      reduced.removeEventListener("change", refresh);
      window.removeEventListener("scroll", onScroll);
      clear();
    };
  }, [rest.length]);

  const firstName = `cover-${first.slug}`;

  return (
    // One window for the reveal plus one per later study -- the stage is held
    // for all of those after the first. In flow until then, so the reveal's
    // frame scrolls up with the page exactly as it did.
    //
    // `id="work"` because /work redirects to /#work.
    <section
      id="work"
      className="relative"
      style={{ height: `${(1 + rest.length) * 100}svh` }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-svh w-full overflow-hidden"
      >
        {/* The first study, in the reveal. No ground on the stage: around the
            inset frame it is the page's own white showing through. */}
        <div ref={(el) => {
            hitRefs.current[0] = el;
          }} className="absolute inset-0">
          <ViewTransitionLink
            href={`/work/${first.slug}`}
            vtName={firstName}
            aria-label={first.title}
            className="block h-full w-full"
          >
            <CoverImage
              cover={first.cover}
              className="absolute inset-0 overflow-hidden will-change-transform"
              imageClassName="object-cover will-change-transform"
              sizes="100vw"
              priority
              containerProps={{
                ref: frameRef,
                style: { viewTransitionName: firstName },
                "data-vt-cover": "",
                "data-vt-target": firstName,
                "data-vt-stop": `case-${first.slug}`,
              }}
            />
          </ViewTransitionLink>
        </div>

        {rest.map((cs, i) => {
          const cover = { ...cs.cover, ...cs.landingCover };
          const vtName = `cover-${cs.slug}`;
          return (
            // The layer is what fades and zooms. Starts transparent, so a
            // study is never flashed before the script has placed it.
            <div
              key={cs.slug}
              ref={(el) => {
                layerRefs.current[i] = el;
                hitRefs.current[i + 1] = el;
              }}
              className="absolute inset-0 opacity-0 will-change-[opacity,transform]"
            >
              <ViewTransitionLink
                href={`/work/${cs.slug}`}
                vtName={vtName}
                aria-label={cs.title}
                className="absolute inset-0 block"
              >
                {/* The ambient ground for a narrow window: the same picture,
                    enlarged, blurred and dimmed, filling what the whole picture
                    in front of it does not. Hidden where the cover fills the
                    window by itself. Decorative, so no alt; the request is
                    shared with the cover in front, same file, same sizes. */}
                {cover.src && (
                  <Image
                    src={cover.src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    className="scale-125 object-cover blur-3xl brightness-75 saturate-150 [@media(min-aspect-ratio:5/4)]:hidden"
                  />
                )}
                <CoverImage
                  cover={cover}
                  className="absolute inset-0"
                  imageClassName="object-contain [@media(min-aspect-ratio:5/4)]:object-cover"
                  objectPosition={cover.cardPosition}
                  sizes="100vw"
                  containerProps={{
                    style: { viewTransitionName: vtName },
                    "data-vt-cover": "",
                    "data-vt-target": vtName,
                    "data-vt-stop": `case-${cs.slug}`,
                  }}
                />
              </ViewTransitionLink>
            </div>
          );
        })}
      </div>

      {/* Where the reveal completes. See the note at the top of the file. */}
      <div
        ref={stopRef}
        id={`case-${first.slug}`}
        className="pointer-events-none absolute inset-x-0 top-0 h-svh"
      />

      {/* One stop per later study, a window apart down the runway. snap-start,
          which for a block the window's height is also its centre. */}
      {rest.map((cs, i) => (
        <div
          key={cs.slug}
          ref={(el) => {
            layerStopRefs.current[i] = el;
          }}
          id={`case-${cs.slug}`}
          className="pointer-events-none absolute inset-x-0 h-svh snap-always snap-start"
          style={{ top: `${(i + 1) * 100}svh` }}
        />
      ))}
    </section>
  );
}
