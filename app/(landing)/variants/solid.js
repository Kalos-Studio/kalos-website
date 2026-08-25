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
// 0.22. Pure black was tried and is wrong: the mark has to be in the room before
// the light finds it, or the first second reads as a page that has not loaded
// rather than as a dark room. There is a difference between an object you cannot
// see yet and an object that is not there.
const SUNRISE_START = 0.22;

// How much of the sunrise the sun itself occupies. The rest is the sky alone,
// which is what keeps something changing all the way to the end.
const SUN_OVER = 0.62;

// How far the sky is tipped over at the start, in radians. Large on purpose: the
// environment's bright sources sit high and in front, so this has to swing them
// well below the mark for there to be anywhere for the light to rise from.
// 1.0, arrived at by measuring rather than by taste. 2.4 was tried first and the
// mark came out brighter a third of the way through than at half: the environment
// is hand-built from a handful of lightformers with dark gaps between them, and a
// long swing drags the reflection straight through a gap. Measured mean luminance
// at 1.7 still dipped 107, 50, 104 across the middle. At 1.0 the sweep stays
// inside the lit part of the sky and the ramp climbs the whole way.
const SKY_TILT = 1.0;

// What stage.js sets on the faces, and what the sunrise ramps back up to.

function applySunrise(scene, sun, t) {
  // Ease-in-out cubic rather than smoothstep. Sharper through the middle, which
  // is what makes this read as a sweep rather than a fade: the sky is nearly
  // still for the first third, crosses fast, then settles.
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lift = SUNRISE_START + (1 - SUNRISE_START) * eased;

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
  scene.environmentRotation.x = -SKY_TILT * (1 - eased);
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
  const bladeRise = Math.min(1, sunEased * 2.2);
  const bladeFade = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
  sun.position.set(-1.8, -4.2 + sunEased * 9, 5.4);
  sun.lookAt(0, 0, 0);
  sun.intensity = bladeRise * bladeFade * 4.2;

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
  };
}

function Lockup({ still, started, onLit, onDocked }) {
  const geometries = useMarkGeometries();
  const { scale, lift, offsetX } = useMarkFit();
  const group = useRef();
  // The scaled group, by ref rather than by child index. It was g.children[0],
  // which stopped being the mark the moment the sunrise added a light above it:
  // the dock was scaling a directional light and wondering why nothing shrank.
  const inner = useRef();
  const sun = useRef();
  const pointer = usePointer();

  // Read once, at mount: how long the sunrise runs is a per-session decision and
  // must not change under the animation. Held in a ref rather than state because
  // the frame loop is the only reader and re-rendering the tree to carry a
  // number the GPU already has would be waste.
  // Scroll progress through the dock, written by a listener and read by the
  // frame loop. A ref rather than state: this changes on every scroll event and
  // re-rendering the tree for a number the GPU is about to consume is waste.
  const dock = useRef(0);

  const sunrise = useRef({ elapsed: 0, seconds: 0, done: false, pinned: null });
  if (sunrise.current.seconds === 0) {
    sunrise.current.seconds = sunriseSeconds();
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

    let frame = 0;
    let docked = false;
    let wasPast = false;
    const read = () => {
      frame = 0;
      const range = lab.offsetHeight * DOCK_OVER;
      const p = range > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / range)) : 0;
      dock.current = p;
      // Only tells React when it crosses, not on every frame: the lockup turning
      // gold is one class change, not an animation.
      const now = p > 0.82;
      // And the masthead follows it out, per the annotation. Not at the very end
      // of the hero: by then the gold lockup has been hanging over the section
      // below for half a screen.
      const past = p >= 1;
      if (now !== docked || past !== wasPast) {
        docked = now;
        wasPast = past;
        onDocked?.({ docked: now, past });
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
    };
  }, [onDocked]);

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
      if (t === 1) {
        dawn.done = true;
        if (sun.current) sun.current.visible = false;
        onLit?.();
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
    const idleY = still ? 0 : Math.sin(t * 0.34) * 0.26;
    const idleX = still ? 0 : Math.sin(t * 0.23) * 0.13;

    // The initial rotation is off-target, so this same damp doubles as the
    // entrance: the mark swings into place instead of popping in.
    g.rotation.y = damp(g.rotation.y, source ? targetY : idleY, lambda, delta);
    g.rotation.x = damp(g.rotation.x, source ? targetX : idleX, lambda, delta);
    // The float is autonomous, so `still` alone decides it. An earlier version of
    // this line also stopped it whenever an input was driving, which quietly made
    // the mark deader the moment you picked the phone up.
    g.position.y = lift + (still ? 0 : Math.sin(t * 0.55) * 0.05);

    // The dock, applied last so it overrides everything above it.
    //
    // The designer left this as an OR: the mark either flies into the lockup at
    // the top left and turns it gold, or it exits down and to the right. Docking
    // is the one that means something. The mark and the lockup are the same
    // artwork — kalos-mark.js and lockup.js hold identical path data — so the
    // object does not fly off to make room, it becomes the thing in the corner
    // that was standing in for it. It also settles the contradiction between the
    // two masthead annotations: the lockup does not disappear past the hero, it
    // is what the mark turns into on the way.
    const docked = dock.current;
    if (docked <= 0) return;
    const to = dockTarget(state.viewport);
    if (!to) return;

    // Ease in, so the mark holds its place while the reader is still in the hero
    // and then commits. A linear flight starts moving the instant anyone touches
    // the wheel, which reads as the page being twitchy.
    const k = docked * docked;
    g.position.x = offsetX + (to.x - offsetX) * k;
    g.position.y = g.position.y + (to.y - g.position.y) * k;
    // Rotating flat is what makes it stop being an object and start being a
    // logo, and it has to finish before the scale does or the last frames are a
    // tilted mark shrinking, which reads as falling away rather than landing.
    g.rotation.x *= 1 - Math.min(1, k * 1.4);
    g.rotation.y *= 1 - Math.min(1, k * 1.4);
    // The handoff. The last stretch shrinks the mark out of existence, because
    // the two are the same artwork and landing one exactly on top of the other
    // reads as a doubled logo rather than as an arrival. By the time this
    // finishes the lockup has already taken the gold, so what is left in the
    // corner is the thing the mark turned into.
    const handoff = docked > 0.88 ? 1 - (docked - 0.88) / 0.12 : 1;
    const s = (scale + (to.scale - scale) * k) * handoff;
    inner.current?.scale.set(s, -s, s);
  });

  return (
    <group ref={group} position={[offsetX, lift, 0]} rotation={[0.3, -0.8, 0]}>
      {/* The sun, as a blade rather than a point. Starts under the mark and dark,
          and is switched off entirely once it has passed over: leaving it in the
          scene at zero intensity still costs a light slot in every compile. */}
      <rectAreaLight
        ref={sun}
        intensity={0}
        color="#ffe6bd"
        width={1.6}
        height={8}
        position={[-1.8, -4.2, 5.4]}
      />
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

export default function Solid({ onReady, onLit, onDocked }) {
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
      <Lockup still={still} started={revealed} onLit={onLit} onDocked={onDocked} />
      <RevealOnFirstFrame onReveal={reveal} />
      {!coarse && <Post />}
    </Canvas>
  );
}
