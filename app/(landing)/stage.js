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
// Comfortably wider than the mark's UVs actually run. ExtrudeGeometry writes
// shape coordinates into uv, and a probe put this mark's range at about -22 to
// 158, so anything mapped onto it is scaled against that rather than 0..1.
// Rounding up to 200 leaves room for the bevel's negative coordinates, which is
// what keeps a single tile covering the whole surface with no wrap inside it.
const MARK_UV_SPAN = 200;

export const GOLD_FACE = "#ac9267";
// Brighter than the face and still unmistakably gold. This was #F4EEDA, which is
// the brightest *highlight* on the reference render rather than the bevel's own
// colour, and at metalness 1 the tint is what the surface reflects: a near-white
// tint reflects near-white, so the whole chamfer turned into a solid white band
// with a glow around it. The white belongs where the edge catches the key, and
// nowhere else.
export const GOLD_BEVEL = "#d9b782";
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
    const size = 512;

    // Noise at full resolution, then blurred slightly, rather than low-res noise
    // scaled up. Both give the correlation a height field needs, and they do not
    // look the same: a bilinear upscale of 200px noise produces blobs four or
    // five pixels wide, which renders as cork. Blurring full-res noise keeps the
    // grain at roughly a pixel, which is the scale the reference has and the
    // smallest that survives without shimmering when the mark turns.
    const source = document.createElement("canvas");
    source.width = source.height = size;
    const sctx = source.getContext("2d");
    const image = sctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 110 + Math.random() * 145;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    sctx.putImageData(image, 0, 0);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.filter = "blur(0.7px)";
    ctx.drawImage(source, 0, 0);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;

    // Scaled against the geometry's UV range, which is not 0..1 here.
    // ExtrudeGeometry's default UV generator writes raw shape coordinates
    // straight into uv, so a probe put this mark's range at about -22 to 158.
    // The first version set repeat to 18, which tiled the noise roughly 2,700
    // times across the mark: far under one pixel per texel, so mipmapping
    // averaged it to flat grey and the faces rendered perfectly smooth.
    //
    // One tile across the whole span, deliberately. At three tiles the wrap seam
    // showed as a hairline straight down the face, because the noise does not
    // meet itself at the edges.
    map.repeat.set(1 / MARK_UV_SPAN, 1 / MARK_UV_SPAN);
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
      // Both maps, from the same noise, because they do different jobs and only
      // one of them was ever going to be visible.
      //
      // A roughness map widens the specular lobe. Against a smooth gradient
      // environment that is almost invisible: roughness 0.41 and 0.58 both
      // reflect a soft blur, so the surface stayed perfectly flat no matter how
      // the map was scaled. Measured as high-frequency energy, the faces sat at
      // 0.57 against the reference's 1.65 whether the map was tiled 2,700 times
      // or twice.
      //
      // A bump map perturbs the normals instead, which scatters the reflection
      // itself, and that is what actually reads as a machined surface. Kept low:
      // this is a finish, and at any strength it starts to look hammered.
      roughnessMap={grain}
      bumpMap={grain}
      bumpScale={1.3}
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
      // Not a mirror. At 0.11 the chamfer reflected the key as one flat blown
      // strip; a little roughness gives the highlight a falloff across the
      // chamfer's width, which is what reads as a rounded edge rather than a
      // painted line.
      roughness={0.17}
      // A little anisotropy left on the edge only. It stretches the highlight
      // along the chamfer instead of pooling it in one spot, which is what makes
      // the rim read as a continuous line around the shape.
      anisotropy={0.45}
      anisotropyRotation={Math.PI / 2}
      // Was 1.9. The bevel also feeds the bloom pass, so a long strip of it far
      // past the luminance threshold turned a rim light into a haze that washed
      // across the faces and hid the matte finish that was the point.
      envMapIntensity={1.35}
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
