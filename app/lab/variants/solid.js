"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMarkFit, useMarkGeometries } from "../kalos-mark";
import { GoldEnvironment, GoldMaterial, Post, damp, pointerLive, usePointer } from "../stage";
import { getTilt, isCoarsePointer, prefersReducedMotion } from "../device";

function Lockup({ still }) {
  const geometries = useMarkGeometries();
  const { scale, lift } = useMarkFit();
  const group = useRef();
  const pointer = usePointer();

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const tilt = getTilt();

    // Input priority: an active cursor or finger wins, then the gyroscope, then
    // the idle drift. Deliberately ordered that way — a deliberate drag should
    // always override whatever angle the handset happens to be held at.
    const live = pointerLive(p);
    const source = live ? p : tilt.active ? tilt : null;

    // Kept deliberately shallow. Past about 0.3rad the triangle foreshortens far
    // enough that it stops reading as the logo and starts reading as a kite.
    const targetY = source ? source.x * 0.46 : Math.sin(t * 0.34) * 0.26;
    const targetX = source ? -source.y * 0.32 : Math.sin(t * 0.23) * 0.13;

    // The initial rotation is off-target, so this same damp doubles as the
    // entrance: the mark swings into place instead of popping in.
    g.rotation.y = damp(g.rotation.y, still ? 0 : targetY, 3.2, delta);
    g.rotation.x = damp(g.rotation.x, still ? 0 : targetX, 3.2, delta);
    g.position.y = lift + (still ? 0 : Math.sin(t * 0.55) * 0.05);
  });

  return (
    <group ref={group} position={[0, lift, 0]} rotation={[0.3, -0.8, 0]}>
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

export default function Solid() {
  // Read once at mount rather than per frame: neither answer changes while the
  // hero is on screen, and both feed props that shouldn't thrash.
  const [coarse] = useState(isCoarsePointer);
  const [still] = useState(prefersReducedMotion);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 30 }}
      // Phone screens are often 3x. Rendering a bloom chain at native density
      // burns frames for detail nobody can resolve at arm's length.
      dpr={[1, coarse ? 1.75 : 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <GoldEnvironment />
      <Lockup still={still} />
      <Post multisampling={coarse ? 0 : 4} />
    </Canvas>
  );
}
