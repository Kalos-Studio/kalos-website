"use client";

import { useEffect, useRef } from "react";
import CoverImage from "../work/CoverImage";
import ViewTransitionLink from "../view-transition-link";

/**
 * The work: the first study grows out from under the hero, and every study
 * after it is a full-bleed panel that scrolls up and dissolves into the one
 * before it.
 *
 *   1. THE REVEAL. The first study opens as an inset picture peeking over the
 *      fold and grows to full bleed as the page scrolls -- the Venice / Collins
 *      move. Most of this note is about it.
 *   2. THE PANELS. Each later study is a full-bleed panel in flow, one snap
 *      stop each. Where two meet there is no edge: the lower panel's top is a
 *      soft gradient mask, and it overlaps the panel above by that much, so the
 *      boundary sliding up the window is one picture dissolving into the next.
 *
 * The panels are the version that shipped first, with the edge taken away. Two
 * replacements were built in between and cut: a pinned stage cross-fading
 * whole covers (a double exposure mid-fade, and a blurred copy of each cover
 * filling narrow windows), and sticky sheets receding into rounded cards (too
 * much ceremony). The dissolve keeps what was right about the panels -- the
 * page simply scrolls -- and removes the one thing wrong with them.
 *
 * The geometry of the dissolve. A panel is a window plus a fade zone above
 * and below it (FADE), and it overlaps the panel before by one fade zone. Its
 * own top fade is therefore laid over the previous panel's bottom zone, which
 * is picture, so the blend is picture into picture. And at rest -- snapped to
 * its centre -- the window shows exactly its middle: both fade zones sit just
 * outside the window, so every stop is one clean picture, full bleed. Two
 * zones rather than one is what that takes: with one, the next panel's fade
 * would reach into the bottom of the window at rest.
 *
 * The price is that a cover is cropped to fill a window and a half-zone more
 * than the window, so it is drawn a little larger. Every landing cover has its
 * subject centred with room around it for exactly this.
 *
 * The last panel fades out at its foot as well, into the page's white, which
 * is the closer's ground: the work ends on a dissolve, not a line.
 *
 * The fit: every cover is object-cover, full bleed, anchored at `cardPosition`
 * on a landscape window and `mobilePosition` on a narrow one (both in data.js,
 * both centre by default). A CSS media query picks, so nothing is measured.
 *
 * Nothing about the panels is scripted. The masks are static, so it is all
 * layout, and it works without JavaScript.
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
 * The stage is sticky, and its section is a fade zone taller than it, so once
 * the reveal completes it holds for exactly the scroll the next study's fade
 * takes to rise over it -- the blend always lands on picture, not on page.
 *
 */

// `[@media(min-aspect-ratio:5/4)]:` is a landscape window, where a cover is
// anchored at `cardPosition` rather than `mobilePosition`. Written out in full
// in each class list rather than kept in a constant: Tailwind finds classes by
// scanning the source for them, so a class assembled from a variable at
// runtime is never generated. That shipped once here. The fade zone's 12svh is
// written out in the classes below for the same reason, and must match FADE.

// The fade zone, where one panel dissolves into the next: 12% of the window.
// Enough that the boundary reads as a dissolve rather than a soft line, small
// enough that the extra crop it costs a cover stays modest.
//
// Eased rather than linear. A straight ramp shows a band where it starts and
// ends; these are smoothstep samples, so the blend has no visible start.
const FADE = "12svh";
const EASE = [
  [0, 0],
  [0.2, 0.1],
  [0.4, 0.35],
  [0.6, 0.65],
  [0.8, 0.9],
  [1, 1],
];
const rampIn = EASE.map(([t, a]) => `rgb(0 0 0 / ${a}) calc(${FADE} * ${t})`).join(", ");
const rampOut = [...EASE]
  .reverse()
  .map(([t, a]) => `rgb(0 0 0 / ${a}) calc(100% - ${FADE} * ${t})`)
  .join(", ");
// A panel's mask: transparent at its very top, solid from one zone down.
const MASK = `linear-gradient(to bottom, ${rampIn})`;
// The last panel's, which also dissolves out at its foot into the closer.
const MASK_LAST = `linear-gradient(to bottom, ${rampIn}, ${rampOut})`;

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

// What the browser should fetch for a cover. On a landscape window a panel
// is drawn about 1.3 windows wide once it is cropped to its fade zones. On a
// portrait one it is cropped to fill the height, which puts it at up to four
// times the window's width -- and `100vw` there fetched a file a quarter of
// the size it was drawn at, so every phone crop was soft.
const COVER_SIZES = "(max-aspect-ratio: 5/4) 400vw, 130vw";

export default function Stage({ first, rest }) {
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
        // The scroll that centres the stop, i.e. the stage filling the
        // window: see the note at the top of the file.
        end: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2,
      };
    };

    // The frame is invisible in the server's HTML and until the first pose
    // is on it. Without this, a reload painted the collage full bleed -- the
    // untransformed box -- and it snapped into its inset frame when the script
    // arrived. It fades in instead, once, in place.
    const reveal = () => {
      frame.style.opacity = "1";
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
      if (reduced.matches) return reveal();
      const g = geometry();
      const max = root.scrollHeight - root.clientHeight;
      if (g.end <= 0 || max <= 0) return reveal();

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
      reveal();
    };

    // Fallback path, for browsers without ScrollTimeline.
    let raf = 0;
    const draw = () => {
      raf = 0;
      const g = geometry();
      if (reduced.matches || g.end <= 0) {
        clear();
        return reveal();
      }
      const { frame: f, radius, image: i } = pose(window.scrollY, g);
      frame.style.transform = f;
      frame.style.borderRadius = radius;
      image.style.transform = i;
      reveal();
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

  const firstName = `cover-${first.slug}`;

  // A cover's two anchors, as custom properties the image reads from its class
  // list. On the box rather than the <img>, because CoverImage owns the <img>'s
  // style and a variable inherits.
  const anchors = (cover) => ({
    "--pos": cover.cardPosition ?? "center",
    "--pos-narrow": cover.mobilePosition ?? cover.cardPosition ?? "center",
  });

  return (
    <>
      {/* A window for the reveal, plus one fade zone for the stage to hold
          while the next study dissolves in over it. `id="work"` because /work
          redirects to /#work. */}
      <section id="work" className="relative h-[112svh]">
        {/* Without a script the frame would never be shown: see `reveal`. */}
        <noscript>
          <style>{`[data-reveal-frame]{opacity:1!important}`}</style>
        </noscript>

        <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden">
          <ViewTransitionLink
            href={`/work/${first.slug}`}
            vtName={firstName}
            aria-label={first.title}
            className="block h-full w-full"
          >
            <CoverImage
              cover={first.cover}
              className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-[var(--duration-settle)] ease-brand will-change-transform"
              imageClassName="object-cover will-change-transform"
              sizes={COVER_SIZES}
              priority
              containerProps={{
                ref: frameRef,
                style: { viewTransitionName: firstName },
                "data-reveal-frame": "",
                "data-vt-cover": "",
                "data-vt-target": firstName,
                "data-vt-stop": `case-${first.slug}`,
              }}
            />
          </ViewTransitionLink>
        </div>

        {/* Where the reveal completes. See the note at the top of the file. */}
        <div
          ref={stopRef}
          id={`case-${first.slug}`}
          className="pointer-events-none absolute inset-x-0 top-0 h-svh"
        />
      </section>

      {rest.map((cs, i) => {
        const cover = { ...cs.cover, ...cs.landingCover };
        const vtName = `cover-${cs.slug}`;
        const last = i === rest.length - 1;
        return (
          // A window plus a fade zone above and below (124svh = 100 + 2 x 12),
          // pulled up one zone over the panel before (-12svh). At rest the
          // window is exactly its middle. See the note at the top of the file.
          //
          // The snap point is not the article. A snap area taller than the
          // window makes every position where it covers the window valid, so
          // snapping to the article landed a flick at its top -- one fade zone
          // short, with the dissolve showing across the top of the window. The
          // block inside is exactly the window, exactly where the panel rests.
          <article
            key={cs.slug}
            id={`case-${cs.slug}`}
            className="relative -mt-[12svh] h-[124svh]"
            style={{
              maskImage: last ? MASK_LAST : MASK,
              WebkitMaskImage: last ? MASK_LAST : MASK,
            }}
          >
            <ViewTransitionLink
              href={`/work/${cs.slug}`}
              vtName={vtName}
              aria-label={cs.title}
              className="absolute inset-0 block"
            >
              <CoverImage
                cover={cover}
                className="absolute inset-0 overflow-hidden"
                imageClassName="object-cover [object-position:var(--pos-narrow)] [@media(min-aspect-ratio:5/4)]:[object-position:var(--pos)]"
                sizes={COVER_SIZES}
                containerProps={{
                  style: { viewTransitionName: vtName, ...anchors(cover) },
                  "data-vt-cover": "",
                  "data-vt-target": vtName,
                  "data-vt-stop": `case-${cs.slug}`,
                }}
              />
            </ViewTransitionLink>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-[12svh] h-svh snap-always snap-start"
            />
          </article>
        );
      })}
    </>
  );
}
