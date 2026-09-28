/**
 * Geometry checks for the landing page.
 *
 *     bun run dev                 # in another shell
 *     bun run check:landing
 *
 * There is no unit test suite here and there should not be one -- almost nothing
 * on this page is a pure function. What can break is geometric, and geometry can
 * be measured: this drives a real browser to each of the page's rest positions
 * and asserts where things sit. check-scroll.mjs covers how the page gets there.
 *
 * Rewritten for the redesign. The previous version guarded the old hero's
 * handover (hero faded at every panel, the definition block never over an
 * image); neither exists any more. What this one asserts:
 *
 *   PEEK        At the top, the first study's inset frame shows above the fold
 *               -- that is the design's "more below" -- and the masthead is
 *               hidden, per the wireframe's note.
 *
 *   BLEED       Resting on the first study, its frame has grown to the whole
 *               stage (frame transform at identity) and its picture has zoomed
 *               back out to scale 1. A frame that stops short of full bleed at its
 *               own stop is the bug this effect is most likely to have, since
 *               progress is measured against that stop.
 *
 *   STACK       Every other study, at its stop: its sheet is exactly the window
 *               and not receded at all, the next sheet has not started to show,
 *               and what is under the pointer in the middle of the window is
 *               that study's link. A sheet that sticks a few pixels off its stop
 *               shows a sliver of the one beneath, which is the bug this guards.
 *
 *   ARRIVAL     The first study's frame is invisible at first paint and shown
 *               once posed. It used to paint full bleed and then snap into its
 *               inset frame when the script arrived.
 *
 *   OVERFLOW    Nothing scrolls sideways. A full-bleed panel inside a gutter is
 *               the classic way to get 15px of horizontal scroll.
 *
 * Run across several viewports on purpose: below lg the panels are 16:9 strips
 * and the first study does not pin, so the two halves of the layout are
 * different code paths.
 */

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = [
  [1440, 900, "13in laptop"],
  [1920, 1080, "design frame"],
  [1280, 720, "small laptop"],
  [1024, 1366, "tall / portrait"],
  [768, 1024, "tablet portrait"],
  [390, 844, "phone"],
];

// Fractional pixels from snapping and device pixel ratios.
const TOLERANCE = 2;

// Everything measured in one pass through the page's stops.
async function measure(page) {
  return page.evaluate(async (TOLERANCE) => {
    const wait = () => new Promise((r) => setTimeout(r, 250));
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const go = async (y) => {
      window.scrollTo(0, y);
      await wait();
      await frames();
    };
    document.documentElement.style.scrollSnapType = "none";

    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const lg = vw >= 1024;
    const header = document.querySelector("header");
    const stops = [...document.querySelectorAll('[id^="case-"]')];
    const stopOf = (el) => {
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2 - vh / 2;
    };
    const frame = document.querySelector("[data-vt-cover]");
    // The frame grows by a (non-uniform) scale and the picture inside carries
    // the inverse times the zoom -- see stage.js. So "full bleed" is the frame
    // at identity, and "zoomed back out" is the picture at identity too.
    const matrix = (el) => {
      const t = getComputedStyle(el).transform;
      return t === "none" ? new DOMMatrix() : new DOMMatrix(t);
    };
    const identity = (m) =>
      Math.abs(m.a - 1) < 0.005 && Math.abs(m.d - 1) < 0.005 &&
      Math.abs(m.e) < TOLERANCE && Math.abs(m.f) < TOLERANCE;

    const out = { count: stops.length, problems: [] };
    const bad = (msg) => out.problems.push(msg);

    await go(0);
    if (+getComputedStyle(frame).opacity < 0.99) bad("first study's frame never shown");
    const frameTop = frame.getBoundingClientRect().top;
    if (!(frameTop < vh - 24)) bad(`first study does not peek (frame top ${Math.round(frameTop)} of ${vh})`);
    if (+getComputedStyle(header).opacity > 0.01) bad("masthead visible on the hero");

    await go(stopOf(stops[0]));
    const fm = matrix(frame);
    const im = matrix(frame.querySelector("img"));
    if (!identity(fm)) bad(`first study not full bleed at its stop (scale ${fm.a.toFixed(3)} x ${fm.d.toFixed(3)})`);
    if (!identity(im)) bad(`first study still zoomed at its stop (scale ${im.a.toFixed(3)})`);
    const fr = frame.getBoundingClientRect();
    if (Math.abs(fr.width - vw) > TOLERANCE) bad(`first study ${Math.round(fr.width)} wide, window ${vw}`);
    // The masthead fades in over --duration-settle; read it once it has. From
    // lg only: below that the first study is a 16:9 strip centred in the
    // window, so at its stop the foot of the hero is still on screen and the
    // masthead is right to stay hidden -- "past the hero" has not happened.
    await new Promise((r) => setTimeout(r, 700));
    if (lg && +getComputedStyle(header).opacity < 0.99) bad("masthead hidden past the hero");

    // The stage and every sheet after it, in order: the section's sticky
    // children.
    const sheets = [...document.querySelectorAll("#work > div.sticky")];
    for (const [i, el] of stops.slice(1).entries()) {
      await go(stopOf(el));
      const sheet = sheets[i + 1];
      const r = sheet.getBoundingClientRect();
      if (Math.abs(r.top) > TOLERANCE || Math.abs(r.height - vh) > TOLERANCE || Math.abs(r.width - vw) > TOLERANCE)
        bad(`${el.id}: sheet ${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.top)}, window ${vw}x${vh}`);
      const t = getComputedStyle(sheet).transform;
      if (t !== "none" && Math.abs(new DOMMatrix(t).a - 1) > 0.002) bad(`${el.id}: its sheet is receded at its own stop`);
      const next = sheets[i + 2];
      if (next && next.getBoundingClientRect().top < vh - TOLERANCE) bad(`${el.id}: the next sheet shows`);
      const hit = document.elementFromPoint(vw / 2, vh / 2)?.closest("a");
      if (!hit || !sheet.contains(hit)) bad(`${el.id}: the middle of the window is not its link`);
    }

    if (document.documentElement.scrollWidth > vw) bad(`scrolls sideways (${document.documentElement.scrollWidth} > ${vw})`);
    return out;
  }, TOLERANCE);
}

// Installed Chrome when there is one, Playwright's own Chromium when not.
const browser = await chromium
  .launch(process.env.CHROME === "0" ? {} : { channel: "chrome" })
  .catch(() => chromium.launch());
let failed = false;

// Warm the server first. Against `next dev` the first request compiles the
// route, and that cost used to land on whichever viewport went first.
{
  const warm = await browser.newPage();
  try {
    await warm.goto(BASE, { waitUntil: "domcontentloaded" });
    await warm.waitForSelector('[id^="case-"]', { timeout: 90000 });
  } catch {
    console.log(`Could not reach ${BASE}. Is \`bun run dev\` running?`);
    await browser.close();
    process.exit(1);
  } finally {
    await warm.close();
  }
}

for (const [width, height, label] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    // Wait for what is measured, not for the network: an earlier version passed
    // four viewports by measuring a page that had not hydrated.
    await page.waitForSelector("[data-vt-cover] img", { timeout: 15000 });
    // Hydrated and posed: the first study's frame has finished fading in,
    // which it only starts once the script has placed it. Waiting on the
    // animations alone read it mid-fade.
    await page
      .waitForFunction(
        () => getComputedStyle(document.querySelector("[data-reveal-frame]")).opacity === "1",
        null,
        { timeout: 15000 },
      )
      .catch(() => {});
    await page.evaluate(() => document.fonts.ready);

    const m = await measure(page);
    // A run that found nothing asserted nothing, and that is a failure.
    const ok = m.count >= 4 && m.problems.length === 0;
    if (!ok) failed = true;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${`${width}x${height}`.padEnd(10)} ${label.padEnd(17)} stops ${m.count}` +
        (m.count >= 4 ? "" : "   <- measured nothing"),
    );
    for (const p of m.problems) console.log(`      ${p}`);
  } catch (error) {
    failed = true;
    console.log(`FAIL  ${width}x${height} ${label} -- ${error.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

await browser.close();

if (failed) {
  console.log("\nA check failed. See the comment at the top of this file.");
  process.exit(1);
}
console.log("\nAll viewports pass.");
