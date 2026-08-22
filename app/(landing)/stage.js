"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";

export const GOLD = "#cba75f";

// Two golds, because the mark is two surfaces. Sampled off Kalos_3D_Render in
// the brand file rather than picked: the faces average #AC9267 and the lit bevel
// peaks at #F4EEDA. With metalness 1 these are reflectance tints rather than
// diffuse colours, so the brighter bevel tint is what makes the rim read hot
// against a face that stays quiet.
export const GOLD_FACE = "#ac9267";
export const GOLD_BEVEL = "#f4eeda";
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
 * Fine grain for the faces, generated rather than fetched.
 *
 * The reference render is sandblasted: the faces are not a flat matte, they have
 * a visible micro-texture that breaks the reflection up at close range. A
 * roughness map does that, and three multiplies `roughness` by this texture's
 * green channel, so the values are deliberately kept high and narrow (0.82 to
 * 1.0). Wider than that and the face starts to look dirty rather than machined.
 *
 * Built on a canvas at runtime for the same reason the mark's geometry is inline
 * rather than loaded: nothing about the hero should wait on a network round trip
 * before it can draw.
 */
function useGoldGrain() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 209 + Math.random() * 46; // 0.82 to 1.0 of full roughness
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    // The mark is roughly 150 units across, so this lands the grain at a size
    // that reads as texture rather than as noise.
    map.repeat.set(18, 18);
    return map;
  }, []);

  // CanvasTexture allocates a GPU buffer React knows nothing about, and the
  // variant switcher unmounts whole Canvases.
  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

/**
 * The faces: matte, and the larger surface by far.
 *
 * metalness 1 means `color` is the reflectance tint rather than a diffuse
 * colour, so everything you see is the environment. That is why the lighting rig
 * below matters more than any of these numbers.
 *
 * Roughness went from 0.28 to 0.58. At 0.28 the whole mark was one polished
 * surface and read as plastic, and the bevel had nothing to contrast against.
 * The anisotropy went with it: a sandblasted finish scatters evenly, so smearing
 * the highlight along one axis was fighting the look the reference actually has.
 */
export function GoldFaceMaterial(props) {
  const grain = useGoldGrain();
  return (
    <meshPhysicalMaterial
      color={GOLD_FACE}
      metalness={1}
      roughness={0.58}
      roughnessMap={grain}
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
 * The bevel and side walls: polished, and the reason the mark reads as metal.
 *
 * This is the whole of the designer's note about light being contoured around
 * the edges. A single material cannot do it, because the effect is a difference
 * between two surfaces rather than a lighting trick: the chamfer is smooth
 * enough to mirror the key light into a hard line while the face beside it
 * scatters. Making it a material property is also why it survives being turned.
 * ExtrudeGeometry emits the caps as group 0 and the side walls as group 1, so
 * the split is free.
 */
export function GoldBevelMaterial(props) {
  return (
    <meshPhysicalMaterial
      color={GOLD_BEVEL}
      metalness={1}
      roughness={0.11}
      // A little anisotropy left on the edge only. It stretches the highlight
      // along the chamfer instead of pooling it in one spot, which is what makes
      // the rim read as a continuous line around the shape.
      anisotropy={0.45}
      anisotropyRotation={Math.PI / 2}
      envMapIntensity={1.9}
      side={THREE.DoubleSide}
      {...props}
    />
  );
}

/**
 * Kept so nothing that only wants "the gold" has to know about the split.
 */
export function GoldMaterial(props) {
  return <GoldFaceMaterial {...props} />;
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
        intensity={2.9}
        color="#fff1d5"
        position={[-2.6, 3.2, 6.5]}
        scale={[6.5, 6.5, 1]}
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

      {/* Broad, dim, near-neutral fill, and it exists because of the matte
          faces rather than for its own sake.

          A rough surface samples a wide cone of the environment, so once the
          faces went from 0.28 to 0.58 roughness they stopped gathering the key
          softbox and started gathering the #16100a surround, which is why they
          came out at #754C23 against the reference's #846E4C: too dark, and far
          too orange. The tint was never the problem, the environment was.

          Large and weak on purpose. The bevel samples a narrow cone and barely
          sees this, so it lifts the faces without washing out the rim, which is
          the one thing a global exposure change could not do. */}
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#ddd9d2"
        position={[1.5, 0.5, 7.5]}
        scale={[16, 12, 1]}
      />

      {/* Warm bounce from below right, so the underside reads as bronze rather
          than as shadow. */}
      <Lightformer
        form="rect"
        intensity={1.0}
        color="#c0905c"
        position={[4.5, -3, 3]}
        scale={[7, 7, 1]}
      />

      {children}
    </Environment>
  );
}

// Frame-rate-independent easing. The usual `current += (target - current) * k`
// is tied to frame rate, which makes the same motion feel different on a 120Hz
// display than on a 60Hz one.
export function damp(current, target, lambda, delta) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}
