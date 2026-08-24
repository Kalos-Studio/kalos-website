import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

// The two subpaths of Kalos_Mono, lifted verbatim from the Figma export. Keeping
// the raw `d` strings here rather than fetching the SVG at runtime means the hero
// geometry is available on first frame — no network round-trip before the mark
// can appear, and no flash of an empty canvas.
export const TRIANGLE_PATH =
  "M62.6123 4.63339L1.62228 65.6234C-0.540759 67.7865 -0.540762 71.2934 1.62228 73.4565L62.6123 134.447C66.1016 137.936 72.0677 135.465 72.0677 130.53L72.0677 8.54992C72.0677 3.61536 66.1016 1.14413 62.6123 4.63339Z";

export const DIAMOND_PATH =
  "M113.07 38.6047C115.234 36.4416 118.741 36.4416 120.904 38.6046L147.94 65.6413C150.103 67.8043 150.103 71.3113 147.94 73.4744L120.904 100.511C118.741 102.674 115.234 102.674 113.07 100.511L86.0338 73.4744C83.8708 71.3113 83.8708 67.8043 86.0338 65.6413L113.07 38.6047Z";

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 139"><path d="${TRIANGLE_PATH}"/><path d="${DIAMOND_PATH}"/></svg>`;

// Figma units are ~150 wide for the lockup; this brings it to ~2.4 world units so
// a 30° camera at z=8 frames it with room to breathe above the wordmark.
export const MARK_SCALE = 0.016;

// The 3D mark sits dead centre of the viewport — it's the only thing in the
// middle of the page, with the lockup up in the corner as a masthead.
export const MARK_LIFT = 0;

// The chamfer, in geometry units. This was 2.6 with eight segments, which on a
// mark 150 units across is a fillet a full 3.5% of the width and smooth all the
// way over: it rounds the edge rather than cutting it, and the reference is
// unambiguously cut. 1.2 is narrow enough that the key light lands on it as one
// tight line instead of a gradient.
//
// Two segments rather than one, deliberately. A single facet is a hard crease:
// it has no width to catch anything at small sizes, so it drops to a dark line,
// and as the mark turns the highlight jumps from face to face instead of
// travelling across the edge. Two keeps just enough rounding for it to travel.
export const MARK_BEVEL = 1.2;
export const MARK_DEPTH = 20;

// Shared with the side-wall UV generator, which has to walk the same polyline
// ExtrudeGeometry does. Different values there would put the brushing slightly
// out of step with the surface it is on.
const MARK_CURVE_SEGMENTS = 32;

// Measured off the paths rather than read off the viewBox: the two shapes
// occupy 149.6 x 133.1 of a 150 x 139 box, and the six units of air under the
// triangle are not part of the mark. The bevel then adds its size to every edge.
const MARK_ARTWORK_WIDTH = 149.6;
const MARK_ARTWORK_HEIGHT = 133.1;

// Size of the lockup in geometry units, bevel included.
const MARK_WIDTH = MARK_ARTWORK_WIDTH + MARK_BEVEL * 2;
const MARK_HEIGHT = MARK_ARTWORK_HEIGHT + MARK_BEVEL * 2;

/**
 * Fits the mark to the viewport.
 *
 * A perspective camera's visible *height* at a given depth depends only on fov
 * and distance, so it's identical on a phone and a desktop — only the width
 * changes with aspect ratio. That means a fixed scale that frames nicely at
 * 16:9 runs straight off both edges of a portrait phone. This scales down (never
 * up) so the mark always occupies a sane fraction of the narrow axis.
 */
export function useMarkFit({ baseScale = MARK_SCALE, lift = MARK_LIFT } = {}) {
  const width = useThree((state) => state.viewport.width);
  const height = useThree((state) => state.viewport.height);

  return useMemo(() => {
    const portrait = width < height;

    // Constrained on both axes, and the tighter one wins. Width alone isn't
    // enough: on a wide desktop window nothing clips horizontally, but a
    // centred mark grows tall enough to run straight through the wordmark
    // underneath it. Height is what actually binds in landscape.
    const widthFit = (width * (portrait ? 0.66 : 0.44)) / (MARK_WIDTH * baseScale);
    // Height is the tighter constraint in landscape, where a mark fitted on
    // width alone grows tall enough to fill the window edge to edge. This keeps
    // clear air above and below it at every aspect ratio.
    //
    // 0.362, and it was 0.38 for as long as MARK_HEIGHT was a hand-typed 145
    // against a true 138.3 — so the fraction has never been the fraction it
    // claimed, and 0.362 is what the page has actually been rendering all along.
    // Correcting the bounds and leaving 0.38 alone would have grown the mark 5%
    // as a side effect of a change to the bevel, which nobody asked for.
    const heightFit = (height * 0.362) / (MARK_HEIGHT * baseScale);

    // Only ever scale down — baseScale is the intended size, not a target to
    // grow into on a big screen.
    const scale = baseScale * Math.min(1, widthFit, heightFit);

    // Push the mark off centre in landscape so the hero copy has a column of
    // its own. Dead centre was right when the mark was the only thing on the
    // page; with a headline beside it the two collide, and text sitting across
    // a lit object reads as a mistake rather than as a composition. The brand
    // deck's own title slide is laid out exactly this way: words left, object
    // filling the right.
    //
    // Portrait keeps it centred. There is no room for two columns on a phone,
    // where the copy sits under the mark instead of beside it.
    const offsetX = portrait ? 0 : width * 0.19;

    // Portrait lifts the mark. Dead centre of the viewport sounds right and
    // measures wrong once there is copy at the bottom: at 390x844 the masthead
    // ended at y46 and the mark did not start until y300, so a quarter of the
    // screen above it was empty while the mark sat only 91px clear of the
    // headline. The composition read as bottom-heavy for that reason rather than
    // because anything was too low.
    //
    // Centring the mark in the space it actually has, between masthead and copy,
    // rather than in the whole viewport, is about a tenth of the height.
    const lifted = portrait ? lift + height * 0.1 : lift;

    return { scale, lift: lifted, offsetX, portrait };
  }, [width, height, baseScale, lift]);
}

// How much perimeter one repeat of the side-wall map covers, in geometry units.
// The map is nearly constant along the perimeter, because that is the direction
// the grooves run in, so this only sets the wavelength of the slow variation in
// groove depth along an edge. 120 puts about three repeats around the triangle,
// long enough that the repeat never reads as a pattern.
const WALL_TILE_LENGTH = 120;

/**
 * Side-wall UVs parameterised by the outline itself: u around the contour, v
 * through the extrusion.
 *
 * ExtrudeGeometry's default generator builds side-wall UVs out of world
 * position — u is whichever of x or y is changing faster along the edge, v is
 * the depth. That is serviceable for a checkerboard and useless for a finish:
 * u restarts at an arbitrary value on every edge and swaps axis at the corners,
 * so nothing mapped through it can follow the shape. The faces' spun texture
 * sampled that way came out as unrelated slices of a circle, which is why the
 * walls read as random streaks rather than as a brushed edge.
 *
 * With this, u is distance travelled around the outline and v is position
 * through the extrusion, which is the parameterisation a brushed edge actually
 * has: the grooves run along u, and the surface is the same all the way round.
 * A fixed anisotropy direction on the wall material also starts meaning
 * something, because the tangent now points along the perimeter everywhere
 * instead of along whichever world axis happened to win.
 *
 * u is normalised per contour and multiplied up to a whole number of repeats,
 * so the map meets itself exactly where the outline closes and there is no seam
 * to hide.
 *
 * Distance comes from projecting each vertex onto the contour polyline rather
 * than from counting vertices along it. The bevel layers are inset from the
 * outline by up to `bevel`, so their vertices are not contour points at all,
 * and matching them to the nearest one lands on a neighbour at any corner tight
 * enough for the difference to show.
 */
function contourUVGenerator(shapes, { depth, bevel }) {
  const contours = [];
  for (const shape of shapes) {
    const { shape: outline, holes } = shape.extractPoints(MARK_CURVE_SEGMENTS);
    for (const points of [outline, ...holes]) {
      const count = points.length;
      const starts = new Float64Array(count);
      const lengths = new Float64Array(count);
      let total = 0;
      for (let i = 0; i < count; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % count];
        starts[i] = total;
        lengths[i] = Math.hypot(b.x - a.x, b.y - a.y);
        total += lengths[i];
      }
      contours.push({
        points,
        starts,
        lengths,
        total,
        repeats: Math.max(1, Math.round(total / WALL_TILE_LENGTH)),
      });
    }
  }

  // ExtrudeGeometry hangs the bevel off both ends of the extrusion rather than
  // insetting it, so the wall runs from -bevelThickness to depth + bevelThickness
  // and v covers the chamfer, the wall and the far chamfer as one surface.
  const zMin = -bevel;
  const zSpan = depth + bevel * 2;

  // Each vertex is visited once per quad corner it belongs to, and each visit
  // costs a pass over the whole outline. Caching turns that back into one pass
  // per vertex.
  const arcs = new Map();

  function arcAt(x, y) {
    const key = `${x},${y}`;
    const cached = arcs.get(key);
    if (cached !== undefined) return cached;

    let nearest = Infinity;
    let arc = 0;
    for (const contour of contours) {
      const { points, starts, lengths, total, repeats } = contour;
      for (let i = 0, il = points.length; i < il; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % il];
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        const span = ex * ex + ey * ey;
        // Clamped, so a vertex sitting off the end of a segment measures to its
        // endpoint rather than to a point on the segment's infinite extension.
        const t =
          span > 0
            ? Math.min(1, Math.max(0, ((x - a.x) * ex + (y - a.y) * ey) / span))
            : 0;
        const dx = x - (a.x + ex * t);
        const dy = y - (a.y + ey * t);
        const distance = dx * dx + dy * dy;
        if (distance < nearest) {
          nearest = distance;
          arc = ((starts[i] + lengths[i] * t) / total) * repeats;
        }
      }
    }

    arcs.set(key, arc);
    return arc;
  }

  return {
    // The caps keep the default parameterisation — raw shape coordinates — which
    // is what the faces' maps in stage.js are scaled and centred against.
    generateTopUV(geometry, vertices, indexA, indexB, indexC) {
      return [indexA, indexB, indexC].map(
        (i) => new THREE.Vector2(vertices[i * 3], vertices[i * 3 + 1])
      );
    },
    generateSideWallUV(geometry, vertices, indexA, indexB, indexC, indexD) {
      return [indexA, indexB, indexC, indexD].map(
        (i) =>
          new THREE.Vector2(
            arcAt(vertices[i * 3], vertices[i * 3 + 1]),
            (vertices[i * 3 + 2] - zMin) / zSpan
          )
      );
    },
  };
}

/**
 * Extrudes the two mark shapes into beveled slabs.
 *
 * Returns one geometry per shape (triangle, then diamond) so a variant can move
 * them independently — the whole lockup reads very differently when the diamond
 * is allowed to drift off the triangle's rhythm.
 *
 * Both geometries are translated by the *shared* bounding-box centre, not their
 * own, so the pair stays in its designed relationship while the lockup as a whole
 * sits on the origin.
 */
export function useMarkGeometries({
  depth = MARK_DEPTH,
  bevel = MARK_BEVEL,
} = {}) {
  const geometries = useMemo(() => {
    const paths = new SVGLoader().parse(MARK_SVG).paths;

    const geometries = paths.map((path) => {
      const shapes = SVGLoader.createShapes(path);
      return new THREE.ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelOffset: 0,
        // The bevel is doing most of the work here: it's the narrow chamfer that
        // catches the key light and produces the hot rim in the Figma renders.
        // See MARK_BEVEL for why two rather than one or eight.
        bevelSegments: 2,
        curveSegments: MARK_CURVE_SEGMENTS,
        UVGenerator: contourUVGenerator(shapes, { depth, bevel }),
      });
    });

    const bounds = new THREE.Box3();
    for (const geometry of geometries) {
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox);
    }
    const centre = bounds.getCenter(new THREE.Vector3());

    for (const geometry of geometries) {
      geometry.translate(-centre.x, -centre.y, -centre.z);
      geometry.computeVertexNormals();
    }

    return geometries;
  }, [depth, bevel]);

  // ExtrudeGeometry allocates GPU buffers that React knows nothing about. The
  // switcher unmounts a whole Canvas each time you change variant, so without
  // this every switch strands another pair of extrusions in VRAM.
  useEffect(() => {
    return () => {
      for (const geometry of geometries) geometry.dispose();
    };
  }, [geometries]);

  return geometries;
}

// Where each shape sits relative to the lockup centre, in *geometry* units — the
// same space the meshes live in, so these can be added straight to mesh.position
// inside the mirrored group. Variants that pull the shapes apart animate outward
// along these, so the mark separates along its own axis rather than some
// arbitrary direction.
export function shapeOffsets(geometries) {
  return geometries.map((geometry) => {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    return geometry.boundingBox.getCenter(new THREE.Vector3());
  });
}
