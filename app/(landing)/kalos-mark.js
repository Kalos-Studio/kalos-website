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

// Size of the lockup in geometry units, bevel included.
const MARK_WIDTH = 155;
const MARK_HEIGHT = 145;

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
    // width alone grows tall enough to fill the window edge to edge. 0.38 keeps
    // clear air above and below it at every aspect ratio.
    const heightFit = (height * 0.38) / (MARK_HEIGHT * baseScale);

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
export function useMarkGeometries({ depth = 20, bevel = 2.6 } = {}) {
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
        // Too few segments and that rim breaks into visible facets.
        bevelSegments: 8,
        curveSegments: 32,
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
