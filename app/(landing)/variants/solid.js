"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

// RectAreaLight is the only light in three that reads as a *bar* on metal rather
// than a dot, which is the whole reason the reveal below works. It needs its BRDF
// lookup tables built before it lights anything, once per page.
RectAreaLightUniformsLib.init();
import { MARK_WIDTH, useMarkFit, useMarkGeometries } from "../kalos-mark";
import {
  GoldBevelMaterial,
  GoldEnvironment,
  GoldFaceMaterial,
  damp,
  pointerLive,
  usePointer,
} from "../stage";
import { activeVariant } from "../sunrise-variants";
import {
  getTilt,
  isCoarsePointer,
  prefersReducedMotion,
  sunriseSeconds,
  usePageVisible,
} from "../device";

// Dynamic so phones never download the postprocessing chunk — see post.js.
const Post = dynamic(() => import("../post"), { ssr: false });

/**
 * The opening sunrise, as light rather than as a fade.
 *
 * The annotation on the mock asks for "light glistening on the logo in like a
 * top to bottom, sunrise type way", and the temptation is to fade the canvas up.
 * That is not what a sunrise looks like. What makes dawn read as dawn is that
 * the source moves: the highlight travels across a surface rather than the whole
 * surface getting brighter at once.
 *
 * So two things move together. The environment's contribution ramps from almost
 * nothing to the lit values, which is the sky filling in. And a single
 * directional light climbs past the mark from below, which is the sun itself and
 * the reason a bright edge sweeps down the bevel on the way. At metalness 1
 * there is no diffuse term, so a direct light shows up purely as that moving
 * specular, which is exactly the "glisten" being asked for.
 *
 * Deliberately not done by animating the Environment. Its cubemap is baked once
 * at frames={1}, and animating a lightformer means re-baking six faces every
 * frame for the whole intro, on the frames where a phone is already busiest.
 * Moving one light costs nothing and looks like more.
 */

// How much of the sunrise the sun itself occupies. The rest is the sky alone,
// which is what keeps something changing all the way to the end.
const SUN_OVER = 0.62;

// Read once. See sunrise-variants.js — this is a dev switch, not a feature.
const V = activeVariant();

/**
 * How far into the sunrise the masthead is cued.
 *
 * Not at the end of it, which is where this used to be. Measured from document
 * start: first frame at ~790ms, the sunrise finishing at ~4.8s, the masthead
 * finishing its own 900ms fade at ~5.5s. That is a long time to look at a page
 * with no logo and no way to navigate off it, and the menu lives in that row
 * now, so what was late artwork is late chrome.
 *
 * Cueing at a quarter lands it fully in at about 3s, half of what it was, which
 * is what was asked for. It still arrives "after starting animation" the way the
 * annotation asks — the sky is up and the mark is out of the dark by then; it
 * simply no longer waits for the light to finish arriving before it starts.
 *
 * This also puts the masthead back on the path that is supposed to light it.
 * The sunrise runs 5.6s and STAGE_READY_TIMEOUT_MS in hero.js is 4s, so the
 * timeout — which exists for a lost context or a chunk that never lands — was
 * beating the sunrise to it on every healthy load, and had been all along. The
 * masthead was arriving on a failure path. Anything that lengthens the sunrise
 * past that timeout again will quietly do the same thing.
 */
const MASTHEAD_AT = 0.25;


// What stage.js sets on the faces, and what the sunrise ramps back up to.

function applySunrise(scene, sun, t) {
  // Ease-in-out cubic rather than smoothstep. Sharper through the middle, which
  // is what makes this read as a sweep rather than a fade: the sky is nearly
  // still for the first third, crosses fast, then settles.
  const eased =
    V.ease === "sharp"
      ? t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
      : t * t * (3 - 2 * t);
  const lift = V.start + (1 - V.start) * eased;

  // The sun finishes before the sky does, on its own copy of the same curve, so
  // it clears the mark and goes out while the environment is still filling in.
  // Both used to run over the full duration and the sun's fall cancelled the
  // sky's rise: the mark measured 129, 129, 127 across the last half, which is
  // what "stuck at the top" was.
  const sunT = Math.min(1, t / SUN_OVER);
  const sunEased = sunT * sunT * (3 - 2 * sunT);

  // The sky itself tips up, and this is the part that reads as light arriving.
  //
  // At metalness 1 the mark is a mirror: what you see on it is the environment,
  // not a shading model. Brightening the environment uniformly is a dimmer
  // switch. Rotating it drags the reflection of the key light and the hot rim up
  // across the faces, so the light travels bottom to top.
  //
  // Cheap, and the reason this is possible: scene.environmentRotation is applied
  // at draw time to materials with no envMap of their own, which is exactly these
  // two. Nothing is re-baked.
  scene.environmentRotation.x = -V.tilt * (1 - eased);
  scene.environmentIntensity = lift;

  // And the world the object is standing in. The sand is a 2D canvas outside the
  // scene graph, so it cannot be lit; its opacity reads this instead. Without it
  // the mark rose out of darkness while the dunes behind it sat at full
  // brightness, which is a spotlight rather than a sunrise.
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--dawn", lift.toFixed(3));
  }

  if (!sun) return;
  // The blade: a tall narrow area light climbing past the mark, which on metal
  // reflects as a streak travelling up it rather than as a hot spot.
  //
  // It rises and holds rather than pulsing. A sine peaks in the middle of its
  // window and falls through exactly the stretch where the sky is still climbing,
  // so the two cancelled and the mark measured 110, 95, 92 across the middle.
  if (V.light === "blade") {
    sun.position.set(-1.8, -4.2 + sunEased * 9, 5.4);
    sun.lookAt(0, 0, 0);
  } else {
    sun.position.set(-2.2, -3.4 + sunEased * 8, 3.6);
  }

  if (V.lightShape === "hold") {
    const rise = Math.min(1, sunEased * 2.2);
    const fade = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
    sun.intensity = rise * fade * V.lightIntensity;
  } else {
    sun.intensity = Math.sin(Math.PI * sunEased) * V.lightIntensity;
  }

  // The finish is deliberately not ramped here any more.
  //
  // It was, to stop the faces ringing under the blade, and that was treating a
  // symptom. The ringing is the material's own at any angle that lights it that
  // way — it shows in the settled state too — and suppressing it during the
  // reveal made the opening look like plastic without fixing anything. The cause
  // is fixed in stage.js: the grooves were one texel apart, which is the pixel
  // grid's own frequency, so they beat against it into a bullseye.
}

/**
 * How far into the hero's own height the mark finishes docking.
 *
 * Not the whole hero. The flight has to be over well before the hero leaves the
 * screen, or the reader watches the last of it disappearing off the top edge and
 * the arrival — the lockup turning gold — happens where nobody is looking.
 */
const DOCK_OVER = 0.55;

/**
 * Where the masthead's mark sits, in the canvas' own world units.
 *
 * Measured from the DOM rather than guessed, because the lockup is sized with a
 * clamp() and positioned with env(safe-area-inset-top): there is no arithmetic
 * that gets this right on every device, and being a few pixels out is visible
 * when the thing being aligned is a logo landing on itself.
 *
 * Measured against .lab every frame rather than cached, because the lockup is
 * fixed to the viewport and the canvas inside .lab is not: the gap between them
 * is exactly the scroll distance, so the target moves the whole way through the
 * flight.
 */
function dockTarget(viewport) {
  if (typeof document === "undefined") return null;
  const lab = document.querySelector(".lab");
  const lockup = document.querySelector(".lab-lockup");
  if (!lab || !lockup) return null;

  const labRect = lab.getBoundingClientRect();
  const rect = lockup.getBoundingClientRect();
  if (!labRect.width || !labRect.height) return null;

  // The lockup is the full wordmark, 568x139, and only its first 150 units are
  // the mark, so the mark's own centre is a fraction across the SVG rather than
  // the middle of it.
  const markCentreX = rect.left - labRect.left + (rect.width * 75) / 568;
  const markCentreY = rect.top - labRect.top + rect.height / 2;

  return {
    x: (markCentreX / labRect.width - 0.5) * viewport.width,
    y: (0.5 - markCentreY / labRect.height) * viewport.height,
    scale:
      (((rect.width * 150) / 568 / labRect.width) * viewport.width) / MARK_WIDTH,
    // How far the hero has travelled under the viewport, in the same world
    // units. Read off .lab's own rect rather than the scroller's scrollTop so it
    // stays correct whatever ends up doing the scrolling; the flight needs it to
    // cancel the page's movement out of its start point. See the dock block in
    // useFrame.
    scrolled: (Math.max(0, -labRect.top) / labRect.height) * viewport.height,
    // And how far through the dock that is, from the same rect, on purpose.
    //
    // This used to be computed somewhere else entirely — a scroll listener
    // throttled to its own requestAnimationFrame, writing to a ref the frame
    // loop read. The two agree at reading speed and come apart at flinging
    // speed, because they are two callbacks with no ordering between them: the
    // target would be measured for this frame's scroll position while the
    // progress along the flight was still last frame's. A frame at fling speed
    // is around 40px of scroll, a tenth of the flight, which works out at some
    // 65 screen pixels of error — appearing and correcting itself at whatever
    // rate the two callbacks happened to interleave. That is what scrolling fast
    // and watching the mark shake instead of fly was.
    //
    // One rect, one instant, both numbers. They cannot disagree now.
    progress:
      labRect.height > 0
        ? Math.min(1, Math.max(0, -labRect.top / (labRect.height * DOCK_OVER)))
        : 0,
  };
}

/**
 * Where in the dock the flight ends, and it ends completely: position, scale,
 * rotation, colour and the object's own existence all finish on the same frame,
 * on the lockup's mark, at the lockup's size.
 *
 * That single frame is the whole design, and it took three tries. The scale used
 * to keep going after it reached the lockup's size and take the object down to
 * nothing, so the arrival happened to something already too small to be the logo
 * with the flat gold mark sitting beside it at full size — two gold marks, one a
 * fifth the size of the other. Then the object landed correctly but stayed, and
 * an object parked behind an identical flat one shivers along the shared edge
 * with every subpixel of scroll. It leaves as it arrives now. See HANDOVER_FROM.
 *
 * The dock's remaining fifth carries nothing, and that is not an oversight worth
 * removing carelessly: DOCK_OVER sets how much scroll the whole thing occupies
 * and this sets how much of that the object uses, so folding the two together
 * would land the mark 109px of scroll later than it does today. Two numbers,
 * because they answer two questions.
 */
const FLIGHT_OF = 0.78;

/**
 * How much of the flight the mark's own motion has to be out of the way for.
 *
 * The float and the idle drift fade out over the first fifth rather than being
 * cut at the first pixel of scroll: a hard stop is a visible snap, and over this
 * distance the bow they put in the line is smaller than the mark's own bevel.
 */
const DOCK_IDLE_OUT = 0.2;

// Flat well before it lands. The rotation has to finish before the scale does or
// the last frames are a tilted mark shrinking, which reads as falling away
// rather than arriving.
const DOCK_FLAT_BY = 0.7;

/**
 * The melt, in the order its three parts happen.
 *
 * Measured at the moment the flight ends, with each mark shot on its own: the
 * two silhouettes land within a quarter-pixel of each other, so alignment was
 * never the problem. What did not match was the surface. The object arrives at
 * 33px as a blown white shape with a bloom halo round it — peak 255 against the
 * flat mark's 148 — because at that size the bevel highlight is most of the
 * artwork. Dissolving that into flat gold is a visible drop in brightness, which
 * is the opposite of seamless however long it is given.
 *
 * So the object flattens on the way in, and only dissolves once it has. Its
 * environment reflection ramps out while a flat emissive ramps in, which takes a
 * lit metal object to the lockup's own painted gold — same colour, no highlight,
 * no chamfer, and no bloom either, because with the specular gone nothing is over
 * the threshold any more. Measured at the landing: both marks render
 * rgb(174, 148, 89), the same pixel. What is left to cross is one flat gold mark
 * over an identical one.
 */
/**
 * Where in the *flight* the handover starts.
 *
 * Both marks change over this stretch and they finish together, on the frame the
 * object lands: the object sheds its highlight and its chamfer for flat gold,
 * and the flat mark underneath comes up from Snow White to the same gold. By the
 * landing the two are the same colour as well as the same size and place.
 *
 * Before the landing, not after, and this is the part that was wrong twice. With
 * the flatten on the melt the object touched down still blown white and turned
 * gold afterwards, so the thing melting into the logo was never gold on the way
 * in. With the flat mark's gold on the melt too, the object had to cover a
 * *white* mark exactly on the landing frame or a white fringe showed round it —
 * a pixel of misalignment anywhere and you see it. Finishing both ramps before
 * the two meet makes the coverage question stop mattering: gold over gold.
 *
 * 0.86 puts it over the last 90-odd pixels of the flight, by which point the
 * object is a fifth of its full size and closing on the corner. It reads as the
 * slot lighting up to take it.
 */
const HANDOVER_FROM = 0.86;

/**
 * How far into the handover the object starts dissolving. It is gone by the end
 * of it, which is the frame it lands on.
 *
 * The dissolve used to happen *after* the landing, over the rest of the dock,
 * which left a fully opaque object parked behind the flat mark for a hundred
 * pixels of scroll. Even matched exactly that is not free: a WebGL edge and an
 * SVG edge do not resolve a shared boundary the same way, so the outline
 * shimmered against itself with every subpixel of scroll — measured at 265
 * device pixels of difference along the rim once the depth was taken out, and
 * visible as the mark shivering where it had just landed.
 *
 * Finishing on the landing frame removes the question rather than tuning it.
 * There is no moment where two copies of the mark are both standing there, so
 * there is nothing for them to disagree about. What is lost is nothing: the flat
 * mark is already this exact gold, in this exact place, on top.
 */
const FADE_FROM = 0.6;

/**
 * How much of its own depth the object keeps when it lands.
 *
 * Almost none, and this is the fix for the mark appearing to shiver once it has
 * docked. Matched to the flat mark exactly, it still landed about a pixel proud
 * on each side — measured by diffing the corner with the canvas hidden while
 * everything else stayed put: 540 device pixels differing, in a rim, at up to
 * half full contrast. Standing still that rim is invisible; scrolling, it
 * breathes with every subpixel of scroll offset.
 *
 * The rim was not a scale error, and the measurement says so: the object came
 * out 34.5px wide against the flat mark's 32.6, at the *same* height. A scale
 * that is wrong is wrong on both axes. What is only wrong on one is a solid seen
 * from the side — the mark is an extrusion 20 units deep docking in the top left
 * corner, well off the camera's axis, so its silhouette there includes some of
 * its own side wall.
 *
 * Shrinking it to fit was tried and is worse. The mark is two shapes with a gap
 * between them, so scaling about its centre walks the triangle's inner edge into
 * that gap — where the flat mark is transparent and cannot hide anything. It
 * traded a rim round the outside for a leak through the middle, 8.5px of it.
 *
 * Taking the depth away instead removes the side wall rather than compensating
 * for it, and it is what the object is doing anyway: by this point it has given
 * up its reflection and its chamfer for flat colour, and a flat shape is what it
 * is turning into. Not zero, because a zero scale makes the normals degenerate,
 * and the material still has to survive being scrolled back up through.
 */
const DOCK_FLATTEN_Z = 0.02;

// Vulcan Gold, the same value --color-vulcan-gold carries. Set as emissive with
// the environment ramped to nothing, so the object renders as flat paint rather
// than as metal reflecting something.
const MELT_GOLD_HEX = 0xae9357;

/**
 * The handover ramp, from flight progress. Shared, so the two marks cannot drift
 * out of step with each other — they have to arrive at the same colour on the
 * same frame or the crossfade has something to see.
 */
function handover(flight) {
  return Math.min(1, Math.max(0, (flight - HANDOVER_FROM) / (1 - HANDOVER_FROM)));
}

/**
 * Takes the mark from lit metal to flat gold, and back.
 *
 * Applied every frame rather than on a threshold, so scrolling back up undoes it
 * exactly. The two materials are the flat caps and the bevel; flattening both is
 * what makes the chamfer disappear, which it has to, because the flat mark it is
 * landing on has no chamfer to match.
 *
 * The reflection is taken off the *scene*, not off the materials. Setting
 * material.envMapIntensity here did nothing at all, and the block at the top of
 * stage.js says why: neither of these materials owns an envMap — the light comes
 * from scene.environment — so WebGLRenderer overwrites the uniform from
 * scene.environmentIntensity on every draw. It rendered as flat gold laid over a
 * fully lit metal mark, which measured 2.26x brighter in linear than the flat
 * mark it was supposed to be matching. That is the same trap this file has fallen
 * into once before, and it looks like a tone-mapping problem from the outside.
 *
 * Safe to reach for the scene here because the mark is the only object in it.
 */
function flatten(scene, group, t) {
  // The sunrise owns environmentIntensity the rest of the time, and it is still
  // ramping while the page is arriving. Only write while there is something to
  // say, and write the settled value once on the way back down.
  scene.environmentIntensity = 1 - t;

  if (!group) return;
  group.traverse((o) => {
    if (!o.isMesh) return;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of materials) {
      if (!m) continue;
      m.emissive.setHex(MELT_GOLD_HEX);
      m.emissiveIntensity = t;
    }
  });
}

function Lockup({ still, started, onLit }) {
  const geometries = useMarkGeometries();
  const { scale, lift, offsetX } = useMarkFit();
  const group = useRef();
  // The scaled group, by ref rather than by child index. It was g.children[0],
  // which stopped being the mark the moment the sunrise added a light above it:
  // the dock was scaling a directional light and wondering why nothing shrank.
  const inner = useRef();
  const sun = useRef();
  const pointer = usePointer();

  // The damped pose, kept off the group.
  //
  // It has to be, because the flight scales the rotation toward zero and the
  // damp reads its own previous value: writing the flattened angle back onto the
  // group meant the next frame damped from a number the flight had already
  // shrunk, so the pose depended on how many frames had been spent at what
  // scroll position. Measured, at half the dock: arriving from the top and
  // arriving from below it put the mark 29px apart on screen. Held here, the
  // damp sees only its own history and the flatten is a pure function of scroll.
  //
  // Seeded with the group's own starting rotation so the entrance swing is
  // unchanged — that swing is the page's only cue that the mark responds to
  // being moved.
  const pose = useRef({ x: 0.3, y: -0.8 });

  // Read once, at mount: how long the sunrise runs is a per-session decision and
  // must not change under the animation. Held in a ref rather than state because
  // the frame loop is the only reader and re-rendering the tree to carry a
  // number the GPU already has would be waste.
  // Scroll progress through the dock, written by a listener and read by the
  // frame loop. A ref rather than state: this changes on every scroll event and
  // re-rendering the tree for a number the GPU is about to consume is waste.
  // Whether the flatten currently owns the scene's light. See the guard in
  // useFrame.
  //
  // There were two more refs here, carrying the flight's progress and the melt's
  // from the scroll handler into the frame loop. Both are gone: the frame loop
  // measures its own progress now, off the same rect it measures the target
  // from. What the handler still owns is the part of the dock that is DOM rather
  // than scene — the flat mark's colour and the object's opacity — and a frame
  // of skew on a colour is not something anyone can see.
  const flattening = useRef(false);

  const sunrise = useRef({ elapsed: 0, seconds: 0, done: false, lit: false, pinned: null });
  if (sunrise.current.seconds === 0) {
    sunrise.current.seconds = sunriseSeconds(V.seconds);
    // ?dawn=0.4 pins the sunrise at a point instead of playing it, the same
    // affordance ?hint=1 gives the gyroscope prompt. Judging a three second
    // entrance from screenshots is otherwise a fight with shutter latency: the
    // frame you get back is a couple of hundred milliseconds after the one you
    // asked for, which on a ramp is a different picture.
    const pinned = new URLSearchParams(window.location.search).get("dawn");
    if (pinned !== null) sunrise.current.pinned = Math.min(1, Math.max(0, Number(pinned)));
  }

  // The dock listener. Lives here rather than in the page shell because the
  // measurement it needs (the lockup's place inside the canvas) is a 3D concern.
  useEffect(() => {
    const scroller = document.querySelector(".landing-root");
    const lab = document.querySelector(".lab");
    if (!scroller || !lab) return;

    // The stage rather than the canvas. .lab-canvas carries a 260ms opacity
    // transition for its reveal, and an inline opacity set from a scroll handler
    // would be run through it — the melt would lag the scroll by a quarter of a
    // second and stop being a function of scroll position at all. Its wrapper
    // has no transition on it.
    const stage = lab.querySelector(".lab-stage");
    const header = lab.querySelector(".lab-header");
    const root = document.documentElement;

    let frame = 0;
    const read = () => {
      frame = 0;
      const range = lab.offsetHeight * DOCK_OVER;
      const p = range > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / range)) : 0;

      // The DOM half of the dock: the flat mark's colour, the object's opacity
      // and the masthead's. All written straight to the DOM rather than through
      // React, because they change every scroll frame and re-rendering the tree
      // to carry three numbers is waste.

      // Both halves of the handover run off one number, which is the point of
      // it: the flat mark coming up gold and the object going away have to agree
      // to the frame or there is something to see between them.
      const over = handover(Math.min(1, p / FLIGHT_OF));

      // The flat mark's half. Clamped at 1 by the flight's own clamp, so it
      // stays gold for the rest of the page.
      root.style.setProperty("--mark-gold", over.toFixed(3));

      // And the object's, on the tail of the same ramp: by the time this reaches
      // zero the object is exactly where the flat mark is, in exactly its
      // colour, with the flat mark on top. Nothing crosses, because there is
      // never a frame with both of them standing there.
      const shown =
        1 - Math.min(1, Math.max(0, (over - FADE_FROM) / (1 - FADE_FROM)));
      if (stage) stage.style.opacity = shown < 1 ? String(shown) : "";

      // And the masthead goes, across the dead zone and no sooner.
      //
      // From the end of the dock to the bottom of the hero, which is the top of
      // the work — so it is on its way out for exactly the stretch of scroll
      // that has nothing else on it, and it is gone by the time the first case
      // study arrives. Under the commit snap that whole stretch is the tail of
      // one glide, which is what "as the snap scroll happens" means.
      //
      // Driven by scroll rather than by a class, like everything else in the
      // dock. It was a class with a 260ms transition once, and a timed fade on a
      // scroll-driven page is only in step at the one speed it was tuned at.
      //
      // The inline `transition: none` is not optional. .lab-header carries a
      // 900ms opacity transition for its own entrance, and without suppressing
      // it every value written here would be run through it — the masthead would
      // lag the scroll by the better part of a second and stop being a function
      // of position at all. Same trap as .lab-canvas above, which is why the
      // stage is what carries the object's fade rather than the canvas.
      //
      // `visibility` rather than trusting opacity 0 to be unclickable: the
      // masthead is pointer-events: none, but the menu inside it opts back in,
      // so an invisible card would go on swallowing clicks in the corner for the
      // rest of the page.
      if (header) {
        const bottom = lab.offsetHeight;
        const out =
          bottom > range
            ? Math.min(1, Math.max(0, (scroller.scrollTop - range) / (bottom - range)))
            : 0;
        if (out > 0) {
          header.style.transition = "none";
          header.style.opacity = String(1 - out);
          header.style.visibility = out >= 1 ? "hidden" : "";
        } else {
          header.style.transition = "";
          header.style.opacity = "";
          header.style.visibility = "";
        }
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };
    const onResize = onScroll;

    read();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      // All of these are written outside React, so nothing else will put them
      // back.
      if (stage) stage.style.opacity = "";
      if (header) {
        header.style.transition = "";
        header.style.opacity = "";
        header.style.visibility = "";
      }
      root.style.removeProperty("--mark-gold");
    };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    // Hold the entrance pose until the canvas is actually on screen.
    //
    // The swing out of this pose is the page's only cue that the mark responds
    // to being moved, so none of it can be spent behind the reveal fade. Frame
    // count alone doesn't guarantee that: shader compilation and the cubemap
    // bake land on the first frames, which measured as a ~1.8s stall with
    // nothing composited — long enough for the swing to be most of the way over
    // before anything appeared. Gating on the reveal makes it play in view on
    // any device, however slow that first frame turns out to be.
    // Held dark from the very first frame, not from the reveal. The canvas fades
    // up over 260ms and the materials are declared at their lit values, so
    // without this the first frames composite a fully lit mark and the sunrise
    // starts by getting darker.
    if (!started) {
      if (!sunrise.current.done) applySunrise(state.scene, sun.current, 0);
      return;
    }

    // The sunrise runs off the reveal, never off a timer. The renderer lands
    // seconds after the page shell on a phone, and an entrance on a fixed delay
    // plays to an empty background.
    const dawn = sunrise.current;
    if (dawn.pinned !== null) {
      applySunrise(state.scene, sun.current, dawn.pinned);
    } else if (!dawn.done) {
      dawn.elapsed += delta;
      const t = Math.min(1, dawn.elapsed / dawn.seconds);
      applySunrise(state.scene, sun.current, t);
      // The masthead is cued partway through rather than at the end — see
      // MASTHEAD_AT. Separate from `done`, because the sun still has to be
      // switched off when the light has actually finished.
      if (!dawn.lit && t >= MASTHEAD_AT) {
        dawn.lit = true;
        onLit?.();
      }
      if (t === 1) {
        dawn.done = true;
        if (sun.current) sun.current.visible = false;
      }
    }

    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const tilt = getTilt();

    // Input priority: an active cursor or finger wins, then the gyroscope, then
    // the idle drift. Deliberately ordered that way — a deliberate drag should
    // always override whatever angle the handset happens to be held at.
    const live = pointerLive(p);
    const source = live ? p : tilt.active ? tilt : null;
    const gyro = Boolean(source) && !live;

    // Kept deliberately shallow. Past about 0.3rad the triangle foreshortens far
    // enough that it stops reading as the logo and starts reading as a kite —
    // though the gyro earns more range, since holding a phone is a much more
    // direct sort of contact than pushing a cursor around.
    const swing = gyro ? 0.62 : 0.46;
    const targetY = source ? source.x * swing : 0;
    const targetX = source ? -source.y * swing * 0.7 : 0;

    // Damping tuned for a mouse feels like treacle on a gyroscope — you move the
    // phone and the mark arrives a beat later. Tighter when the sensor is
    // driving, but not so tight that sensor noise becomes visible jitter.
    const lambda = gyro ? 6 : 3.2;

    // `still` silences the motion the page makes on its own. It must not
    // silence the motion the visitor is making.
    //
    // This used to pin every rotation to 0 whenever prefers-reduced-motion was
    // set, which killed the gyroscope stone dead: someone with Reduce Motion on
    // in iOS Settings was shown a prompt asking for the sensor, granted it, and
    // then watched a mark that could not move. Asking for motion access and
    // ignoring the readings is worse than never asking. Measured, by feeding
    // opposite tilts and diffing frames: 13.5 average pixel change normally,
    // 0.0 with reduced motion.
    //
    // Reduced motion is about animation the page starts by itself, which is the
    // vestibular problem. Turning an object because the visitor turned their
    // phone, or moved their cursor, is direct manipulation, closer to scrolling
    // than to an autoplaying banner, and they opted into it by tapping a button
    // that says so. So a live input always drives, and `still` now only
    // suppresses the idle drift and the float underneath it.
    // Where the mark is going, and how far along it is, from one read of one
    // rect — see `progress` in dockTarget for why that matters more than it
    // looks like it should.
    const to = dockTarget(state.viewport);
    const docked = to ? Math.min(1, to.progress / FLIGHT_OF) : 0;

    // The flight is a straight line and nothing the page does on its own may put
    // a curve in it, so the mark's autonomous motion is scaled out as it starts.
    const idle = Math.max(0, 1 - docked / DOCK_IDLE_OUT);

    const idleY = still ? 0 : Math.sin(t * 0.34) * 0.26 * idle;
    const idleX = still ? 0 : Math.sin(t * 0.23) * 0.13 * idle;

    // Damped into `pose` rather than onto the group — see the note on the ref.
    //
    // The old line was `g.rotation.x *= 1 - …`, which compounded frame on frame:
    // the same scroll position settled at a different angle at 120fps than at
    // 60, and a slow scroll landed flatter than a fast one over the identical
    // range. That is exactly the dependence on how you scrolled that the flight
    // must not have.
    //
    // The initial rotation is off-target, so this same damp doubles as the
    // entrance: the mark swings into place instead of popping in.
    const rotY = damp(pose.current.y, source ? targetY : idleY, lambda, delta);
    const rotX = damp(pose.current.x, source ? targetX : idleX, lambda, delta);
    pose.current.y = rotY;
    pose.current.x = rotX;
    // The float is autonomous, so `still` alone decides whether it runs at all.
    // An earlier version of this line also stopped it whenever an input was
    // driving, which quietly made the mark deader the moment you picked the
    // phone up.
    const floatY = lift + (still ? 0 : Math.sin(t * 0.55) * 0.05) * idle;

    // Assigned unconditionally, including the scale, so scrolling back to the
    // top restores the mark rather than leaving it wherever the last docked
    // frame put it.
    g.rotation.y = rotY;
    g.rotation.x = rotX;
    g.position.x = offsetX;
    g.position.y = floatY;
    inner.current?.scale.set(scale, -scale, scale);

    // Guarded, so the sunrise keeps ownership of the scene's light until there
    // is actually a melt to apply — without this, a page that has only just
    // started loading has its environment pinned to the settled value from the
    // first frame and the whole entrance is skipped.
    // The object's half of the handover, off the same ramp the flat mark uses.
    // `flat` further down is the rotation flatten, a different thing.
    const melted = handover(docked);
    if (melted > 0 || flattening.current) {
      flatten(state.scene, inner.current, melted);
      flattening.current = melted > 0;
    }

    // The flight, applied last so it overrides everything above it.
    //
    // The designer left this as an OR: the mark either flies into the lockup at
    // the top left and turns it gold, or it exits down and to the right. Docking
    // is the one that means something. The mark and the lockup are the same
    // artwork — kalos-mark.js and lockup.js hold identical path data — so the
    // object does not fly off to make room, it becomes the thing in the corner
    // that was standing in for it. It also settles the contradiction between the
    // two masthead annotations: the lockup does not disappear past the hero, it
    // is what the mark turns into on the way.
    if (docked <= 0 || !to) return;

    // Straight on screen, and a pure function of how far the page is scrolled.
    //
    // Both ends live in the canvas' frame, which travels with the hero, while
    // the lockup it is aiming at is fixed to the viewport. Interpolating between
    // them as they stand describes a curve on the screen, which is where anyone
    // is actually watching it: the mark rides up with the page early on, when
    // the interpolation has barely started, and then hooks into the corner at
    // the end. `to.scrolled` cancels the page's own movement out of the start
    // point, which holds it still in the viewport — and a lerp between two
    // points that are both stationary on screen is a straight line, at any
    // scroll speed and in both directions.
    //
    // Linear rather than eased. There was a `docked * docked` here, on the
    // argument that a linear flight starts moving the instant anyone touches the
    // wheel and reads as twitchy. That was written when the start point scrolled
    // away with the page, so the opening of the movement came free; with the
    // mark held still on screen the same curve reads as it being stuck to the
    // glass for half a screen and then bolting. To put an ease back, apply it to
    // `k` here and nowhere else — every term below reads it.
    //
    // Note the sign. Scrolling down carries the canvas *up*, so cancelling that
    // means walking the start point down the world, which is -y. Getting this
    // backwards doubles the page's movement into the flight instead of removing
    // it, and the shape it produces is a plausible-looking curve rather than
    // anything that reads as broken: measured at 1440x900, the mark passed the
    // masthead's height at 40% of the dock and then kept going off the top.
    const k = docked;
    const fromY = floatY - to.scrolled;
    g.position.x = offsetX + (to.x - offsetX) * k;
    g.position.y = fromY + (to.y - fromY) * k;

    // Rotating flat is what makes it stop being an object and start being a
    // logo. An absolute factor, not a per-frame decay — see the note on rotX.
    const flat = Math.min(1, k / DOCK_FLAT_BY);
    g.rotation.x = rotX * (1 - flat);
    g.rotation.y = rotY * (1 - flat);

    // The arrival, and nothing past it. `k` is clamped at 1, so if anything is
    // still on screen past this point it holds on the lockup rather than sailing
    // through it — still tracking the masthead, which is fixed while the canvas
    // under it keeps scrolling. By design nothing is: the dissolve finishes on
    // this frame.
    //
    // There used to be a shrink-out on the end of this, on the argument that two
    // copies of the same artwork landing on each other read as a doubled logo.
    // The argument was right and the remedy was wrong: it never let the two be
    // the same size, so the object went past the logo and vanished as a speck
    // beside it. They are supposed to coincide exactly — that is what makes the
    // handover invisible — and what separates them is the dissolve, not a size.
    const s = scale + (to.scale - scale) * k;
    // The depth goes on the handover ramp, with everything else that turns this
    // object into the flat mark.
    const z = s * (1 - (1 - DOCK_FLATTEN_Z) * melted);
    inner.current?.scale.set(s, -s, z);
  });

  return (
    <group ref={group} position={[offsetX, lift, 0]} rotation={[0.3, -0.8, 0]}>
      {/* The sun, as a blade rather than a point. Starts under the mark and dark,
          and is switched off entirely once it has passed over: leaving it in the
          scene at zero intensity still costs a light slot in every compile. */}
      {V.light === "blade" ? (
        <rectAreaLight
          ref={sun}
          intensity={0}
          color="#ffe6bd"
          width={1.6}
          height={8}
          position={[-1.8, -4.2, 5.4]}
        />
      ) : (
        <directionalLight ref={sun} intensity={0} color="#ffdca8" position={[-2.2, -3.4, 3.6]} />
      )}
      <group ref={inner} scale={[scale, -scale, scale]}>
        {/* Two materials, in the order ExtrudeGeometry declares its groups:
            0 is the flat caps, 1 is the side walls and the bevel. */}
        {geometries.map((geometry, i) => (
          <mesh key={i} geometry={geometry}>
            <GoldFaceMaterial attach="material-0" />
            <GoldBevelMaterial attach="material-1" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Fires once, as soon as there's actually something on the canvas.
 *
 * The chunk this file lives in lands seconds after the page shell on a phone,
 * and until it does the stage is empty — so the canvas has to announce itself
 * rather than blink into existence at full opacity.
 *
 * Two frames, not one: useFrame runs before the draw call, so frame 1 hasn't
 * been painted yet, and drei's Environment bakes its cubemap on first render.
 * Waiting one more frame means the reveal never uncovers an empty canvas. It
 * also keeps the reveal at the very start of the mark's entrance swing — that
 * swing is the page showing you it responds to movement, and it is at its
 * fastest in the first few hundred milliseconds, so it must not happen behind a
 * half-transparent canvas.
 */
const REVEAL_FRAME = 2;

function RevealOnFirstFrame({ onReveal }) {
  const frames = useRef(0);

  useFrame(() => {
    frames.current += 1;
    if (frames.current === REVEAL_FRAME) onReveal();
  });

  return null;
}

export default function Solid({ onReady, onLit }) {
  // Read once at mount rather than per frame: neither answer changes while the
  // hero is on screen, and both feed props that shouldn't thrash.
  const [coarse] = useState(isCoarsePointer);
  const [still] = useState(prefersReducedMotion);
  const [revealed, setRevealed] = useState(false);
  const visible = usePageVisible();

  const reveal = useCallback(() => {
    setRevealed(true);
    onReady?.();
  }, [onReady]);

  return (
    <Canvas
      className={`lab-canvas${revealed ? " is-revealed" : ""}`}
      camera={{ position: [0, 0, 8], fov: 30 }}
      // Phone screens are often 3x. Rendering at native density burns frames for
      // detail nobody can resolve at arm's length.
      dpr={[1, coarse ? 1.75 : 2]}
      frameloop={visible ? "always" : "never"}
      gl={{
        antialias: true,
        // "high-performance" asks for the discrete GPU, which on a laptop means
        // more heat and less battery for a decorative hero.
        powerPreference: coarse ? "default" : "high-performance",
      }}
    >
      <GoldEnvironment />
      <Lockup still={still} started={revealed} onLit={onLit} />
      <RevealOnFirstFrame onReveal={reveal} />
      {!coarse && <Post />}
    </Canvas>
  );
}
