"use client";

import { useEffect, useRef } from "react";
import CoverImage from "../work/CoverImage";
import ViewTransitionLink from "../view-transition-link";

/**
 * The work: the first study grows out from under the hero, and every study
 * after it slides up over the one before like a sheet laid on a stack.
 *
 *   1. THE REVEAL. The first study opens as an inset picture peeking over the
 *      fold and grows to full bleed as the page scrolls -- the Venice / Collins
 *      move. Most of this note is about it.
 *   2. THE STACK. Each study is a full-window sheet, sticky at the top of the
 *      window. The next one scrolls up over it, and as it is covered the sheet
 *      underneath recedes: it scales down a little, dims, and takes on the
 *      inset frame's rounded corners, so it becomes a card on the white page.
 *
 * What the stack replaced, both built and both rejected:
 *
 *   - Full-bleed panels scrolling past. Unless the window was exactly the
 *     picture's shape you saw the neighbour at its edges, and between stops the
 *     edge between two pictures slid by with nothing to say what it was.
 *   - A pinned stage cross-fading between covers with a settle zoom. Mid-fade
 *     two unrelated photographs made a double exposure -- two logos over each
 *     other -- and it read as a slideshow. On narrow windows each cover sat
 *     whole over a blurred copy of itself, which says "this does not fit" in
 *     the one place the work should look deliberate.
 *
 * A sheet has an edge on purpose. It is a physical object arriving over
 * another, never a blend, and the recede is the same vocabulary as the hero's
 * inset frame -- rounded, on white -- run the other way.
 *
 * The fit: every sheet is object-cover, full bleed, always. What decides the
 * crop is where it is anchored: `cardPosition` on a landscape window and
 * `mobilePosition` on a narrow one (both in data.js), so a phone crops into
 * the part of the picture that matters rather than its middle. A CSS media
 * query picks between them, so there is nothing to measure.
 *
 * The stack is plain `position: sticky`, so without JavaScript it still
 * stacks; only the recede needs the script.
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
 * The stack:
 *
 * Every sheet, the first study's stage included, is `sticky top-0` and a
 * window tall, one after another in the same section. So each sheet scrolls up
 * in flow and sticks, and the next scrolls up over it. The first study's stage
 * sticks exactly when the reveal completes, so the reveal never knew the
 * difference. Each later study has a `#case-<slug>` stop block a window apart
 * down the runway, which is exactly where its sheet sticks.
 *
 * A sheet recedes across the scroll from its own stop to the next one's, which
 * is precisely the time the next sheet takes to cover it. Scale and the dimming
 * layer's opacity are compositor properties on the same ScrollTimeline as the
 * reveal; the corner radius is painted, and is small enough that a frame of lag
 * on it does not show.
 *
 * There is nothing to arbitrate for clicks: at a stop the next sheet is still
 * wholly below the window, so the sheet on screen is the topmost thing there.
 */

// How far a covered sheet recedes, and how dark it goes. Enough to read as
// pushed back, not so much that it reads as disabled.
const RECEDE_SCALE = 0.92;
const RECEDE_DIM = 0.45;

// `[@media(min-aspect-ratio:5/4)]:` is a landscape window, where a cover is
// anchored at `cardPosition` rather than `mobilePosition`. Written out in full
// in each class list rather than kept in a constant: Tailwind finds classes by
// scanning the source for them, so a class assembled from a variable at
// runtime is never generated. That shipped once here.

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

// What the browser should fetch for a full-window cover. On a landscape
// window the picture is about the window's width. On a portrait one it is
// cropped to fill the height, which puts it at up to four times the window's
// width -- and `100vw` there fetched a file a quarter of the size it was drawn
// at, so every phone crop was soft. The media condition is the same line the
// anchors switch on.
const COVER_SIZES = "(max-aspect-ratio: 5/4) 400vw, 100vw";

// The corner a receded sheet takes on: the inset frame's own, so the card it
// becomes is the frame the hero drew.
const cornerOf = (W) => W * (W >= 1024 ? INSET.lg : INSET.sm) * RADIUS;

export default function Stage({ first, rest }) {
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const stopRef = useRef(null);
  const sheetRefs = useRef([]);
  const dimRefs = useRef([]);
  const sheetStopRefs = useRef([]);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const stop = stopRef.current;
    const image = frame?.querySelector("img");
    // Every card in the stack, the first study's stage first, and the layer
    // that dims each.
    const cards = [stage, ...sheetRefs.current.slice(0, rest.length)];
    const dims = dimRefs.current.slice(0, rest.length + 1);
    const sheetStops = sheetStopRefs.current.slice(0, rest.length);
    if (!stage || !frame || !stop || !image) return;
    if ([...cards, ...dims, ...sheetStops].some((el) => !el)) return;

    frame.style.transformOrigin = "0 0";
    image.style.transformOrigin = "0 0";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const compositor = typeof window.ScrollTimeline === "function";

    const geometry = () => {
      const r = stop.getBoundingClientRect();
      const section = stage.parentElement.getBoundingClientRect();
      const end = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
      const at = (el) => el.getBoundingClientRect().top + window.scrollY;
      // Where each card is on screen by itself: the reveal's end, then each
      // later study's stop. Card k recedes from its own to the next.
      const stops = [end, ...sheetStops.map(at)];
      return {
        W: stage.clientWidth,
        H: stage.clientHeight,
        start: section.top + window.scrollY,
        // The scroll that centres the stop, i.e. the section filling the
        // window: see the note at the top of the file.
        end,
        recedes: stops.slice(0, -1).map((from, k) => ({ from, to: stops[k + 1] })),
      };
    };

    // Card k's recede at scroll s: none at its own stop, all of it by the
    // next, when the next sheet has covered it.
    const recedeAt = (s, { from, to }, W) => {
      const t = clamp01((s - from) / (to - from));
      return {
        card: {
          transform: `scale(${lerp(1, RECEDE_SCALE, t)})`,
          borderRadius: `${lerp(0, cornerOf(W), t)}px`,
        },
        dim: { opacity: lerp(0, RECEDE_DIM, t) },
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
      cards.forEach((el, k) => {
        el.style.transform = "";
        el.style.borderRadius = "";
        dims[k].style.opacity = "";
      });
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
    // Under reduced motion there is no reveal (the frame sits at full bleed)
    // and no recede: the sheets still stack, which is layout, not animation.
    const build = () => {
      clear();
      const g = geometry();
      const max = root.scrollHeight - root.clientHeight;
      if (g.end <= 0 || max <= 0 || reduced.matches) return reveal();
      const timeline = new window.ScrollTimeline({ source: root, axis: "block" });
      const options = { timeline, fill: "both", easing: "linear" };

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

      // Explicit ends at 0 and 1, because a keyframe list that starts past
      // offset 0 interpolates from the element's own style before it.
      g.recedes.forEach((range, k) => {
        const a = recedeAt(range.from, range, g.W);
        const b = recedeAt(range.to, range, g.W);
        const ends = (x, y) => [
          { offset: 0, ...x },
          { offset: range.from / max, ...x },
          { offset: range.to / max, ...y },
          { offset: 1, ...y },
        ];
        animations.push(
          cards[k].animate(ends(a.card, b.card), options),
          dims[k].animate(ends(a.dim, b.dim), options),
        );
      });
      reveal();
    };

    // Fallback path, for browsers without ScrollTimeline.
    let raf = 0;
    const draw = () => {
      raf = 0;
      const g = geometry();
      if (g.end <= 0 || reduced.matches) {
        clear();
        return reveal();
      }
      const s = window.scrollY;
      const { frame: f, radius, image: i } = pose(s, g);
      frame.style.transform = f;
      frame.style.borderRadius = radius;
      image.style.transform = i;
      g.recedes.forEach((range, k) => {
        const { card, dim } = recedeAt(s, range, g.W);
        cards[k].style.transform = card.transform;
        cards[k].style.borderRadius = card.borderRadius;
        dims[k].style.opacity = String(dim.opacity);
      });
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
  }, [rest.length]);

  const firstName = `cover-${first.slug}`;

  // The dimming layer every card carries. Black at an opacity the recede
  // animates, over the picture and under nothing.
  const dim = (k) => (
    <div
      ref={(el) => {
        dimRefs.current[k] = el;
      }}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-black opacity-0"
    />
  );

  // A cover's two anchors, as custom properties the image reads from its class
  // list. On the box rather than the <img>, because CoverImage owns the <img>'s
  // style and a variable inherits.
  const anchors = (cover) => ({
    "--pos": cover.cardPosition ?? "center",
    "--pos-narrow": cover.mobilePosition ?? cover.cardPosition ?? "center",
  });

  return (
    // One window for the reveal plus one per later study. `id="work"` because
    // /work redirects to /#work.
    <section id="work" className="relative">
      {/* Without a script the frame would never be shown: see `reveal`. */}
      <noscript>
        <style>{`[data-reveal-frame]{opacity:1!important}`}</style>
      </noscript>

      <div
        ref={stageRef}
        className="sticky top-0 h-svh w-full overflow-hidden will-change-transform"
      >
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
        {dim(0)}
      </div>

      {rest.map((cs, i) => {
        const cover = { ...cs.cover, ...cs.landingCover };
        const vtName = `cover-${cs.slug}`;
        return (
          <div
            key={cs.slug}
            ref={(el) => {
              sheetRefs.current[i] = el;
            }}
            className="sticky top-0 h-svh w-full overflow-hidden will-change-transform"
          >
            <ViewTransitionLink
              href={`/work/${cs.slug}`}
              vtName={vtName}
              aria-label={cs.title}
              className="block h-full w-full"
            >
              <CoverImage
                cover={cover}
                className="absolute inset-0"
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
            {dim(i + 1)}
          </div>
        );
      })}

      {/* Where the reveal completes. See the note at the top of the file. */}
      <div
        ref={stopRef}
        id={`case-${first.slug}`}
        className="pointer-events-none absolute inset-x-0 top-0 h-svh"
      />

      {/* One stop per later study, a window apart down the runway -- exactly
          where its sheet sticks. snap-start, which for a block the window's
          height is also its centre. */}
      {rest.map((cs, i) => (
        <div
          key={cs.slug}
          ref={(el) => {
            sheetStopRefs.current[i] = el;
          }}
          id={`case-${cs.slug}`}
          className="pointer-events-none absolute inset-x-0 h-svh snap-always snap-start"
          style={{ top: `${(i + 1) * 100}svh` }}
        />
      ))}
    </section>
  );
}
