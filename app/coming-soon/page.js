"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

const IDLE_MS = 1600;
const MIN_RADIUS = 90;
const GLOW_SCALE = 2.6;

export default function Spotlight() {
  const reduced = useReducedMotion();
  const wordRef = useRef(null);
  const lastMove = useRef(-Infinity);
  const startedAt = useRef(null);
  const [radius, setRadius] = useState(MIN_RADIUS);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 160, damping: 24, mass: 0.6 });
  const smoothY = useSpring(y, { stiffness: 160, damping: 24, mass: 0.6 });

  // The lens is a fixed circular mask that MOVES; the content inside counter-moves
  // by the same amount, so the wordmark stays put while the light travels. Both are
  // pure transforms — the mask rasterizes once instead of on every frame the way an
  // animated mask-image does, which is what makes this cheap enough for a phone.
  // Radius is applied as a margin rather than folded into the transform, so these
  // stay simple negations that can't capture a stale radius.
  const negX = useTransform(smoothX, (v) => -v);
  const negY = useTransform(smoothY, (v) => -v);

  // Size the light off the wordmark itself, not the viewport — that keeps the reveal
  // reading as a spotlight at every breakpoint instead of swallowing the whole word.
  useEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    const measure = () =>
      setRadius(Math.max(MIN_RADIUS, Math.round(el.offsetWidth * 0.5)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    x.jump(cx);
    y.jump(cy);
    smoothX.jump(cx);
    smoothY.jump(cy);

    const onMove = (e) => {
      lastMove.current = performance.now();
      x.set(e.clientX);
      y.set(e.clientY);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [x, y, smoothX, smoothY]);

  // With no pointer to follow — idle, or a touch device between drags — the light
  // drifts on its own so the page is never just a dim word sitting there. sin()
  // starts at zero offset and the amplitude ramps in, so it eases out from centre
  // during the entrance instead of bolting to the edge on first paint.
  useAnimationFrame((t) => {
    if (reduced) return;
    if (startedAt.current === null) startedAt.current = t;
    if (performance.now() - lastMove.current < IDLE_MS) return;

    const elapsed = t - startedAt.current;
    const ramp = Math.min(1, Math.max(0, (elapsed - 1400) / 2600));
    const w = window.innerWidth;
    const h = window.innerHeight;

    x.set(w / 2 + Math.sin(elapsed / 2600) * w * 0.2 * ramp);
    y.set(h / 2 + Math.sin(elapsed / 1900) * h * 0.09 * ramp);
  });

  const diameter = radius * 2;
  const glow = Math.round(radius * GLOW_SCALE);

  // Note: no reduced-motion branch in the markup. useReducedMotion() is false on
  // the server and true on the client, so branching here renders two different
  // trees and trips a hydration mismatch. The static state is a CSS media query
  // instead; JS only stops the drift.
  return (
    <main>
      <div className="spot-grain" aria-hidden />

      <motion.div
        aria-hidden
        className="spot-glow"
        style={{
          x: smoothX,
          y: smoothY,
          width: glow,
          height: glow,
          marginLeft: -glow / 2,
          marginTop: -glow / 2,
        }}
      />

      <div className="spot-layer base">
        <h1 ref={wordRef}>kalos</h1>
        <p>coming soon</p>
      </div>

      <motion.div
        aria-hidden
        className="spot-lens"
        style={{
          x: smoothX,
          y: smoothY,
          width: diameter,
          height: diameter,
          marginLeft: -radius,
          marginTop: -radius,
        }}
      >
        <motion.div
          className="spot-lens-inner"
          style={{ x: negX, y: negY, marginLeft: radius, marginTop: radius }}
        >
          <div className="spot-layer lit">
            <h1>kalos</h1>
            <p>coming soon</p>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
