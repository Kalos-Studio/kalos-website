"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * The zero-WebGL option: the finished Figma render, given depth with transforms.
 *
 * Worth keeping in the comparison because it costs nothing — no three.js in the
 * bundle, no GPU work, no first-frame compile — and on a hero that's mostly seen
 * for three seconds on a phone, that can beat real geometry. The ceiling is
 * obviously lower: the lighting is baked, so the highlight can only be faked.
 *
 * The sheen works because both the render's background and the page are black,
 * and `screen` blending leaves black untouched — so a white gradient brightens
 * only the gold, and the square edges of the PNG never show.
 */
export default function Parallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const spring = { stiffness: 120, damping: 20, mass: 0.8 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  const rotateY = useTransform(sx, [-1, 1], [14, -14]);
  const rotateX = useTransform(sy, [-1, 1], [-12, 12]);

  // The image drifts against the tilt, which is what separates it from the
  // backdrop and reads as depth rather than as a rotating photograph.
  const driftX = useTransform(sx, [-1, 1], [26, -26]);
  const driftY = useTransform(sy, [-1, 1], [18, -18]);

  const sheenX = useTransform(sx, [-1, 1], [15, 85]);
  const sheenY = useTransform(sy, [-1, 1], [85, 15]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,240,205,0.26) 0%, rgba(255,225,170,0.09) 20%, transparent 46%)`;

  const glowX = useTransform(sx, [-1, 1], [40, 60]);
  const glowY = useTransform(sy, [-1, 1], [60, 40]);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(150,105,45,0.5) 0%, rgba(70,45,18,0.22) 35%, transparent 68%)`;

  useEffect(() => {
    const onMove = (event) => {
      x.set((event.clientX / window.innerWidth) * 2 - 1);
      y.set(-((event.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [x, y]);

  return (
    <div className="px-scene">
      <motion.div className="px-glow" style={{ backgroundImage: glow }} />
      <motion.div
        className="px-tilt"
        style={{ rotateX, rotateY, x: driftX, y: driftY }}
      >
        <img src="/kalos-3d-render.jpg" alt="" draggable={false} />
        <motion.div className="px-sheen" style={{ backgroundImage: sheen }} />
      </motion.div>
    </div>
  );
}
