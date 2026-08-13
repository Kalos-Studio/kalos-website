"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { shapeOffsets, useMarkFit, useMarkGeometries } from "../kalos-mark";
import { GoldEnvironment, GoldMaterial, damp, pointerLive, usePointer } from "../stage";
import {
  getTilt,
  isCoarsePointer,
  prefersReducedMotion,
  usePageVisible,
} from "../device";

// Dynamic so phones never download the postprocessing chunk — see post.js.
const Post = dynamic(() => import("../post"), { ssr: false });

// Geometry-space units (the mark is ~150 wide), so these read as a fraction of
// the lockup rather than as absolute distances.
const ENTRANCE_SPREAD = 260;
const DRIFT = 7;
const STRETCH = 11;

/**
 * The two shapes are treated as separate objects with different mass.
 *
 * The diamond is small, so it's given a much lower damping constant — it chases
 * the cursor eagerly while the triangle lumbers after it. That difference is the
 * effect: the lockup pulls apart under the pointer and snaps back into its
 * designed relationship the moment you stop moving.
 *
 * The motion is decomposed into two terms rather than a single "lean toward the
 * cursor", which is what the first version did and why the shapes could end up
 * stacked on top of each other: with a shared lean the right-hand shape simply
 * caught up to the left-hand one whenever the cursor went left.
 *
 *   drift   — signed, applied equally to both, so the lockup tracks the pointer
 *   stretch — unsigned magnitude, applied along each shape's OWN outward axis
 *
 * Because stretch is built from absolute values and multiplied by the shape's
 * outward direction, it can only ever increase the gap. The shapes are
 * mathematically incapable of crossing, at any cursor position.
 */
function Lockup({ still }) {
  const geometries = useMarkGeometries();
  const offsets = useMemo(() => shapeOffsets(geometries), [geometries]);

  // Each shape spins about its own centre, so the geometry is shifted onto the
  // origin and the offset is re-applied on the parent — rotating around the
  // shared lockup centre would swing the diamond in an arc instead.
  //
  // Memoised, not cloned inline in the JSX: doing it in the render body forged a
  // fresh pair of GPU buffers on every re-render (every viewport resize) and
  // orphaned the previous pair.
  const centred = useMemo(
    () =>
      geometries.map((geometry, i) => {
        const clone = geometry.clone();
        clone.translate(-offsets[i].x, -offsets[i].y, -offsets[i].z);
        return clone;
      }),
    [geometries, offsets]
  );

  useEffect(() => {
    return () => {
      for (const geometry of centred) geometry.dispose();
    };
  }, [centred]);
  const { scale, lift } = useMarkFit();
  const meshes = useRef([]);
  const pointer = usePointer();
  const spread = useRef(ENTRANCE_SPREAD);

  // Heavier shape first, to match the geometry order (triangle, then diamond).
  const inertia = [2.4, 4.6];
  const reach = [0.7, 1.3];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const tilt = getTilt();
    // Same input priority as Solid: cursor, then gyroscope, then idle.
    const source = pointerLive(pointer.current)
      ? pointer.current
      : tilt.active
        ? tilt
        : null;
    const p = source ?? pointer.current;
    const live = Boolean(source) && !still;

    // Entrance: the shapes start flung out along their own axis and converge.
    spread.current = damp(spread.current, 0, 1.6, delta);

    for (let i = 0; i < meshes.current.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;

      // -1 for the triangle (left of centre), +1 for the diamond.
      const dir = Math.sign(offsets[i].x) || 1;

      const drift = live ? p.x * DRIFT : Math.sin(t * 0.4) * 2;
      // Idle breathing is allowed to go slightly negative, but only by a couple
      // of units against a 14-unit gap, so the shapes still never touch.
      const stretch = live
        ? Math.abs(p.x) * STRETCH + Math.abs(p.y) * 5
        : Math.sin(t * (0.3 + i * 0.11)) * 2.5;

      const targetX = drift + dir * (stretch + spread.current);
      const targetY = live
        ? -p.y * 6 * reach[i]
        : Math.sin(t * (0.45 + i * 0.13)) * 3;

      mesh.position.x = damp(mesh.position.x, still ? 0 : targetX, inertia[i], delta);
      mesh.position.y = damp(mesh.position.y, still ? 0 : targetY, inertia[i], delta);

      const targetSpin = live ? p.x * 0.42 * reach[i] : Math.sin(t * 0.3) * 0.22;
      const targetTilt = live ? -p.y * 0.3 * reach[i] : Math.sin(t * 0.24) * 0.12;
      mesh.rotation.y = damp(mesh.rotation.y, still ? 0 : targetSpin, inertia[i], delta);
      mesh.rotation.x = damp(mesh.rotation.x, still ? 0 : targetTilt, inertia[i], delta);
    }
  });

  return (
    <group position={[0, lift, 0]} scale={[scale, -scale, scale]}>
      {centred.map((geometry, i) => {
        // Sit the two shapes on slightly different planes. Belt-and-braces
        // against interpenetration once they're tilting independently, and it
        // gives the lockup a bit of depth as a bonus.
        const dir = Math.sign(offsets[i].x) || 1;
        const z = offsets[i].z + dir * 6;

        return (
          <group key={i} position={[offsets[i].x, offsets[i].y, z]}>
            <mesh ref={(el) => (meshes.current[i] = el)} geometry={geometry}>
              <GoldMaterial />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function Magnet() {
  const [coarse] = useState(isCoarsePointer);
  const [still] = useState(prefersReducedMotion);
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 30 }}
      dpr={[1, coarse ? 1.75 : 2]}
      frameloop={visible ? "always" : "never"}
      gl={{
        antialias: true,
        powerPreference: coarse ? "default" : "high-performance",
      }}
    >
      <GoldEnvironment />
      <Lockup still={still} />
      {!coarse && <Post />}
    </Canvas>
  );
}
