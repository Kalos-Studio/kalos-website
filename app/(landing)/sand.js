"use client";

import { useEffect, useRef } from "react";
import { isCoarsePointer, prefersReducedMotion } from "./device";
import { activeVariant } from "./sunrise-variants";
import { activeSand } from "./sand-variants";

/**
 * The black sand the page sits on, generated rather than tiled.
 *
 * Two models live here while the ground is being chosen — `dune`, described
 * below, and `ripple`, which is the plate at node 383:62 and is a different
 * surface rather than different numbers. sand-variants.js carries the
 * measurements and picks between them; paintRipple has the reasoning for its
 * own. Both should collapse to one once a ground wins.
 *
 * The mock lays a 1264x707 photographic plate down the page nine times at 70%
 * opacity. That cannot ship: the plate we have (public/home/gold-sand.webp) is a
 * photograph with a corner-to-corner luminance gradient and rounded corners baked
 * into it, so a repeat shows a hard grid of seams and the same dune ridge over and
 * over. Generating one field the size of the viewport means there is nothing to
 * tile, so there is nothing to seam.
 *
 * Measured off the designer's plate, which is what the numbers below are for:
 * mean luminance 8 of 255, row means swinging between 0.7 and 84 (so the dunes
 * carry effectively all of the structure), and about 217 warm specks per million
 * pixels.
 */

// The dunes are generated at this size and drawn up to fill the viewport. Small
// on purpose: an ~8x upscale is what makes them soft, and it holds the per-pixel
// loop to under twenty thousand pixels rather than the six million the canvas
// actually has. The grain that would be lost at this resolution is not lost,
// because it was never coming from here — see the feTurbulence overlay in
// landing.css, which is already full resolution and already seamless.
const DUNE_WIDTH = 160;
const DUNE_HEIGHT = 110;

// Warm specks per million device pixels, from the plate.
const SPECK_DENSITY = 210;

// How far the field travels over a full page scroll, as a fraction of the
// viewport height. The canvas is drawn this much taller than the viewport and
// starts that far above it, so there is always something under the visible area
// no matter where the reader is.
const PARALLAX_TRAVEL = 0.3;

// How many dunes run down one screen. Twenty, not two hundred.
//
// The first version sampled a smoothed noise array once per output row, which
// put a ridge every eight pixels and rendered wood grain: the same failure the
// mark's texture work already recorded, where perturbing a pattern at too fine a
// scale stops reading as the material and starts reading as timber. Sand seen
// across a room has a handful of ridges in view, not hundreds.
const RIDGE_STEPS = 20;

/**
 * The dune profile: a short run of heights, interpolated between.
 *
 * Deliberately only twenty numbers. Smoothing a long noise array toward this
 * wavelength takes many passes and still leaves harmonics in it; starting coarse
 * and interpolating up gives a cleaner curve for less work.
 */
function ridgeProfile(steps) {
  const raw = new Float32Array(steps);
  for (let i = 0; i < steps; i += 1) raw[i] = Math.random();

  const smoothed = new Float32Array(steps);
  for (let i = 0; i < steps; i += 1) {
    const a = raw[(i - 1 + steps) % steps];
    const b = raw[i];
    const c = raw[(i + 1) % steps];
    smoothed[i] = (a + b + b + c) / 4;
  }
  return smoothed;
}

// Smoothstep between two ridge samples. Linear interpolation leaves a visible
// crease at every sample point once the field is drawn up eight times.
function sampleRidge(ridge, at) {
  const steps = ridge.length;
  const i = Math.floor(at);
  const f = at - i;
  const a = ridge[((i % steps) + steps) % steps];
  const b = ridge[(((i + 1) % steps) + steps) % steps];
  return a + (b - a) * f * f * (3 - 2 * f);
}

function paintSand(canvas, width, height, dpr) {
  const ctx = canvas.getContext("2d");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // The dunes, at a fraction of the size they will be seen at.
  const dunes = document.createElement("canvas");
  dunes.width = DUNE_WIDTH;
  dunes.height = DUNE_HEIGHT;
  const duneCtx = dunes.getContext("2d");
  const image = duneCtx.createImageData(DUNE_WIDTH, DUNE_HEIGHT);

  // Ridges run across, so the profile is sampled down the frame and the only
  // thing x does is bend it. Two sine terms rather than one: a single one is a
  // wave, two beating against each other is a landscape.
  const ridge = ridgeProfile(RIDGE_STEPS);
  const bend1 = 2.1 + Math.random() * 1.4;
  const bend2 = 5.3 + Math.random() * 2.2;
  const phase = Math.random() * Math.PI * 2;

  // Keep the sampled height per column so the specks can be put on the crests
  // rather than scattered evenly, which is what the plate does.
  const height01 = new Float32Array(DUNE_WIDTH * DUNE_HEIGHT);

  for (let y = 0; y < DUNE_HEIGHT; y += 1) {
    for (let x = 0; x < DUNE_WIDTH; x += 1) {
      const u = x / DUNE_WIDTH;
      // Two sine terms rather than one: a single one is a wave, two beating
      // against each other is a landscape. Measured in ridge steps, not pixels,
      // so the bend stays proportional to the dunes at any canvas size.
      const bend =
        Math.sin(u * Math.PI * bend1 + phase) * 1.1 +
        Math.sin(u * Math.PI * bend2 - phase) * 0.45;
      const v = sampleRidge(ridge, (y / DUNE_HEIGHT) * RIDGE_STEPS + bend);

      // Cubed, because sand is mostly shadow with occasional lit crests. Squared
      // was still an evenly grey field, which reads as fog rather than as a
      // surface: the plate's row means swing from 0.7 to 84, so most of the
      // frame has to be genuinely near black for the crests to be anything.
      const lit = v * v * v;
      const o = (y * DUNE_WIDTH + x) * 4;
      height01[y * DUNE_WIDTH + x] = lit;

      // Warm, and very dark. The plate averages 8 of 255, so the ceiling is
      // deliberately low: this is a surface being grazed by light, not lit.
      image.data[o] = 5 + lit * 40;
      image.data[o + 1] = 4 + lit * 33;
      image.data[o + 2] = 4 + lit * 25;
      image.data[o + 3] = 255;
    }
  }
  duneCtx.putImageData(image, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(dunes, 0, 0, canvas.width, canvas.height);

  // The specks, at 1:1. These are the one thing that has to stay sharp, which is
  // why they are drawn here rather than baked into the upscaled layer: a gold
  // grain smeared over eight pixels is a smudge.
  const count = Math.round((canvas.width * canvas.height * SPECK_DENSITY) / 1e6);
  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    // Rejected against the dune height under it, so specks collect where the
    // light is. Scattering them evenly reads as stars, not sand.
    const dx = Math.min(DUNE_WIDTH - 1, Math.floor((x / canvas.width) * DUNE_WIDTH));
    const dy = Math.min(DUNE_HEIGHT - 1, Math.floor((y / canvas.height) * DUNE_HEIGHT));
    const lit = height01[dy * DUNE_WIDTH + dx];
    if (Math.random() > 0.15 + lit * 1.4) continue;

    const size = Math.random() < 0.82 ? 1 : 2;
    ctx.fillStyle = `rgba(214, 178, 112, ${0.25 + Math.random() * 0.6})`;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  }
}

/* ---------- the ripple model, from Sand_Top (383:62) ---------- */

// Vertical period of the ripples in CSS pixels. The plate runs about 211px at
// its native 2012px width; scaled to a laptop viewport that lands near 150.
//
// Measured in screen pixels rather than as a fraction of the frame, deliberately.
// A fraction would stretch the ripples on a tall phone and squash them on a wide
// monitor, and the whole point of a period this specific is that it is the one
// thing in the plate with a definite size.
const RIPPLE_PERIOD = 150;

// How much longer the ripples are across than down.
//
// Not 2.2, which is what the plate's blurred luminance gradient ratio says and
// which is wrong twice over. A wide blur measures the coarsest thing in frame
// rather than the ripples, and more importantly a raking light is itself
// directional: shading isotropic relief with a light coming straight down the
// screen produces a vertical luminance gradient all on its own, so the ratio
// counts the light's anisotropy as if it were the surface's.
//
// Measured against the plate at a radius matched to its own ripple period, the
// number to hit is 1.31 — the plate is only mildly directional. At 2.2 this
// rendered as blurred horizontal bands, which is a different material.
const RIPPLE_STRETCH = 1.4;

// The relief is generated at this width and drawn up, the same trick the dunes
// use — but nowhere near as far up, and that difference is the whole point.
//
// The dunes survive an 8x upscale because a dune is one low frequency and
// upscaling is what makes it soft. This plate is not soft: its ripples have
// mid-frequency structure between the main bands, and at 420 wide against a
// 2880px canvas that structure blurred away completely and left horizontal
// smears. 720 holds three octaves through the upscale.
//
// The grain is not in here, and that is deliberate: it is painted separately at
// device resolution further down, because grain that has been through this
// upscale is not grain any more.
const RELIEF_WIDTH = 720;

// The light. A raking one, which is the entire difference between a ripple and
// a stain: at 18 degrees a 1% slope is a visible change in shade, and from
// straight on it is nothing.
//
// Azimuth points up the screen (y is down in canvas space, hence the negative),
// so crests light on their top edge. Both of these are variables rather than
// constants on purpose — this is the hook the sunrise would drive if the sand
// is ever lit by the same light as the mark. See the note in the component.
const LIGHT_ELEVATION = (18 * Math.PI) / 180;
const LIGHT_AZIMUTH = -Math.PI / 2;

// How hard the height field bends the normal. Tuned by eye rather than derived:
// the plate gives an amplitude in luminance, not a slope, and the mapping
// between them depends on this number and the light elevation together. The
// output is normalised against its own spread afterwards, so this sets the
// *character* of the shading — high values pinch the crests into an edge, low
// values spread them into a gradient — while `relief` in sand-variants.js sets
// how far it actually swings. 26 gave gradients rather than ripples.
const SURFACE_SCALE = 55;

// The two ends of the gold ramp. The dim end is Vulcan Gold taken down toward
// the ground; the lit end is the rim value measured off the 3D renders, which is
// where a metal highlight lands on this page already. Neither end is white.
// A cluster of gold: a radius in CSS pixels, and how many flecks land in one.
const CLUSTER_SPREAD = 34;
const FLECKS_PER_CLUSTER = 55;

const GOLD_DIM = [120, 92, 46];
// Capped well short of the rim value it started at (232, 205, 150). A fleck is
// one to three pixels: anything that pale averages against its neighbours into
// light grey the moment the page is not being viewed at 1:1, and a field of
// light grey dots is a starfield whatever colour it was in the source. This is
// bright enough to glint and saturated enough to survive being small.
const GOLD_LIT = [214, 172, 98];

/**
 * A 2D value-noise lattice. Wraps, so the field has no edge.
 *
 * Value noise rather than gradient noise because at this scale the difference is
 * invisible and this is a third of the code. The lattice is sized to the cycle
 * count so sampling at `u * cycles` lands exactly on the wrap.
 */
function lattice(cols, rows) {
  const v = new Float32Array(cols * rows);
  for (let i = 0; i < v.length; i += 1) v[i] = Math.random();
  return { cols, rows, v };
}

// Smoothstep on both axes. Linear leaves a visible crease at every lattice line
// once the field is drawn up five or more times — the same failure sampleRidge
// exists to avoid on the dunes.
function sampleLattice(field, x, y) {
  const { cols, rows, v } = field;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const xa = ((xi % cols) + cols) % cols;
  const xb = (xa + 1) % cols;
  const ya = ((yi % rows) + rows) % rows;
  const yb = (ya + 1) % rows;
  const top = v[ya * cols + xa] + (v[ya * cols + xb] - v[ya * cols + xa]) * sx;
  const bottom = v[yb * cols + xa] + (v[yb * cols + xb] - v[yb * cols + xa]) * sx;
  return top + (bottom - top) * sy;
}

/**
 * Sand_Top: a flat neutral ground, a low anisotropic ripple under a raking
 * light, and a lot of warm sparkle.
 *
 * Structurally different from paintSand above, which is why it is a second
 * function rather than a branch inside the first. The dunes are an authored
 * profile — twenty hand-smoothed numbers, cubed, because that plate is mostly
 * shadow with occasional lit crests. This plate has no crests: its whole range
 * is seventeen levels, and what makes it read as sand is direction and grain,
 * not tone. So there is nothing to author, and two octaves of stretched noise
 * shaded by a low light is not an approximation of the plate — at that contrast
 * it is the plate.
 */
function paintRipple(canvas, width, height, dpr, sand) {
  const ctx = canvas.getContext("2d");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const rw = RELIEF_WIDTH;
  const rh = Math.max(2, Math.round((RELIEF_WIDTH * height) / width));

  // Cycles across the whole field, from the screen-pixel period above. Rounded,
  // because the lattice has to be a whole number of cells for the wrap to land
  // on the sample; the period drifts by a few percent as a result, which at a
  // 150px wavelength is a few pixels and not something an eye recovers.
  // Floored at four, not two, and the floor is a phone bug rather than a
  // safeguard. A 390px viewport rounds to two cycles across, and a lattice two
  // cells wide has no horizontal structure left in it — the octaves collapse
  // into a single smooth gradient and the ripples stop existing. Four keeps a
  // shorter wavelength than intended on a narrow screen, which is the right
  // trade: a phone is held closer, and a tighter ripple beats no ripple.
  const cyclesX = Math.max(4, Math.round(width / (RIPPLE_PERIOD * RIPPLE_STRETCH)));
  const cyclesY = Math.max(4, Math.round(height / RIPPLE_PERIOD));

  // Three octaves. Two was not enough — the gap between the bands and the grain
  // overlay is exactly where this plate keeps its character, and with only a 3x
  // octave that band was empty and the field read as horizontal smears. A fourth
  // is not worth having: at 18x it lands on the grain overlay's own scale, where
  // it does not add texture so much as fight the thing already producing it at
  // full resolution.
  //
  // AMPLITUDES FALL AS 1/f, AND THAT IS NOT A TASTE CALL. This surface is shaded
  // through its gradient, and an octave at 6x frequency contributes 6x the slope
  // for the same amplitude. The obvious halving — 0.52, 0.31, 0.17 — therefore
  // gives the *finest* octave three times the slope of the coarsest, and it
  // rendered as tweed: a regular grid of blobs at the fine lattice's cell size,
  // with the ripples buried underneath it. 1/f makes each octave contribute the
  // same slope, which is what fBm means when the output is a normal rather than
  // a height.
  //
  // The ratios are irrational-ish and the finer two are rotated for the same
  // reason: value noise is built on a rectangular lattice and looks it, and
  // stacking octaves at 3x and 9x on aligned grids makes every cell boundary
  // land on top of another one. Small angles, so the horizontal character that
  // cyclesX and cyclesY establish is not rotated away with it.
  const OCTAVES = [
    { freq: 1, amp: 0.6, rot: 0 },
    { freq: 2.7, amp: 0.19, rot: 0.41 },
    { freq: 6.1, amp: 0.07, rot: -0.72 },
  ].map((o) => ({
    ...o,
    cos: Math.cos(o.rot),
    sin: Math.sin(o.rot),
    field: lattice(
      Math.max(2, Math.round(cyclesX * o.freq)),
      Math.max(2, Math.round(cyclesY * o.freq))
    ),
  }));

  const heightField = new Float32Array(rw * rh);
  for (let y = 0; y < rh; y += 1) {
    const v = y / rh;
    for (let x = 0; x < rw; x += 1) {
      const u = x / rw;
      let h = 0;
      for (const o of OCTAVES) {
        // Rotated in unit space, then scaled by the two cycle counts, so the
        // rotation shears the octave off the grid without undoing the stretch.
        const ru = u * o.cos - v * o.sin;
        const rv = u * o.sin + v * o.cos;
        h += sampleLattice(o.field, ru * cyclesX * o.freq, rv * cyclesY * o.freq) * o.amp;
      }
      heightField[y * rw + x] = h;
    }
  }

  // Shade it: normal from the neighbours, then dot with the light. This is
  // feDiffuseLighting, done here rather than in SVG because the light direction
  // wants to be a value this file owns rather than a constant baked into a
  // filter — see the note about the sunrise in the component below.
  const lx = Math.cos(LIGHT_ELEVATION) * Math.cos(LIGHT_AZIMUTH);
  const ly = Math.cos(LIGHT_ELEVATION) * Math.sin(LIGHT_AZIMUTH);
  const lz = Math.sin(LIGHT_ELEVATION);

  const shade = new Float32Array(rw * rh);
  let sum = 0;
  let sumSq = 0;
  const at = (x, y) =>
    heightField[(((y % rh) + rh) % rh) * rw + (((x % rw) + rw) % rw)];

  for (let y = 0; y < rh; y += 1) {
    for (let x = 0; x < rw; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const nx = -dx * SURFACE_SCALE;
      const ny = -dy * SURFACE_SCALE;
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      const lit = (nx * lx + ny * ly + lz) * inv;
      shade[y * rw + x] = lit;
      sum += lit;
      sumSq += lit * lit;
    }
  }

  // Normalise against the field's own spread, so `relief` in sand-variants.js
  // means what it says: levels from the mean to a crest. Without this, changing
  // SURFACE_SCALE or the light elevation silently changes the contrast too, and
  // the contrast is the one number on the lifted variant that has to hold — it
  // is what keeps Dark Silver body copy above 4.5:1.
  const n = rw * rh;
  const mean = sum / n;
  const sigma = Math.sqrt(Math.max(1e-6, sumSq / n - mean * mean));
  const [gr, gg, gb] = sand.ground;

  const GRAIN_TILE = 512;
  const grainTile = document.createElement("canvas");
  grainTile.width = GRAIN_TILE;
  grainTile.height = GRAIN_TILE;
  const grainCtx = grainTile.getContext("2d");
  const grainImage = grainCtx.createImageData(GRAIN_TILE, GRAIN_TILE);
  const coarseGrain = lattice(GRAIN_TILE / 2, GRAIN_TILE / 2);
  const fineGrain = lattice(GRAIN_TILE, GRAIN_TILE);

  // Skewed hard, because a bed of sand is mostly grains in shadow with a few
  // catching the light — a symmetric distribution renders as fog. The power is
  // applied to the noise rather than to the output so the bright tail stays
  // sparse at every amplitude.
  const grainRaw = new Float32Array(GRAIN_TILE * GRAIN_TILE);
  let grainSum = 0;
  for (let y = 0; y < GRAIN_TILE; y += 1) {
    for (let x = 0; x < GRAIN_TILE; x += 1) {
      const t =
        sampleLattice(coarseGrain, x / 2, y / 2) * 0.66 +
        sampleLattice(fineGrain, x, y) * 0.34;
      const v = Math.pow(t, 2.4);
      grainRaw[y * GRAIN_TILE + x] = v;
      grainSum += v;
    }
  }

  // Additive, with the ground already lowered by the mean below, so the grain
  // only ever lightens. That is both what a grain of sand does — it catches
  // light, it does not cast a hole — and the one encoding with no alpha
  // quantisation to lose: at these amplitudes a signed white-over-black tile
  // spends most of its range on alphas under 3 of 255.
  const grainMean = grainSum / (GRAIN_TILE * GRAIN_TILE);
  const grainBase = grainMean * sand.grainLevels;
  for (let i = 0; i < GRAIN_TILE * GRAIN_TILE; i += 1) {
    const lift = grainRaw[i] * sand.grainLevels;
    const o = i * 4;
    grainImage.data[o] = lift;
    grainImage.data[o + 1] = lift * 0.97;
    grainImage.data[o + 2] = lift * 0.92;
    grainImage.data[o + 3] = 255;
  }
  grainCtx.putImageData(grainImage, 0, 0);

  const relief = document.createElement("canvas");
  relief.width = rw;
  relief.height = rh;
  const reliefCtx = relief.getContext("2d");
  const image = reliefCtx.createImageData(rw, rh);
  for (let i = 0; i < n; i += 1) {
    // Two sigma to the crest. Clamped, because a Gaussian has tails and an
    // unclamped one puts a handful of pixels well outside the range the contrast
    // was calculated against.
    const t = Math.max(-1, Math.min(1, (shade[i] - mean) / (sigma * 2)));
    const lift = t * sand.relief;
    const o = i * 4;
    // Less the grain's mean, because the grain above this is additive: the two
    // layers have to sum to the ground the variant asks for, not start there and
    // climb off it.
    image.data[o] = Math.max(0, gr - grainBase + lift);
    image.data[o + 1] = Math.max(0, gg - grainBase * 0.97 + lift);
    image.data[o + 2] = Math.max(0, gb - grainBase * 0.92 + lift);
    image.data[o + 3] = 255;
  }
  reliefCtx.putImageData(image, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(relief, 0, 0, canvas.width, canvas.height);

  // The grain, at device resolution, as a bed of particles rather than noise.
  //
  // This has to be here rather than in the page's film-grain overlay: those are
  // two different things and running them together left the ground perfectly
  // smooth between the flecks.
  //
  // GRAINS ARE BLOBS, NOT PIXELS, and the first version got that wrong. Drawing
  // uncorrelated per-pixel noise gives you sensor noise sitting on a solid
  // surface — every measurement of it comes out right, the sigma matches the
  // plate, and the material still reads as rock with a dirty lens, because a
  // solid is exactly what it is: a smooth shaded relief with speckle on top.
  // What makes a surface read as particulate is that the particles have a size.
  // Value noise on a 2px lattice gives grains you can see the edges of, and with
  // it the shaded relief stops being the subject.
  //
  // A 512px tile drawn as a pattern rather than a six-million-pixel loop. Pure
  // grain has no structure to recognise, so a repeat cannot be seen — the seam
  // argument at the top of this file is about a photograph with a dune in it.
  // The gold does not go in here for exactly that reason: it is the one thing on
  // this surface that *is* recognisable, so it is drawn across the whole canvas
  // below instead.
  //
  // Lattices divide the tile exactly, so the noise wraps and the tile is
  // seamless by construction rather than by luck.
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = ctx.createPattern(grainTile, "repeat");
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";

  // The gold.
  //
  // Warm-tinted white is not gold. The first version set these to the ground
  // plus a level, with green at 0.86 and blue at 0.62 of red — which on a ground
  // of 15 is a grey pinprick with a hint of amber, at nothing like the
  // saturation of a metal. These interpolate toward an actual gold instead, and
  // toward the lit rim rather than toward white at the top of the ramp, for the
  // same reason the mark's bevel is not tinted its own highlight colour: the
  // white belongs where the light catches the edge, not in the material.
  //
  // Blobs of one to three pixels rather than single pixels, matching the grain
  // bed they sit in. A one-pixel highlight on a particulate surface is a hot
  // pixel; a three-pixel one is a flake with an edge.
  //
  // Loosely clustered. The plate clumps — there is a bright patch low and left
  // of centre with nothing like it elsewhere — and an even scatter is the one
  // distribution that reliably reads as stars, because nothing in a night sky
  // clumps either.
  const count = Math.round((canvas.width * canvas.height * sand.speckDensity) / 1e6);
  const clusters = Math.max(1, Math.round(count / FLECKS_PER_CLUSTER));
  // In CSS pixels, converted here — NOT as a fraction of the canvas.
  //
  // This was `canvas.width * 0.028`, which is the same thing on a desktop and a
  // completely different thing on a phone: a 585px canvas made the spread 16
  // canvas pixels, about 11 CSS pixels, so fifty-odd flecks piled into a patch
  // the width of a full stop. Mobile rendered a scatter of gold rosettes. How
  // big a clump looks is a physical size on a screen, so it has to be written as
  // one.
  const spread = CLUSTER_SPREAD * dpr;
  for (let i = 0; i < count; i += 1) {
    let x;
    let y;
    if (i % 5 === 0) {
      // A fifth land anywhere, so the clumps sit in a field rather than on bare
      // ground.
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
    } else {
      // The rest scatter around a cluster centre, chosen from a fixed set so the
      // same centres get returned to. Gaussian-ish, from two uniforms.
      const c = Math.floor(Math.random() * clusters);
      const cx = ((c * 2654435761) % 10000) / 10000;
      const cy = ((c * 40503) % 10000) / 10000;
      x = cx * canvas.width + (Math.random() + Math.random() - 1) * spread;
      y = cy * canvas.height + (Math.random() + Math.random() - 1) * spread;
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
    }

    // Rejected against the relief under it, so the gold collects where the light
    // is rather than spreading evenly over the field.
    //
    // The dune model has carried this from the start and says why in one line —
    // "scattering them evenly reads as stars, not sand" — and it was right. An
    // even scatter was tried here anyway, on the grounds that the plate's speck
    // *correlation* had never been measured, only its density. That is true and
    // it is the wrong call: not having measured something is not a reason to
    // pick the one distribution already known to fail, and at viewport scale it
    // failed exactly as described. Following the relief also gives the gold
    // somewhere to be — warm bands running with the ripples, which is a surface
    // catching light rather than a sky.
    const sx = Math.min(rw - 1, Math.floor((x / canvas.width) * rw));
    const sy = Math.min(rh - 1, Math.floor((y / canvas.height) * rh));
    const litHere = Math.max(0, Math.min(1, (shade[sy * rw + sx] - mean) / (sigma * 2) * 0.5 + 0.5));
    if (Math.random() > 0.12 + litHere * 1.25) continue;

    // Most flecks sit low on the ramp and a few are properly lit, so the field
    // has a handful of real glints in it rather than an even wash of gold.
    const t = Math.pow(Math.random(), 1.8);
    const strength = sand.goldPeak * (0.28 + t * 0.72);
    const r = gr + (GOLD_DIM[0] + (GOLD_LIT[0] - GOLD_DIM[0]) * t - gr) * strength;
    const g = gg + (GOLD_DIM[1] + (GOLD_LIT[1] - GOLD_DIM[1]) * t - gg) * strength;
    const b = gb + (GOLD_DIM[2] + (GOLD_LIT[2] - GOLD_DIM[2]) * t - gb) * strength;

    // Weighted larger than a pinprick. A one-pixel fleck cannot carry a colour
    // once the page is drawn at anything but 1:1 — it resamples to grey.
    const roll = Math.random();
    const size = roll < 0.4 ? 1 : roll < 0.85 ? 2 : 3;
    ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  }
}

export default function Sand() {
  const canvas = useRef(null);
  const frame = useRef(0);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;

    // Half the device pixels on a phone, for the same reason the mark's textures
    // are halved there: this paints while the page is arriving, and a handset is
    // several times slower per pixel than the machine it was written on.
    const dpr = Math.min(window.devicePixelRatio || 1, isCoarsePointer() ? 1.5 : 2);
    const scroller = el.closest(".landing-root");
    const still = prefersReducedMotion();
    // How dark the field goes at the bottom of the sunrise. See
    // sunrise-variants.js; the CSS reads it as --sand-floor.
    document.documentElement.style.setProperty("--sand-floor", String(activeVariant().sandFloor));

    // The page ground and the film-grain opacity used to be written from here,
    // per ground, because the lifted variant needed both to move with it — the
    // field's opacity follows --dawn down toward the page ground, so a light
    // field over a black page made the sunrise a page-wide crossfade. That
    // variant is gone and both remaining grounds sit on obsidian with the film
    // grain that has always been there, so the properties had nothing left to
    // vary and the stylesheet owns those values again.
    const sand = activeSand();

    let travel = 0;

    const paint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      travel = still ? 0 : Math.round(height * PARALLAX_TRAVEL);
      el.style.top = `${-travel}px`;
      if (sand.model === "ripple") paintRipple(el, width, height + travel, dpr, sand);
      else paintSand(el, width, height + travel, dpr);
    };

    const onScroll = () => {
      if (!scroller || travel === 0 || frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const range = scroller.scrollHeight - scroller.clientHeight;
        const progress = range > 0 ? Math.min(1, scroller.scrollTop / range) : 0;
        el.style.transform = `translate3d(0, ${progress * travel}px, 0)`;
      });
    };

    paint();
    onScroll();

    // Repainting a six million pixel canvas on every resize event is what makes
    // dragging a window edge feel broken, so this waits for the drag to stop.
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        paint();
        onScroll();
      }, 180);
    };

    scroller?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.clearTimeout(resizeTimer);
      if (frame.current) cancelAnimationFrame(frame.current);
      scroller?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvas} className="ln-sand-field" aria-hidden="true" />;
}
