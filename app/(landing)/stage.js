"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { isCoarsePointer } from "./device";
import { activeVariant } from "./sunrise-variants";

// Read once. See sunrise-variants.js — a dev switch, not a feature.
const V = activeVariant();

export const GOLD = "#cba75f";

// Two golds, because the mark is two surfaces. Sampled off Kalos_3D_Render in
// the brand file rather than picked: the faces average #AC9267 and the lit bevel
// peaks at #F4EEDA. With metalness 1 these are reflectance tints rather than
// diffuse colours, so the brighter bevel tint is what makes the rim read hot
// against a face that stays quiet.
// Where the spin is centred, in the same units. The artwork's viewBox is
// 0 0 150 139 and ExtrudeGeometry writes those coordinates straight into uv, so
// this is simply the middle of the lockup: the gap between the triangle and the
// diamond, which is where the reference's arcs converge.
const MARK_UV_CENTRE = [75, 70];

// Comfortably wider than the caps' UVs actually run. ExtrudeGeometry writes
// shape coordinates into uv, so this mark's caps span roughly its own artwork:
// 0 to 150 across and 3 to 136 down, pulled in by the bevel at every edge.
// Anything mapped onto them is scaled against that rather than against 0..1,
// and rounding the span up to 200 keeps a single tile covering the whole
// surface with no wrap inside it.
//
// This only describes the caps. The side walls are parameterised separately by
// contourUVGenerator in kalos-mark.js and take a map of their own.
const MARK_UV_SPAN = 200;

// Texels between one groove and the next on the faces. See the note where it is
// used: at 1 the finish sat on the pixel grid's own frequency and rendered as a
// bullseye.
const RING_PITCH = V.ringPitch;

export const GOLD_FACE = "#ac9267";
// Brighter than the face and still unmistakably gold. This was #F4EEDA, which is
// the brightest *highlight* on the reference render rather than the bevel's own
// colour, and at metalness 1 the tint is what the surface reflects: a near-white
// tint reflects near-white, so the whole chamfer turned into a solid white band
// with a glow around it. The white belongs where the edge catches the key, and
// nowhere else.
export const GOLD_BEVEL = "#d9b782";
export const BACKDROP = "#060505";

// There is no envMapIntensity on either material any more, and the reason is
// worth keeping, because both of them carried a tuned number that has never once
// reached the shader.
//
// WebGLRenderer.js, every frame and gated on nothing:
//
//   if ( ( material.isMeshStandardMaterial || … ) &&
//        material.envMap === null && scene.environment !== null )
//     m_uniforms.envMapIntensity.value = scene.environmentIntensity;
//
// These materials have no envMap of their own — the light comes from
// scene.environment, which drei's <Environment> sets — so they were taking that
// branch on every draw and rendering at the scene's flat 1.0. The face was
// declared at 1.45 and the bevel at 1.35, and the comment explaining that the
// bevel came down from 1.9 to stop it hazing the bloom pass was describing a
// change that could not have done anything.
//
// Nothing is being restored here. Handing the materials their own envMap would
// make those numbers real for the first time, and measured, it lifts the whole
// mark about 45% above the state that has actually been looked at and approved.
// The difference between the two surfaces is carried by roughness and colour,
// which do work. The sunrise scales scene.environmentIntensity instead.

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


// One run of grooves, as 1D noise.
//
// Smoothed with a three-tap pass because raw per-step noise is a step function:
// it aliases into a shimmer the moment the mark moves. Both surfaces want the
// same profile — the faces sample it by radius and the walls by depth — so the
// smoothing lives here rather than being written out twice.
function grooveProfile(length) {
  const raw = new Float32Array(length);
  for (let i = 0; i < length; i += 1) raw[i] = Math.random();

  const smoothed = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[i];
    const c = raw[Math.min(length - 1, i + 1)];
    smoothed[i] = (a + b + b + c) / 4;
  }
  return smoothed;
}

/**
 * Brushed gold, generated rather than fetched.
 *
 * The reference is not a sandblasted finish, it is a *turned* one: fine grooves
 * running in concentric arcs across the faces, the way a spun metal dial is
 * finished. That difference is the whole character of the surface. Isotropic
 * speckle scatters light evenly and reads as stone or cork; grooves scatter it
 * along one axis, which is what produces the soft sweeping highlight that moves
 * across the face as the mark turns.
 *
 * Two maps come out of this for the faces, because a brushed surface needs both:
 *
 * - a bump map of the grooves themselves, so the geometry of the finish is
 *   visible at close range;
 * - an anisotropy map giving the groove *direction* per texel. Three reads the
 *   red and green channels as a [-1, 1] direction in tangent space and the blue
 *   as strength. A single `anisotropyRotation` can only describe a straight
 *   brush; concentric arcs need the direction to rotate with the angle, which is
 *   exactly what a map is for.
 *
 * And a third for the side walls, which are a different surface in a different
 * space: brushed *along the outline* rather than turned about a centre. They
 * used to be given the faces' map, which meant sampling a pattern of concentric
 * rings through UVs that know nothing about where the centre is. See
 * `contourUVGenerator` in kalos-mark.js for the parameterisation this one is
 * drawn against.
 */
function useBrushedGold() {
  // Fine directional grooves are the worst case for mipmapping: at a grazing
  // angle they blur into flat grey, which is how the last attempt disappeared.
  // Texture-filtering anisotropy is what keeps them legible there.
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const maps = useMemo(() => {
    // Half resolution on a phone. Building this costs 20ms on a desktop, and a
    // mid-range handset is several times slower: that is a main-thread stall
    // landing exactly as the hero tries to appear. A quarter of the pixels puts
    // it back under the noise floor, and the mark is smaller there anyway, so
    // the grooves are still around a texel wide on screen.
    const size = isCoarsePointer() ? 256 : 512;
    const half = size / 2;

    // The faces' profile runs along the radius. A spun finish is constant along
    // any circle and varies across radii, so this is sampled by distance from
    // the centre and nothing else.
    //
    // RING_PITCH is the fix for the bullseye. This used to index the profile with
    // Math.round(r), one groove per texel of radius — and the mark renders at
    // roughly one texel per screen pixel, so the grooves landed a pixel apart.
    // A pattern at the pixel grid's own frequency cannot be drawn; it beats
    // against it, and what you see is concentric moiré rather than a finish. Four
    // texels to a groove puts it back where the screen can resolve it.
    const span = Math.ceil(Math.SQRT2 * half) + 2;
    const rings = Math.ceil(span / RING_PITCH) + 2;
    const groove = grooveProfile(rings);

    const bumpCanvas = document.createElement("canvas");
    const anisoCanvas = document.createElement("canvas");
    bumpCanvas.width = bumpCanvas.height = size;
    anisoCanvas.width = anisoCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext("2d");
    const anisoCtx = anisoCanvas.getContext("2d");
    const bumpData = bumpCtx.createImageData(size, size);
    const anisoData = anisoCtx.createImageData(size, size);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x - half;
        const dy = y - half;
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Rings are true circles. An earlier version perturbed the radius by
        // angle, on the theory that real turning wanders: shifting a ring's
        // *position* by a couple of texels breaks it into something closer to
        // wood grain, which is what made the finish read as abstract rather than
        // machined. Variation belongs in the groove's depth, not its path.
        // Interpolated, not rounded. Math.round is a step function: it draws each
        // groove as a hard band a texel wide, which is half of why this aliased.
        let depth;
        if (V.ringStep) {
          // The original sampling, kept only so the approved commit stays
          // comparable. Math.round draws each groove as a hard band one texel
          // wide, which is half of why it aliased.
          depth = groove[Math.min(rings - 1, Math.round(r))];
        } else {
          const at = Math.min(rings - 2, r / RING_PITCH);
          const i0 = Math.floor(at);
          const f = at - i0;
          depth = groove[i0] + (groove[i0 + 1] - groove[i0]) * f * f * (3 - 2 * f);
        }

        // A slow sweep around the circle, so one side of a ring catches more
        // than the other. Modulates depth only, so the ring stays circular.
        const sweep = 0.76 + 0.24 * (0.5 + 0.5 * Math.sin(angle * 2 + r * 0.01));

        const o = (y * size + x) * 4;
        const v = 150 + depth * 105 * sweep;
        bumpData.data[o] = bumpData.data[o + 1] = bumpData.data[o + 2] = v;
        bumpData.data[o + 3] = 255;

        // The groove runs along the circle, so its direction is the tangent:
        // perpendicular to the radius. Packed from [-1, 1] into [0, 255].
        const tx = -Math.sin(angle);
        const ty = Math.cos(angle);
        anisoData.data[o] = (tx * 0.5 + 0.5) * 255;
        anisoData.data[o + 1] = (ty * 0.5 + 0.5) * 255;
        // Strength eases in from the centre. At r=0 the tangent is undefined and
        // every direction meets, which shows as a pinch if it is left at full.
        anisoData.data[o + 2] = Math.min(1, r / (size / 20)) * 255;
        anisoData.data[o + 3] = 255;
      }
    }
    bumpCtx.putImageData(bumpData, 0, 0);
    anisoCtx.putImageData(anisoData, 0, 0);

    // The walls. u runs around the perimeter and v through the extrusion, so
    // the grooves are rows: one profile across the depth, held all the way
    // round. Nothing here is centred on anything, because an outline has no
    // centre — which is exactly what the faces' map was wrongly assuming it had.
    //
    // A quarter of the faces' resolution across the depth. The wall is 22 units
    // of a mark 150 across and it is mostly seen at a grazing angle, so at 512
    // the grooves would land several to the pixel and average back to flat. The
    // width is small on purpose: nothing varies quickly along the perimeter.
    const wallSpan = size / 4;
    const wallWidth = 64;
    const wallGroove = grooveProfile(wallSpan);

    const wallCanvas = document.createElement("canvas");
    wallCanvas.width = wallWidth;
    wallCanvas.height = wallSpan;
    const wallCtx = wallCanvas.getContext("2d");
    const wallData = wallCtx.createImageData(wallWidth, wallSpan);

    for (let y = 0; y < wallSpan; y += 1) {
      for (let x = 0; x < wallWidth; x += 1) {
        // Groove depth varies slowly along the perimeter, so an edge is not one
        // even corrugation from corner to corner. Periodic in x, so it still
        // meets itself where the outline closes, and sheared by y so the
        // variation does not read as a band running through the extrusion.
        const sweep =
          0.72 +
          0.28 * (0.5 + 0.5 * Math.sin((x / wallWidth) * Math.PI * 4 + y * 0.07));

        const o = (y * wallWidth + x) * 4;
        const v = 150 + wallGroove[y] * 105 * sweep;
        wallData.data[o] = wallData.data[o + 1] = wallData.data[o + 2] = v;
        wallData.data[o + 3] = 255;
      }
    }
    wallCtx.putImageData(wallData, 0, 0);

    const bump = new THREE.CanvasTexture(bumpCanvas);
    const anisotropy = new THREE.CanvasTexture(anisoCanvas);
    const wall = new THREE.CanvasTexture(wallCanvas);

    for (const map of [bump, anisotropy]) {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = maxAnisotropy;
      // Scaled and centred against the geometry's UVs, which are not 0..1 here.
      // ExtrudeGeometry's generateTopUV writes raw shape coordinates straight
      // into uv, so a face's UVs are just its artwork coordinates: the mark's
      // viewBox is 0 0 150 139, which puts its centre at about (75, 70).
      //
      // Without the offset the texture's own centre sits at UV (100, 100),
      // which is off the artwork entirely, so the spin was centred somewhere
      // past the diamond and every arc crossing the mark was a section of a
      // circle whose middle you could not see. That is most of why it read as
      // abstract: a turned finish is only legible when you can tell where it was
      // turned from.
      map.repeat.set(1 / MARK_UV_SPAN, 1 / MARK_UV_SPAN);
      map.offset.set(
        0.5 - MARK_UV_CENTRE[0] / MARK_UV_SPAN,
        0.5 - MARK_UV_CENTRE[1] / MARK_UV_SPAN
      );
    }
    // Direction data, not colour. Three will decode it wrongly otherwise.
    anisotropy.colorSpace = THREE.NoColorSpace;

    // No repeat or offset, unlike the pair above: contourUVGenerator hands the
    // walls a u already counted in whole repeats and a v already normalised
    // across the depth, so the map is used exactly as it is drawn.
    //
    // Clamped through the depth. It tiles around the perimeter and never tiles
    // across the wall, so wrapping there could only ever produce a seam along
    // the chamfer, where it would be most visible.
    wall.wrapS = THREE.RepeatWrapping;
    wall.wrapT = THREE.ClampToEdgeWrapping;
    wall.anisotropy = maxAnisotropy;

    return { bump, anisotropy, wall };
  }, [maxAnisotropy]);

  // CanvasTexture allocates GPU buffers React knows nothing about, and the
  // variant switcher unmounts whole Canvases.
  useEffect(() => {
    const { bump, anisotropy, wall } = maps;
    return () => {
      bump.dispose();
      anisotropy.dispose();
      wall.dispose();
    };
  }, [maps]);

  return maps;
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
  const { bump, anisotropy } = useBrushedGold();
  return (
    <meshPhysicalMaterial
      color={GOLD_FACE}
      metalness={1}
      // Down from 0.58. Anisotropy needs a reasonably tight base lobe to smear
      // in one direction: at 0.58 the reflection is already so diffuse that
      // stretching it changes nothing visible.
      roughness={0.42}
      // The grooves, and the direction they run in.
      //
      // A roughness map alone was invisible here and is gone: it only widens the
      // specular lobe, and against a smooth gradient environment 0.42 and 0.58
      // both reflect a soft blur. The bump map perturbs normals, which scatters
      // the reflection itself. The anisotropy map is what makes it *brushed*
      // rather than merely rough, by telling each texel which way its groove
      // runs.
      // 8 was legible and overdone, 0.55 was invisible. Worth knowing the range
      // is this wide: bumpScale is a derivative multiplier, so a groove one
      // texel across needs a far larger number than a broad dent would.
      // 1.5, down from 2.4 and originally 4.5. The settled state reads fine at
      // 2.4; the dim, grazing phase of the sunrise does not. A light at a shallow
      // angle exaggerates normal perturbation enormously, so what is a soft
      // turning at full light becomes a smeared ripple when the sky is tipped
      // over and dark, and the ripples are the widest thing on the object.
      //
      // Lowered rather than ramped. Ramping the finish during the reveal was
      // tried and rejected: it made the opening look like plastic and left the
      // settled state unchanged, which was fixing the symptom at the wrong end.
      // The owner's judgement on the flatter surface was "a tad flatter, but
      // thats alright" — so the amplitude is where the give is.
      bumpMap={bump}
      bumpScale={V.faceBump}
      anisotropyMap={anisotropy}
      anisotropy={V.faceAnisotropy}
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
  const { wall } = useBrushedGold();
  return (
    <meshPhysicalMaterial
      color={GOLD_BEVEL}
      metalness={1}
      // Not a mirror. At 0.11 the chamfer reflected the key as one flat blown
      // strip; a little roughness gives the highlight a falloff across the
      // chamfer's width, which is what reads as a rounded edge rather than a
      // painted line.
      roughness={0.17}
      // The side walls are brushed too, at a fraction of the faces' strength.
      // The reference shows it clearly on the extruded edge, and without it the
      // walls read as glass next to a machined face. Light, because a chamfer is
      // narrow and anything stronger turns it to corrugation.
      //
      // Its own map, not the faces'. This one is a straight run of grooves in
      // the space contourUVGenerator sets up, so the brushing follows the
      // outline instead of sampling arcs of a circle centred somewhere off the
      // edge of the shape.
      //
      // 0.6, down from 1.4. 1.4 was judged against a wall that was effectively
      // unlit, where it was the difference between seeing the finish and seeing
      // nothing; once the back wash gave the wall something to reflect the same
      // number read as corrugation. Worth remembering for the faces too: bump
      // amplitude can only be judged on a surface that is actually lit.
      bumpMap={wall}
      bumpScale={0.6}
      // A little anisotropy on the edge, and now without a map for the right
      // reason rather than as an approximation: u runs along the perimeter
      // everywhere on the wall, so the tangent three derives from the UVs is
      // already the brush direction and no rotation off it is wanted. This was
      // a quarter turn, which was the best guess available while the UVs were
      // built out of world position and pointed at nothing in particular.
      anisotropy={0.45}
      anisotropyRotation={0}
      // An envMapIntensity used to sit here, and a note explaining it had come
      // down from 1.9 because the bevel feeds the bloom pass and a long strip of
      // it past the luminance threshold hazed the faces. That observation was
      // probably real; the attribution was not. See the block at the top of this
      // file: neither material's envMapIntensity has ever reached the shader.
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

      {/* The back wash, and the reason the mark reads as a solid rather than a
          sheet.

          Every source above sits in front of the mark, which is right for the
          faces and leaves the walls with nothing at all. At metalness 1 a wall
          reflects whatever lies along its mirror direction, and for a slab
          turned only a little that direction is very nearly straight backwards
          — the mark drifts about 0.26rad on its own, so at rest the walls were
          mirroring empty space behind the scene. Measured on the diamond's edge:
          the wall came out at luminance 12 against a background of 16. The side
          of the object was darker than the backdrop it sat on, so the silhouette
          had no thickness and the whole thing read flat at a glance.

          Broad and well behind, because that mirror direction sweeps from
          straight back towards the sides as the mark turns, and one panel
          spanning the whole arc keeps the edge lit through the entire range
          rather than lighting up at one angle. The smaller, brighter one off to
          the left gives the band a gradient across it; a single source leaves
          the wall one flat value, which reads as a printed outline.

          Dim on purpose, and this is the number most worth arguing with: the
          wall now measures 69 against a face at 122, a little under 60%. The
          reference render sits nearer 22% — but that is what was already here,
          and it is what "flat" looked like, because the reference is tilted hard
          over with a wide wall and a floor under it while ours sits nearly
          face-on. Raise or lower these two to move it.

          The faces do not move: 122 with these off, 122 with them on. They are
          nearly edge-on to a face, so a face gathers almost nothing from them
          even at its wider cone. */}
      <Lightformer
        form="rect"
        intensity={0.25}
        color="#b59470"
        position={[0, 0, -6.5]}
        scale={[20, 14, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#e0b47a"
        position={[-5, 1.5, -5]}
        scale={[5, 8, 1]}
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
