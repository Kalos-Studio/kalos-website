"use client";

import { useEffect, useRef } from "react";
import { isCoarsePointer, prefersReducedMotion } from "./device";

/**
 * The black sand the page sits on, generated rather than tiled.
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

    let travel = 0;

    const paint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      travel = still ? 0 : Math.round(height * PARALLAX_TRAVEL);
      el.style.top = `${-travel}px`;
      paintSand(el, width, height + travel, dpr);
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
