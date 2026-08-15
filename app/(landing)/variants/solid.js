"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMarkFit, useMarkGeometries } from "../kalos-mark";
import { GoldEnvironment, GoldMaterial, damp, pointerLive, usePointer } from "../stage";
import {
  getTilt,
  isCoarsePointer,
  prefersReducedMotion,
  usePageVisible,
} from "../device";

// Dynamic so phones never download the postprocessing chunk — see post.js.
const Post = dynamic(() => import("../post"), { ssr: false });

function Lockup({ still, started }) {
  const geometries = useMarkGeometries();
  const { scale, lift, offsetX } = useMarkFit();
  const group = useRef();
  const pointer = usePointer();

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
    if (!started) return;

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
    const targetY = source ? source.x * swing : Math.sin(t * 0.34) * 0.26;
    const targetX = source ? -source.y * swing * 0.7 : Math.sin(t * 0.23) * 0.13;

    // Damping tuned for a mouse feels like treacle on a gyroscope — you move the
    // phone and the mark arrives a beat later. Tighter when the sensor is
    // driving, but not so tight that sensor noise becomes visible jitter.
    const lambda = gyro ? 6 : 3.2;

    // The initial rotation is off-target, so this same damp doubles as the
    // entrance: the mark swings into place instead of popping in.
    g.rotation.y = damp(g.rotation.y, still ? 0 : targetY, lambda, delta);
    g.rotation.x = damp(g.rotation.x, still ? 0 : targetX, lambda, delta);
    g.position.y = lift + (still ? 0 : Math.sin(t * 0.55) * 0.05);
  });

  return (
    <group ref={group} position={[offsetX, lift, 0]} rotation={[0.3, -0.8, 0]}>
      <group scale={[scale, -scale, scale]}>
        {geometries.map((geometry, i) => (
          <mesh key={i} geometry={geometry}>
            <GoldMaterial />
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

export default function Solid({ onReady }) {
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
      <Lockup still={still} started={revealed} />
      <RevealOnFirstFrame onReveal={reveal} />
      {!coarse && <Post />}
    </Canvas>
  );
}
