"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

export const GOLD = "#cba75f";
export const BACKDROP = "#060505";

// How long after the last pointer event the mark goes back to drifting on its
// own. This is what makes touch work: a finger produces pointer events only while
// it's down, and `pointerleave` never fires, so without a timeout the mark would
// freeze wherever the last tap left it.
export const POINTER_IDLE_MS = 2200;

/**
 * Pointer position normalised to -1..1, held in a ref rather than state.
 *
 * Hero motion runs off useFrame, so it reads this every frame anyway; putting it
 * in state would re-render the whole tree on every mouse move for no benefit.
 */
export function usePointer() {
  const pointer = useRef({ x: 0, y: 0, last: -Infinity });

  useEffect(() => {
    const onMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
      pointer.current.last = performance.now();
    };
    const onLeave = () => {
      pointer.current.last = -Infinity;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return pointer;
}

export function pointerLive(pointer) {
  return performance.now() - pointer.last < POINTER_IDLE_MS;
}


/**
 * The gold itself.
 *
 * metalness: 1 means `color` is the reflectance tint rather than a diffuse
 * colour, so everything you actually see is the environment. That's why the
 * lighting rig below matters more than any of these numbers.
 */
export function GoldMaterial(props) {
  return (
    <meshPhysicalMaterial
      color={GOLD}
      metalness={1}
      roughness={0.28}
      // Brushed rather than mirror-polished — this smears the highlight along one
      // axis the way the turned-metal finish in the render does.
      anisotropy={0.7}
      anisotropyRotation={Math.PI / 2}
      envMapIntensity={1.45}
      // The mark is mirrored on Y to convert SVG's y-down space to three's y-up.
      // A mirror inverts winding, so backface culling would eat the front faces;
      // DoubleSide keeps them and lets the shader flip normals per-face instead.
      side={THREE.DoubleSide}
      {...props}
    />
  );
}

/**
 * A cubemap built from in-scene emissive planes instead of a downloaded HDRI.
 *
 * Two reasons over `<Environment preset>`: no CDN fetch on first paint, and the
 * highlights are authored rather than inherited — the narrow hot strip is what
 * draws the bright edge down the triangle in the Figma render, and being able to
 * aim it is the whole trick.
 */
export function GoldEnvironment({ frames = 1, resolution = 256, children }) {
  // Resolution is a one-time bake at frames={1}, so there's no reason to drop it
  // on mobile — and dropping it measurably dims the metal, because the narrow
  // hot lightformer gets averaged away into too few texels.
  return (
    <Environment frames={frames} resolution={resolution}>
      {/* The surround the metal reflects everywhere it isn't catching a source.
          Pure black here made the first pass read as charcoal rather than gold —
          at metalness 1 there's no diffuse term to fall back on, so an unlit face
          reflects exactly this and nothing else. */}
      <color attach="background" args={["#16100a"]} />

      {/* Key softbox, in FRONT of the mark. This is the one that actually makes
          the faces read as brushed gold: the flat faces point at the camera, so
          what they show is whatever sits behind it. Deliberately off-axis —
          dead centre lights every face identically and the mark flattens into one
          solid yellow shape.

          Note none of these carry a `rotation` — Lightformer aims itself at
          `target` (the origin), and passing a rotation fights that. */}
      <Lightformer
        form="rect"
        intensity={1.7}
        color="#fff1d5"
        position={[-2, 3, 6.5]}
        scale={[9, 9, 1]}
      />

      {/* The hot rim: narrow, very bright, raking from the upper left so it
          grazes the bevel instead of washing the face. */}
      <Lightformer
        form="rect"
        intensity={18}
        color="#fffaf0"
        position={[-3.5, 3, 3.5]}
        scale={[0.5, 7, 1]}
      />

      {/* Top edge catch. */}
      <Lightformer
        form="rect"
        intensity={7}
        color="#fff6e4"
        position={[0, 5, 1.5]}
        scale={[7, 0.5, 1]}
      />

      {/* Warm bounce from below right, so the underside reads as bronze rather
          than as shadow. */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#c98a3c"
        position={[4.5, -3, 3]}
        scale={[7, 7, 1]}
      />

      {children}
    </Environment>
  );
}

/**
 * Bloom is what sells the metal, but it has to hug the edge it came from.
 *
 * A wide radius blurs the hot rim so far from the geometry that the glow detaches
 * and reads as a stray grey smudge floating off the shape — which is exactly the
 * "weird gold shadow" this used to produce. Keeping the radius tight and the
 * threshold high confines it to the blown-out specular on the bevel.
 */
export function Post({ intensity = 0.55, multisampling = 4 }) {
  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom
        mipmapBlur
        intensity={intensity}
        luminanceThreshold={0.95}
        luminanceSmoothing={0.12}
        radius={0.4}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.7} />
    </EffectComposer>
  );
}

// Frame-rate-independent easing. The usual `current += (target - current) * k`
// is tied to frame rate, which makes the same motion feel different on a 120Hz
// display than on a 60Hz one.
export function damp(current, target, lambda, delta) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}
