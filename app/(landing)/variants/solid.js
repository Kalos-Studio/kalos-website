"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMarkFit, useMarkGeometries } from "../kalos-mark";
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
const SUNRISE_START = 0.06;

function applySunrise(scene, sun, t) {
  // Smoothstep, slow at both ends.
  //
  // This was an ease-out, on the theory that light should arrive fast and settle
  // slowly, and it measured badly: 1-(1-t)^3 is already at 0.58 a quarter of the
  // way through, so the mark was fully lit within the first half second of a
  // three and a half second animation and the rest was a very slow nothing.
  // Pinned at ?dawn=0.25 it measured mean luminance 143 against a finished 148.
  // Dawn does not work like that. The sky spends most of its time getting
  // slightly less dark.
  const eased = t * t * (3 - 2 * t);
  const lift = SUNRISE_START + (1 - SUNRISE_START) * eased;

  // The sky filling in, as one number on the scene rather than a value per
  // material. That is not a shortcut, it is the only lever that works here:
  // WebGLRenderer.js does this every frame, gated on nothing —
  //
  //   if ( ( material.isMeshStandardMaterial || … ) &&
  //        material.envMap === null && scene.environment !== null )
  //     m_uniforms.envMapIntensity.value = scene.environmentIntensity;
  //
  // so while these materials have no envMap of their own, any envMapIntensity
  // they declare is overwritten before it reaches the shader. See stage.js,
  // where two carefully tuned values were being discarded exactly this way.
  scene.environmentIntensity = lift;

  if (!sun) return;
  // The sun itself. Climbs from below the mark to above it, brightest halfway up
  // where it rakes hardest across the faces, and gone by the end, leaving the
  // environment doing all the work — which is the state the material was tuned
  // in. At metalness 1 there is no diffuse term, so a direct light shows up
  // purely as a moving specular, which is the "glisten" the annotation asks for.
  sun.position.set(-2.2, -3.4 + eased * 8, 3.6);
  sun.intensity = Math.sin(Math.PI * eased) * 2.6;
}

function Lockup({ still, started, onLit }) {
  const geometries = useMarkGeometries();
  const { scale, lift, offsetX } = useMarkFit();
  const group = useRef();
  const sun = useRef();
  const pointer = usePointer();

  // Read once, at mount: how long the sunrise runs is a per-session decision and
  // must not change under the animation. Held in a ref rather than state because
  // the frame loop is the only reader and re-rendering the tree to carry a
  // number the GPU already has would be waste.
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
  });

  return (
    <group ref={group} position={[offsetX, lift, 0]} rotation={[0.3, -0.8, 0]}>
      {/* The sun. Starts under the mark and dark, and is switched off entirely
          once it has passed over: leaving it in the scene at zero intensity
          still costs a light slot in every shader compile. */}
      <directionalLight ref={sun} intensity={0} color="#ffdca8" position={[-2.2, -3.4, 3.6]} />
      <group scale={[scale, -scale, scale]}>
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
