/**
 * Geometry checks for the landing page.
 *
 *     bun run dev                 # in another shell
 *     bun run check:landing
 *
 * There is no unit test suite here and there should not be one — almost nothing
 * on this page is a pure function. What can break is geometric, and geometry can
 * be measured: this drives a real browser, scrolls the page the way a reader
 * would, and asserts the two things that have actually gone wrong.
 *
 * Both assertions exist because the bug they catch shipped once:
 *
 *   RESTING     Landing on a case study must leave the hero fully faded and the
 *               panel dead centre. It rested at 0.26 opacity with the hero
 *               painted over the work, because the hero's handover and the first
 *               panel's snap point overlapped. Separately every panel sat 48px
 *               low, from a scroll-margin shifting the snap area.
 *
 *   CLEARANCE   Scrolling *through* the handover must never bring the definition
 *               block over a case study image. An earlier fix passed RESTING
 *               while leaving 11px of clearance mid-scroll — fine until the
 *               definition wrapped to another line.
 *
 * Run across several viewports on purpose. Both bugs were invisible at some
 * window sizes and obvious at others; the tall/portrait case in particular
 * failed when every laptop size passed.
 *
 * Uses the installed Google Chrome via `channel: "chrome"` rather than
 * downloading Playwright's own Chromium — nothing here needs a pinned build, and
 * it keeps a ~300MB download out of the project.
 */

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = [
  [1515, 1070, "reported window"],
  [1440, 900, "13in laptop"],
  [1920, 1080, "design frame"],
  [1280, 720, "small laptop"],
  [1024, 1366, "tall / portrait"],
  // Below lg the layout is structurally different -- the rail becomes a
  // horizontal strip and the panels' 35svh runway does not apply -- and that is
  // where the clearance invariant broke while every row above it passed. The
  // header of this file already said both bugs it guards "were invisible at some
  // window sizes and obvious at others"; the list did not act on it.
  [768, 1024, "tablet portrait"],
  [390, 844, "phone"],
];

// A panel is "centred" if it is within this of the middle. Not zero: browsers
// land on fractional pixels and device pixel ratios differ.
const CENTRE_TOLERANCE = 2;
// Below this the hero counts as gone.
const FADED = 0.02;
// The definition block must stay at least this clear of the first image.
const MIN_CLEARANCE = 40;

async function restingStates(page) {
  const slugs = await page.$$eval("nav a[href^='#case-']", (as) =>
    as.map((a) => a.getAttribute("href").slice(1)),
  );

  let worstOpacity = 0;
  let worstOffset = 0;
  for (const slug of slugs) {
    await page.click(`nav a[href="#${slug}"]`);
    await page.waitForTimeout(700);
    const s = await page.evaluate((id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      return {
        opacity: +getComputedStyle(document.querySelector("header")).opacity,
        offset: Math.round(r.top + r.height / 2 - window.innerHeight / 2),
      };
    }, slug);
    worstOpacity = Math.max(worstOpacity, s.opacity);
    worstOffset = Math.max(worstOffset, Math.abs(s.offset));
  }
  return { count: slugs.length, worstOpacity, worstOffset };
}

async function clearance(page) {
  return page.evaluate(async () => {
    const header = document.querySelector("header");
    const sentinel = document.querySelector('[aria-hidden="true"].h-0');
    const block = sentinel?.nextElementSibling;
    const panel = document.querySelector('[id^="case-"]');
    if (!block || !panel) return null;

    // Infinity means every sample was skipped, which is not the same as a large
    // clearance -- and `Math.round(Infinity) >= MIN_CLEARANCE` is true, so this
    // reported PASS having measured nothing. It is returned as null instead and
    // the caller treats that as unmeasured.
    let worst = Infinity;
    let at = null;
    let sampled = 0;
    const limit = window.innerHeight * 2;
    for (let y = 0; y <= limit; y += 10) {
      window.scrollTo(0, y);
      // Two frames: one for the scroll handler to run, one for it to paint.
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      if (+getComputedStyle(header).opacity <= 0.01) continue;
      sampled += 1;
      const gap =
        panel.getBoundingClientRect().top -
        block.getBoundingClientRect().bottom;
      if (gap < worst) {
        worst = gap;
        at = y;
      }
    }
    window.scrollTo(0, 0);
    if (!sampled || worst === Infinity) return null;
    return { gap: Math.round(worst), at };
  });
}

const browser = await chromium.launch({ channel: "chrome" });
let failed = false;

// Warm the server before measuring anything.
//
// Against `next dev` the first request compiles the route, which can take longer
// than any sane per-check timeout — and the cost lands on whichever viewport
// happens to go first, so runs failed at the top of the list and passed at the
// bottom for no reason to do with the page. One throwaway request pays that cost
// once, outside the results.
{
  const warm = await browser.newPage();
  try {
    await warm.goto(BASE, { waitUntil: "domcontentloaded" });
    await warm.waitForSelector("nav a[href^='#case-']", { timeout: 90000 });
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
    // Wait for the things being measured, not for the network. `networkidle` is
    // unreliable against a dev server (HMR keeps a socket open) and it says
    // nothing about whether React has hydrated — an earlier version of this
    // passed four viewports by measuring a page that had not rendered yet.
    await page.waitForSelector("nav a[href^='#case-']", { timeout: 15000 });
    await page.waitForSelector('[id^="case-"]', { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);

    const gap = await clearance(page);
    const rest = await restingStates(page);

    // Vacuous passes are the failure mode to guard hardest against: a run that
    // finds no pills asserts nothing, and reported PASS on four viewports here
    // before this existed.
    const measured = rest.count > 0 && gap !== null;
    const ok =
      measured &&
      rest.worstOpacity < FADED &&
      rest.worstOffset <= CENTRE_TOLERANCE &&
      gap.gap >= MIN_CLEARANCE;
    if (!ok) failed = true;

    console.log(
      `${ok ? "PASS" : "FAIL"}  ${String(`${width}x${height}`).padEnd(10)} ${label.padEnd(17)} ` +
        `panels ${rest.count}  hero ${rest.worstOpacity.toFixed(2)}  ` +
        `off-centre ${rest.worstOffset}px  clearance ${gap ? `${gap.gap}px` : "NOT MEASURED"}` +
        (measured ? "" : "   <- measured nothing"),
    );
  } catch (error) {
    failed = true;
    console.log(`FAIL  ${width}x${height} ${label} — ${error.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

await browser.close();

if (failed) {
  console.log("\nA check failed. Both assertions guard bugs that shipped once;");
  console.log("see the comment at the top of this file for what each one means.");
  process.exit(1);
}
console.log("\nAll viewports pass.");
