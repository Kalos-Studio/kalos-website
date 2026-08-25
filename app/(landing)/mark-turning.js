"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMarkGeometries } from "./kalos-mark";
import { GoldBevelMaterial, GoldEnvironment, GoldFaceMaterial } from "./stage";
import { prefersReducedMotion } from "./device";

/**
 * The second mark, beside the dictionary entry, turning on its vertical axis.
 *
 * The mock annotates this one "rotates on the vertical axis" with no alternative
 * offered, unlike the hero mark, so it is the one place on the page where the
 * object turns by itself rather than because someone moved something. That is
 * the point of it: the hero mark answers to you, this one does not, and having
 * both says more about the object than either says alone.
 *
 * A separate Canvas rather than a second mesh in the hero's. They are 3000px
 * apart on a scrolling page, so one canvas spanning both would have to be the
 * height of the document and rendering continuously while most of it is off
 * screen. Two contexts is the cheaper of the two once the section is anywhere
 * but in view — and this one only mounts when it is.
 */

// Slow. A logo spinning at any speed you would notice reads as a loading
// spinner, and this one has to sit behind body copy for as long as someone takes
// to read three paragraphs.
const TURN_RATE = 0.28;

function Turning({ still }) {
  const geometries = useMarkGeometries();
  const group = useRef();

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || still) return;
    g.rotation.y += delta * TURN_RATE;
  });

  return (
    // Scaled to sit inside a 7:6 box with clear air around it, and started at an
    // angle so the first frame shows the extrusion rather than a flat face.
    <group ref={group} rotation={[0.16, -0.6, 0]}>
      <group scale={[0.019, -0.019, 0.019]}>
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

export default function MarkTurning() {
  // Read once. Reduced motion silences the turn, because this is motion the page
  // starts by itself — the distinction solid.js draws, where a visitor's own
  // input is never silenced. Nothing here is driven by input, so all of it goes.
  const still = useRef(prefersReducedMotion()).current;

  return (
    <Canvas
      className="ln-mark-canvas"
      camera={{ position: [0, 0, 8], fov: 30 }}
      // Lower than the hero's ceiling. This is a decorative object beside body
      // copy, not the thing the page is about.
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "default" }}
    >
      <GoldEnvironment />
      <Turning still={still} />
    </Canvas>
  );
}
