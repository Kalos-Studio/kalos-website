import { chromium } from "playwright"

const OUT = "/private/tmp/claude-501/-Users-omar-anees-Projects-kalos-website/4cd7313e-c348-425e-9121-47e958f5aca3/scratchpad/coned"
const URL = "https://www.coned.com/en/save-money/rebates-incentives-tax-credits/rebates-incentives-tax-credits-for-residential-customers/electric-vehicle-rewards"

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(6000)
await page.evaluate(() => {
  for (const sel of ["#onetrust-consent-sdk", ".onetrust-pc-dark-filter", "#onetrust-banner-sdk"])
    document.querySelectorAll(sel).forEach((n) => n.remove())
  // the "Feedback" tab is a fixed-position widget that sits over the hero
  document.querySelectorAll("[class*='feedback'],[id*='feedback'],[class*='Feedback']").forEach((n) => (n.style.display = "none"))
})
await page.waitForTimeout(500)

const box = await page.evaluate(() => {
  const anchors = document.querySelector("[class*='anchor-nav'],[class*='anchorNav'],[class*='sub-nav'],nav[class*='anchor']")
  const out = { anchorBottom: null, candidates: [] }
  if (anchors) out.anchorBottom = anchors.getBoundingClientRect().bottom + window.scrollY
  // report the tall blue bar we saw
  document.querySelectorAll("div,nav,section").forEach((n) => {
    const r = n.getBoundingClientRect()
    const bg = getComputedStyle(n).backgroundColor
    if (r.width > 1200 && r.height > 40 && r.height < 90 && /rgb\(0, *(9|1)[0-9]/.test(bg))
      out.candidates.push({ tag: n.tagName, cls: n.className.toString().slice(0, 60), top: r.top + scrollY, h: r.height, bg })
  })
  return out
})
console.log(JSON.stringify(box, null, 2))
await browser.close()
