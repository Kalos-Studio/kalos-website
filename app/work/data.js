// Standard format for a case study. Add one entry per project to the
// `caseStudies` array below — that's the only file you need to touch to add,
// reorder, or remove a project from /work.
//
// WRITE THESE AS STORIES. The default is a run of paragraphs that carries the
// reader from the client's situation through to what shipped, showing the value
// in the telling rather than asserting it under a label. The earlier entries
// here were built the other way, as Client Need / The Work / The Result with
// each beat pinned to a heading, and that structure is what a reader skims past
// rather than reads. `shell-tapup` below is the reference for the new voice.
//
// Consequences for the fields under it: the body is one reading column capped at
// a 40rem measure, which is the only layout there is now — the opt-in columns
// layout went when the last entry stopped using it. Use `heading` and `section`
// blocks sparingly if at all, since every one of them is a place the story
// stops. Drop images in where the narrative reaches something worth seeing, not
// at fixed intervals.
//
// `year` is gone too. It was documented from the beginning, populated on none of
// the entries and rendered nowhere, and a field in that state is a standing
// invitation to wonder whether it broke.
//
// No em dashes in any string here. Nothing enforces it -- the copy-lint script
// this note used to cite came from another branch and does not exist in this
// project -- but it is a brand preference that applies to every line that ships.
//
// {
//   slug: "kebab-case-id",     // required, unique — becomes the URL /work/<slug>
//   title: "Project Title",    // required
//   summary: "One line describing the project.", // required — shown on the
//                                                  // listing card and at the
//                                                  // top of the case study
//   role: "What we did",       // optional — the facts line under the summary.
//                              // Disciplines, not a job title, and drawn from
//                              // one vocabulary across every entry: "User
//                              // Research", "<domain> Strategy", "<surface>
//                              // Design", "Development". Three to five.
//
//                              // `client` went the way `year` did. It was
//                              // rendered beside the role and dropped whenever
//                              // it repeated the title, which was most entries,
//                              // so half these pages read "Shell / ..." and
//                              // half read nothing. The client's name is in
//                              // the title and the first paragraph of every
//                              // study already.
//   cover: {                   // optional — omit to show a placeholder
//     src: "/work/kebab-case-id/cover.jpg", // put images in /public/work/<slug>/
//     alt: "Description of the cover image for screen readers",
//     heroPosition: "center",  // optional CSS object-position, e.g. "bottom" —
//                               // the case study's hero crops to a wider box
//                               // than the listing card, so a screenshot with
//                               // important content near the top (like a nav
//                               // bar) may need to anchor lower to avoid
//                               // slicing through it. Card crop is unaffected.
//     cardPosition: "center",  // optional CSS object-position for the
//                               // listing card and "more case studies"
//                               // thumbnail, both cropped to 16:10. An image
//                               // wider than that (most screenshots are) gets
//                               // cropped evenly off both sides by default —
//                               // set this if that clips something important
//                               // near an edge, e.g. "30% center" to keep
//                               // more of the left side in frame.
//   },
//   landingCover: {            // optional — spread OVER `cover` for the
//                               // landing page panel only, so any key left out
//                               // falls through to `cover` and the case study
//                               // page is untouched. Two things need it:
//     src: "...",               // a different frame reads better at panel size
//                               // than the one the case study opens on
//                               // (echocare shows the map, not the login),
//     floating: true,           // and artwork that carries its own transparent
//                               // ground wants no plate behind it. See the
//                               // panel in app/(landing)/page.js.
//   },
//   body: [                    // optional — the content blocks on the case
//                               // study page, rendered top to bottom
//     { type: "paragraph", text: "..." },
//     { type: "heading", text: "..." },       // a single standalone heading
//     { type: "section", kicker: "...", heading: "..." }, // a small-caps label
//                               // above a bolder headline — use this instead
//                               // of two "heading" blocks in a row, which
//                               // render identically and read as flat
//     { type: "image", src: "/work/kebab-case-id/detail-1.jpg", alt: "...", caption: "..." },
//     { type: "list", items: ["...", "..."] },
//     { type: "quote", text: "...", attribution: "Name, Title, Company" },
//                               // a client testimonial. Always attribute it to
//                               // a named person: an unattributed pull quote is
//                               // our own copy set in bigger type.
//   ],
// }

// Shared metadata bit — every /work page follows the same "<title> — Kalos"
// convention, so this stays in one place instead of being re-typed at each
// page's export const metadata / generateMetadata.
//
export function workPageTitle(title) {
  return `${title} — Kalos`;
}

// A `workIndex` export -- the /work listing page's headline and standfirst --
// lived here. That page is gone: the landing page is the portfolio, and a second
// list of the same case studies would only drift from the first. /work now
// redirects to the landing's work section.


// Array order is render order -- the pill rail on the landing page, the panels
// it tracks, and the "more case studies" grid all read this order, so it is a
// decision rather than a side effect of when things were added.
//
// This follows the brand wireframe rather than the "deepest engagements first"
// ordering it replaced. That earlier order was a real argument, but the rail is
// the thing a visitor actually reads now and the wireframe is what the order was
// designed against. One order drives everything; reorder by moving entries, not
// by adding a sort.
//
// `shortName` exists because the pills are 181px in a 1920 frame and the titles
// do not fit. It is the label in the rail; `title` is still what the case study
// page and its <title> use. Absent, callers should fall back to `title`.
const allWork = [
  {
    slug: "mara",
    title: "MARA",
    shortName: "MARA",
    logo: "/home/logos/mara.webp",
    summary:
      "The in-house design function for an energy company's whole portfolio, from partner brand systems to the events that put them in front of governments.",
    role: "Brand Strategy, Brand Identity, Brand Guidelines, Art Direction",
    cover: {
      src: "/work/mara/cover.jpg",
      alt: "A tiled wall of brand deliverables across many different companies and products",
    },
    body: [
      {
        type: "paragraph",
        text: "MARA turns wasted energy into power. Gas that would otherwise be flared at a well site becomes electricity and, downstream of that, computation. It is a genuinely interesting business and it comes with an unusual design problem: MARA is not one company presenting one face. It is a portfolio of internal teams and partner companies, each of which needs to be its own brand rather than a variation on a parent one.",
      },
      {
        type: "paragraph",
        text: "The clearest example of what that demands is Exaion. MARA partnered with EDF, the French state energy major, and its technology division Exaion, to build smarter power systems. We led the creation of Exaion's brand kit from nothing. The requirement was contradictory on its face: give Exaion an identity distinctive enough to be recognisably its own and authentic to a technology company inside an energy group, while keeping it close enough to MARA's master guidelines that the two read as parts of one ecosystem rather than two companies that happen to share an investor. Most of the work was in judging how far apart to put them.",
      },
      {
        type: "paragraph",
        text: "That was one of several. We ran the strategy and design for multiple brand identity systems in parallel, each with its own logo, colour, typography and full guideline set, built so that the team receiving it could apply it without us.",
      },
      {
        type: "image",
        src: "/work/mara/anduro-kit.jpg",
        alt: "The closing slide of the Anduro brand kit",
        caption: "Anduro",
      },
      {
        type: "image",
        src: "/work/mara/mara-slipstream-kit.jpg",
        alt: "The closing slide of the MARA Slipstream brand kit",
        caption: "MARA Slipstream",
      },
      {
        type: "paragraph",
        text: "Then we stayed, which is the part that actually decides whether any of it survives. We owned these systems long term: writing the documentation, governing the guidelines, and periodically auditing the shared component libraries to catch drift before it spread. Design debt in a portfolio compounds quietly. A logo used slightly wrong once becomes the version everybody copies, and eighteen months later the fix is a project rather than a correction. Auditing meant teams spent less time reconciling inconsistent files and more time shipping.",
      },
      {
        type: "paragraph",
        text: "Alongside the systems work we designed the things the company meets the outside world through. A government summit where state representatives and industry speakers set out how their regions are adopting gas-to-power. An infographic explaining the onsite gas-to-power solution, where the job was to make a technical process legible to a room containing both engineers and legislators without patronising either. The 2024 Social Responsibility Report, laying out greenhouse gas emissions and board oversight as a transparent argument rather than a compliance document.",
      },
      {
        type: "paragraph",
        text: "And the hackathon, which is the one people remember. A hundred builders, one day, prompts about the collision between AI, computing power and energy, judges from Apple, Nvidia, LG and DoorDash, and a single bitcoin for the winners. We designed and built the landing page they signed up through, the social campaign around it, and the decks it ran on.",
      },
    ],
  },
  {
    slug: "priority-ambulance-transfer",
    title: "Priority Ambulance Transfer",
    shortName: "Priority",
    logo: "/home/logos/priority-ambulance-transfer.svg",
    summary:
      "Texas-based medical transport company providing ambulance and wheelchair transport across the greater Houston area and beyond.",
    role: "Brand Strategy, Brand Identity, Fleet Livery, Web Design, Development",
    cover: {
      src: "/work/priority-ambulance-transfer/cover.jpg",
      alt: "The Priority Ambulance Transfer homepage hero, \"When every minute matters, we're already moving.\"",
      cardPosition: "left center",
    },
    body: [
      {
        type: "paragraph",
        text: "Priority Ambulance Transfer launched with nothing. No name recognition, no logo, no website, nothing a hospital discharge planner could use to tell them apart from any other transport provider in Houston. That is a harder starting position than it sounds, because the people they needed to win over are making a decision about whether a patient will be moved safely, and they are making it fast, from whatever is in front of them. A company with no visible identity reads as a risk.",
      },
      {
        type: "paragraph",
        text: "So everything had to exist at once, and it had to be credible to facility partners on day one. We built the identity from the ground up: logo and wordmark, colour system, typography, and the visual language that would carry across every touchpoint a partner might encounter.",
      },
      {
        type: "paragraph",
        text: "Then we put it on the largest object the company owns. The ambulance fleet is the brand's most visible asset by an enormous margin, seen by more people in a week than the website will reach in a year, and a wrap is unforgiving: it is read at speed, at an angle, in the dark. Designing for that is a different discipline from designing for a screen.",
      },
      {
        type: "paragraph",
        text: "Underneath the visual work we authored the brand and content strategy, which is what stops an identity from being decoration. Positioning pillars, the verticals worth pursuing, how the audience segments between hospitals, care facilities and families, and a phased rollout so a company launching from zero was not trying to be everywhere in month one.",
      },
      {
        type: "image",
        src: "/work/priority-ambulance-transfer/services-page.jpg",
        alt: "The Priority Ambulance Transfer services page, showing the ambulance transport hero and a carousel of service types with photography of EMTs and patients",
        caption: "The services page, priorityat.com/services/ambulance.",
      },
      {
        type: "paragraph",
        text: "We designed and built the website end to end in Next.js and Tailwind, including the responsive architecture, the technical SEO, and the production deployment. And we produced the collateral that does the work in rooms we are not in: employee credentialing, facility-facing sales materials, service overviews, branded stationery.",
      },
      {
        type: "paragraph",
        text: "Priority went to market with one identity across the fleet, the site, and every piece of paper a partner would see before ever booking a transport. Holding the brand, the strategy and the build under one roof is what made the phased plan possible at all: there were no vendors to align, so the schedule was a decision rather than a negotiation.",
      },
    ],
  },
  {
    slug: "echocare",
    title: "EchoCare",
    shortName: "EchoCare",
    logo: "/home/logos/echocare.webp",
    summary:
      "B2B SaaS dispatch platform for emergency medical services and non-emergent medical transport operations.",
    role: "Product Design, Design Systems",
    cover: {
      src: "/work/echocare/cover.jpg",
      alt: "The EchoCare login screen, \"The help you need, when you need it,\" with an animated network of service icons",
      cardPosition: "left center",
    },
    // The login screen is the right opening image for the case study and the
    // wrong one for the landing panel: half of it is an empty sign-in form, and
    // at panel size that reads as a screenshot of nothing. The trip tracking
    // view shows the product doing its job.
    landingCover: {
      src: "/work/echocare/trip-tracking.jpg",
      alt: "An EchoCare trip detail view with live GPS tracking, route, and a dispatch tracking timeline",
      cardPosition: "center",
    },
    body: [
      {
        type: "paragraph",
        text: "A dispatcher at an ambulance service is making decisions with a clock running and no undo. A unit is closer but finishing another trip. A patient needs a wheelchair van and the only one free is forty minutes out. A scheduled transfer just became urgent. None of these are hard questions on their own, and all of them arrive at once.",
      },
      {
        type: "paragraph",
        text: "EchoCare is the platform those decisions are made on, for emergency medical services and the non-emergent transport that runs alongside them. We led product design across the whole of it: scheduling, fleet and unit management, the trip lifecycle from request to close, and the billing and insurance workflows that decide whether any of it gets paid for.",
      },
      {
        type: "image",
        src: "/work/echocare/dispatch-board.jpg",
        screenshot: true,
        alt: "The EchoCare dispatch board, showing a live timeline of units, trips, and delay states across a service area",
        caption: "The dispatch board: every unit, every trip, and every delay, live.",
      },
      {
        type: "paragraph",
        text: "The dispatch board is where the design either works or does not. It has to hold a whole service area's worth of units and trips without becoming a wall, surface a conflict the moment it exists rather than when someone scrolls to it, and let a state change that could go five different ways be made in one gesture without becoming ambiguous about which way it went. Time-sensitive is the phrase people use. What it means in practice is that every extra confirmation is a cost paid by someone waiting.",
      },
      {
        type: "image",
        src: "/work/echocare/trip-tracking.jpg",
        screenshot: true,
        alt: "An EchoCare trip detail view with live GPS tracking, route, and a dispatch tracking timeline",
        caption: "A trip's whole life, from assignment through to arrival.",
      },
      {
        type: "paragraph",
        text: "Underneath the product we built and maintained the design system in Figma, and then took it further than a component library usually goes: into documented standards that engineering could build from without a meeting to interpret them. A design system that needs its authors present is a bottleneck wearing a nice interface.",
      },
      {
        type: "paragraph",
        text: "The last part of the work is the part nobody puts on a portfolio and everybody needs. We sat between product and engineering translating operational requirements into patterns that could actually ship, and we checked the marketing against the software. When a claim on the website and the behaviour of the platform disagree, the platform is not the thing that gets fixed first, and someone has to be willing to say so.",
      },
    ],
  },
  {
    slug: "allganize-website-redesign",
    title: "Allganize Website Redesign",
    shortName: "Allganize",
    logo: "/home/logos/allganize.webp",
    summary: "Pushing the future of workforce AI further.",
    role: "Web Design, Development",
    cover: {
      src: "/work/allganize-website-redesign/cover.webp",
      alt: "The Allganize homepage hero, \"The All-In-One LLM Enabler For Enterprise,\" shown on a laptop screen",
    },
    body: [
      {
        type: "paragraph",
        text: "Allganize sells enterprise AI in the most crowded category in software, and their site was not helping. It had gone dated in the way sites do when a company grows faster than its marketing: not badly built, just anonymous. Nothing on it said which company you were looking at. In a market where every competitor is making the same promise in the same words, that is the whole problem.",
      },
      {
        type: "paragraph",
        text: "Underneath the styling was a structural issue. Three genuinely different products were sharing one paragraph. On-premise LLM infrastructure, the no-code Alli App Builder, and the App Market are bought by different people for different reasons, and the site folded them into a single long features page. A visitor could not tell them apart, and had no way to work out where to start.",
      },
      {
        type: "paragraph",
        text: "So we restructured the information architecture around the suite as it actually exists, and gave each product a section of its own. Comparable, distinct, and possible to arrive at directly. That change alone does something competitors bundling everything into one pitch cannot easily answer.",
      },
      {
        type: "image",
        src: "/work/allganize-website-redesign/detail-1.webp",
        alt: "The Allganize homepage's Alli App Builder section, \"AI-Powered Business Automation,\" showing a no-code workflow canvas",
        caption: "The App Builder section, showing the canvas rather than describing it.",
      },
      {
        type: "paragraph",
        text: "For the products where the value is in the doing, we designed the visuals instead of writing another paragraph. Workflow canvases, chat mockups, the skill builder mid-build. An enterprise buyer evaluating an AI platform has read the paragraph already, on four other sites this week. What they have not seen is the thing running.",
      },
      {
        type: "image",
        src: "/work/allganize-website-redesign/detail-2.webp",
        alt: "The Allganize homepage's \"Build LLM Enabled AI Apps\" section, showing a skill-builder workflow canvas in the Alli Suite",
        caption: "The Alli Suite section: a skill being built, not a bullet list.",
      },
      {
        type: "paragraph",
        text: "We built and shipped it end to end, from responsive page templates through to production deployment, so the redesign went live without a handoff in the middle of it. The site reads clearly now whether the visitor is a first-time prospect working out what Allganize does, or a customer who knows exactly which product they came for.",
      },
    ],
  },
  {
    // Not written up yet. It renders on the landing page as an empty framed
    // slot in the run of case studies, and as a muted pill in the rail, so the
    // work reads as eight projects with one still to come rather than seven and
    // a gap. `placeholder` is what keeps it out of everything else: it never
    // gets a route, never appears in "more case studies", and has no /work page.
    //
    // To publish it: write the `body`, add a cover and a logo, delete the
    // `placeholder` flag. Nothing else needs changing.
    slug: "conedison",
    title: "ConEdison SmartCharge",
    shortName: "ConEdison",
    summary:
      "A zero to one build for an electric vehicle charging incentive programme.",
    role: "Product Strategy, Product Design, Development",
    logo: "/home/logos/conedison.webp",
    placeholder: true,
  },
  {
    slug: "vital-energy",
    title: "Vital Energy",
    shortName: "Vital Energy",
    logo: "/home/logos/vital-energy.webp",
    summary:
      "Intelligent field operations for an independent energy producer, from a ten week definition sprint to a multi-year platform.",
    role: "User Research, Product Strategy, Product Design, Development",
    cover: {
      src: "/work/vital-energy/cover.webp",
      alt: "The Vital Energy dynamic routing dashboard, showing task counts by priority, well battery readings, and a daily oil production chart",
    },
    // The file already has a transparent ground and its own drop shadow, so the
    // panel's grey plate would be a second frame drawn around artwork that came
    // pre-framed -- and a crop would cut the very edges that make it read as
    // floating. Only `floating` is set here: the rest falls through to `cover`
    // above.
    landingCover: { floating: true },
    body: [
      {
        type: "paragraph",
        text: "Everyone in oil and gas agrees the future of the field is digital. Very few fields are. The infrastructure is old, the culture is older, and the people who would benefit most from better data are the ones standing furthest from a desk. Vital Energy wanted to be on the other side of that, and came to us because the gap between having data and being able to act on it at a well site was costing them production they could see and could not reach.",
      },
      {
        type: "paragraph",
        text: "The specific problem was visibility. Systems at the well site did not talk to each other, so an operator arriving at a lease had no reliable picture of what was happening underground or which of the day's stops actually mattered. Routes were planned on habit. A technician might drive past the well that needed them to reach one that did not.",
      },
      {
        type: "paragraph",
        text: "We had ten weeks to prove there was something here. Working sessions and site visits first, because the constraint on a solution like this is rarely the software: it is what a person can do while wearing gloves in the middle of a field. Out of that came two products, defined and designed inside the sprint. An Electrical Submersible Pump application for the health of the wells themselves, and a Field Data Capture tool that could be shaped to how a given team actually records what they see.",
      },
      {
        type: "image",
        src: "/work/vital-energy/esp-overview.webp",
        alt: "The Vital Energy ESP Overview table, listing wells with NAICS codes, location, status, drift and feedback state",
        caption: "ESP Overview: every well's status in one place, rather than in several.",
      },
      {
        type: "paragraph",
        text: "The ten weeks turned into a twenty-two month partnership, and the centre of it became Dynamic Routing. The premise is simple to say and hard to build: instead of a fixed route, give each operator a list of stops ordered by where they are and what each stop is worth. A well quietly losing barrels outranks a scheduled check on one that is fine. The system knows the difference, so the person does not have to.",
      },
      {
        type: "image",
        src: "/work/vital-energy/dynamic-routing.webp",
        alt: "The Vital Energy dynamic routing map, showing well locations across a lease with an asset insights panel and activity history",
        caption: "Routing on the map, with the reasoning for each stop attached to it.",
      },
      {
        type: "paragraph",
        text: "Around it we built the things that make a routing decision trustworthy. A centralised data system where route-specific data can be filtered and route health read off a set of KPIs rather than inferred. Well-level views that put tasks, production insight and recommendations side by side, so telemetry can be compared and corrected in place. And alternative map views for lease operators, because the person driving the route and the person planning it are not looking for the same thing.",
      },
      {
        type: "image",
        src: "/work/vital-energy/production-optimization.webp",
        alt: "A Vital Energy well detail view for Bodine-C-302HM, with production optimization controls, forecasted results, model validation statistics and an optimization map",
        caption: "Well-level optimisation, with the model's own confidence shown next to its output.",
      },
      {
        type: "paragraph",
        text: "The platform is in the field now, and the change it makes is not dramatic to look at. Data is where the decision is being made instead of back at the office. The day's stops are in the order that pays. The operators are the ones who noticed first.",
      },
      {
        type: "quote",
        text: "We are very excited and very proud of our dynamic routing application, which the team helped us develop and build.",
        attribution: "Brandon Brown, CTO, Vital Energy",
      },
    ],
  },
  {
    // The only entry here that is not a client engagement: a design exploration
    // rather than commissioned work. It earns its place on the strength of the
    // thinking, which is also why the copy never claims more about the
    // relationship than "for H-E-B".
    slug: "my-heb-app",
    title: "My H-E-B App",
    shortName: "H-E-B",
    logo: "/home/logos/my-heb-app.webp",
    summary:
      "A design exploration for H-E-B, the largest grocery chain in Texas, that fixes checkout by moving it out of checkout and turning a shopping list into a route through the store.",
    role: "Design Exploration, User Research, Product Design",
    cover: {
      src: "/work/my-heb-app/cover.webp",
      alt: "Three My H-E-B app screens: a shopping list ready to start a trip, an in-store camera view with a turn arrow and a running total, and the trip drawn as a route across the store map with an estimated total",
    },
    // No `landingCover`. There used to be one, carrying a second trimmed copy
    // of the artwork, because the cover had a dark maroon ground that had to be
    // knocked out for the landing panel while the hero cropped over a #111
    // surface. Neither exists any more: the cover is three real screens on
    // white, exported at exactly 2x the 1195/681 both frames use, so it fills
    // them without a crop and there is nothing for a plate to show behind.
    //
    // It briefly carried `floating: true` as well, which was wrong twice over:
    // the file is opaque, and at this aspect the flag changed nothing it could
    // be checked by. `floating` means artwork with a transparent ground -- see
    // vital-energy above for the real thing.
    body: [
      {
        type: "split",
        text: "Everyone brings their phone to the grocery store. In Texas that store is very often an H-E-B, the largest grocery chain in the state, and on most of those phones the My H-E-B app is already installed, already open, and being used as a list and not much else. It is the one piece of software present at the exact moment a shopper is standing in an aisle deciding what to do next, and it was doing almost nothing with that.",
        src: "/work/my-heb-app/list.webp",
        screenshot: true,
        alt: "The H-E-B app shopping list, with items grouped under In Produce, In Dairy on the Back Wall and Aisle 32",
        caption: "The list as the app holds it today: things to buy, in no particular order.",
      },
      {
        type: "paragraph",
        text: "The question on the table was checkout. Make it easier, make it faster, lose fewer people on the way out the door. We spent time with shoppers in stores to find where it actually broke, and the complaints did not stay inside checkout for long. People talked about the screens at the end, and then they talked about the forty minutes before them. One of them put it plainly: the app's navigation to an item is pretty pointless, you have to calculate where you are in the store.",
      },
      {
        type: "image",
        src: "/work/my-heb-app/painpoints.webp",
        alt: "Two columns of frustrations, headed Checkout and Shopping, covering too many screens, editing that resets progress, signup gates, inaccurate in-store navigation and missing user location",
        caption: "Two piles of complaints that turned out to be one problem.",
      },
      {
        type: "paragraph",
        text: "Those are not two problems. A shopper who cannot find the fourth thing on their list arrives at the till already tired of the trip, and an app that knows where someone is standing in a store also knows what they have picked up. The interesting move was not to redesign checkout. It was to make checkout something that had already happened.",
      },
      {
        type: "image",
        src: "/work/my-heb-app/wireframes.webp",
        screenshot: true,
        alt: "Hand-drawn wireframes of the Spree flow, showing an aisle view with a route arrow beside a scrolling list of items and turn-by-turn steps",
        caption: "Working the trip out on paper before any of it was drawn properly.",
      },
      {
        type: "split",
        flip: true,
        text: "The proposal starts from the list a shopper already keeps and turns it into a route, a trip the app calls a Spree. It orders that list the way the store is actually laid out, walks the shopper through it aisle by aisle, and adds each item to a running total as it goes into the cart. Groceries stop being a search problem. The trip has a shape, a length and a number attached to it, and the number is true the whole way round.",
        srcs: [
          "/work/my-heb-app/route.webp",
          "/work/my-heb-app/total.webp",
        ],
        screenshot: true,
        alts: [
          "The Spree camera view showing distance to the next item and a running total",
          "The expanded drawer listing the whole route aisle by aisle",
        ],
        alt: "The Spree camera view showing distance to the next item and a running total, beside the expanded drawer listing the whole route aisle by aisle",
        caption: "The next turn, the running total, and the whole route behind it.",
      },
      {
        type: "split",
        text: "A running total is only worth having if it is right, and that is where most of the design went. Produce is sold by weight, so the flow takes a weight before it takes a price. Half of what ends up in a cart was never on the list, so anything picked up on impulse can be scanned into the trip where it is picked up. A total that is right most of the time is worse than no total at all, and the distance between those two is the work.",
        srcs: [
          "/work/my-heb-app/scale.webp",
          "/work/my-heb-app/barcode.webp",
        ],
        screenshot: true,
        alts: [
          "A scale step asking for the weight of loose apples over the store map",
          "A barcode scan confirming an item to add to the trip",
        ],
        alt: "A scale step asking for the weight of loose apples over the store map, beside a barcode scan confirming an item to add to the trip",
        caption: "Weight for produce, a scan for everything that was never on the list.",
      },
      {
        type: "split",
        flip: true,
        text: "The trip ends with a code. No form, no account wall, no review screen to be sent back through. A shopper hands it to a cashier or scans it at self checkout, and the part of the experience the whole question started with takes a few seconds, because the rest of it already happened on the way around the store.",
        src: "/work/my-heb-app/finish.webp",
        screenshot: true,
        scroll: true,
        alt: "The finished Spree screen, showing a QR code to hand to a cashier, the items picked up and an estimated total of $11.34",
        caption: "The trip ends with a code and a number that has been right all along.",
      },
      {
        type: "split",
        text: "Lists, finding an item on a store map, a cart that follows a shopper around the aisles: the shape of what was proposed here is close to the shape of how the app works today. Ideas rarely travel with attribution attached, and finding them in the product later is the version of being right that counts.",
        src: "/work/my-heb-app/receipt.webp",
        screenshot: true,
        alt: "The receipt screen, thanking the shopper and listing the items with a subtotal, tax and total",
        caption: "What is left of checkout.",
      },
    ],
  },
  {
    slug: "shell-tapup",
    title: "Shell TapUp",
    shortName: "Shell",
    logo: "/home/logos/shell-tapup.webp",
    summary: "Native iOS and Android app design for Shell's global refueling service.",
    role: "User Research, Mobile App Design, Development",
    cover: {
      src: "/work/shell-tapup/cover.jpg",
      alt: "A Shell TapUp driver app screenshot, showing tank levels and fueling controls, composited over a photo of the Shell pecten logo at a refueling station",
    },
    body: [
      {
        type: "paragraph",
        text: "Shell came to us with a pilot programme and a question about it. TapUp brings the fuel to the vehicle rather than the vehicle to the station, and for a business running a fleet that is the difference between a driver losing an hour and never leaving the yard. The idea worked. What it ran on was people, paper, and a set of tools that had never been designed to work together.",
      },
      {
        type: "paragraph",
        text: "Every job passed through several of them. A driver took an order in one place, operated the pump in another, and closed out the invoice somewhere else again, and each handoff between those steps was somewhere a mistake could enter. Shell was seeing the results across the operation: inconsistent records, data that did not reconcile, and more time spent at each vehicle than the work actually needed.",
      },
      {
        type: "paragraph",
        text: "We started with the drivers, because they were the ones absorbing the problem. Through interviews, working sessions and on-site visits we built up a picture of how fuel actually moves through Shell's delivery ecosystem, which turned out to be a good deal messier than any process document described. The errors were not carelessness. They were what happens when a job has more steps than a person can hold while standing next to a running pump.",
      },
      {
        type: "split",
        src: "/work/shell-tapup/orders.webp",
        alt: "The Shell TapUp orders screen, showing two tank gauges, begin and stop fueling controls, and the next order on the route",
        caption: "Tank levels, the pump control and the next stop, on one screen.",
        text: "So the app was built around that rather than around the org chart. Fewer steps to complete a job. Status legible at a glance instead of recalled from memory. Wetstock tracked in real time, vehicles found and fueled through a guided flow, invoicing wired straight into billing and reconciliation, and safety reporting for incidents, spills and inspections put where a driver would actually reach for it. Even truck-to-truck transfers, the kind of edge case that usually lives in somebody's notebook, got a place in the product.",
      },
      {
        type: "paragraph",
        text: "The last phase was the one that is easy to skip and expensive to skip. Rather than shipping a working app and calling the pilot proven, we spent the end of the engagement on industrialisation: a universal data framework underneath it, so that what Shell had was something they could grow into new regions and new vehicle types rather than a good prototype that would need rebuilding the first time it met a market it was not designed for.",
      },
      {
        type: "paragraph",
        text: "What shipped is a pair of native iOS and Android apps, running globally, where a driver manages orders, operates the pump remotely and submits the invoice without leaving the screen. The separate tools and the paperwork between them are gone. For Shell's customers the visible change is smaller and more useful: the fuel arrives, the numbers are right, and nobody has to sort it out afterwards.",
      },
      {
        type: "quote",
        text: "Very strong at managing product delivery, great at adapting to curve balls, and re-prioritizing.",
        attribution: "Humza Saleem, Global Product Manager, Shell TapUp",
      },
    ],
  },
];

// Two views of the list above, and which one you want is the whole point.
//
// `caseStudies` is everything with a page behind it, and it is what every
// existing consumer already imports -- the case study route, generateStaticParams
// and the "more case studies" grid. Filtering here rather than at each call site
// means a placeholder cannot leak into a route or a link by someone forgetting a
// guard: the default is the safe one, and reaching the placeholder takes a
// deliberate different import.
//
// `workRail` is the full eight, placeholder included, for the landing page's pill
// rail -- the one surface that is supposed to show a slot with nothing behind it.
export const caseStudies = allWork.filter((cs) => !cs.placeholder);

export const workRail = allWork;

