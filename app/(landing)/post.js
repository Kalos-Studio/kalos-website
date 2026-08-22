"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

/**
 * Bloom, in its own module so it can be code-split away.
 *
 * @react-three/postprocessing is a substantial dependency and an extra set of
 * full-screen render targets every frame. Phones pay for it twice — once on
 * cellular to download it, once per frame to run it — so the variants only mount
 * this on devices with a fine pointer, and because the import is dynamic a phone
 * never fetches the chunk at all.
 *
 * The vignette that used to live here is now plain CSS. It cost a whole extra
 * pass to do something a radial-gradient does for free, and moving it out means
 * the mood stays identical on the devices that skip this file.
 *
 * Bloom has to hug the edge it came from: a wide radius blurs the hot rim so far
 * from the geometry that the glow detaches and reads as a stray grey smudge
 * floating off the shape. Tight radius, high threshold.
 *
 * The threshold went up and the intensity down when the mark gained a polished
 * bevel. Radius was never the problem: what matters is how much of the frame
 * sits above the cut, and a long strip of mirror-finish chamfer put far more
 * over it than the old single material ever did. The result was a soft white
 * haze around the whole mark that read as a render artefact, and worse, it
 * spilled across the faces and hid the matte texture that was the point of the
 * change. Same effect, less of the frame feeding it.
 */
export default function Post({ intensity = 0.34, multisampling = 4 }) {
  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom
        mipmapBlur
        intensity={intensity}
        luminanceThreshold={0.99}
        luminanceSmoothing={0.08}
        radius={0.35}
      />
    </EffectComposer>
  );
}
