/**
 * Content queue for the autonomous content engine.
 *
 * Section A: new site reviews to publish (one row per future review).
 * Section B: supporting content (discounts, comparisons, hubs, guides, ...).
 *
 * `scripts/generate-daily-content.ts` reads this file each day, picks the
 * next item by priority + content-type rotation, generates the page, and
 * flips the row's `status` to "published" once the build succeeds.
 */

export type ReviewQueueStatus = "queued" | "published" | "skipped";

export type ReviewEditorialMode =
  /** Default — has (or will have) an affiliate program; review writes the
   *  full conversion path with Visit Site CTA, pricing, AggregateOffer. */
  | "ready"
  /** SEO-only review for a high-demand site we don't yet partner with.
   *  Picker can still write it (capped at top 3-5 by demand) but the
   *  rendered page hides the affiliate CTA and shows a "not yet
   *  partnered" disclosure. Captures franchise-cluster traffic without
   *  promising a commission relationship that doesn't exist. */
  | "research-only"
  /** Permanently disabled — picker never selects. Slug collisions,
   *  abandoned sites, etc. */
  | "archived";

export interface ReviewQueueEntry {
  name: string;
  slug: string;
  homepage_url: string;
  affiliate_url: string | null;
  affiliate_network: string | null;
  niche: string[];
  priority: number; // 1 (low) – 10 (high)
  estimated_monthly_searches: number;
  status: ReviewQueueStatus;
  content_type: "review";
  /** Defaults to "ready" when omitted (matches all existing entries). */
  editorial_mode?: ReviewEditorialMode;
}

export type SupportingContentType =
  | "discount"
  | "comparison"
  | "bestof"
  | "alternatives"
  | "isworthit"
  | "pricing"
  | "freetrial"
  | "guide"
  | "hub"
  | "awards";

export interface SupportingQueueEntry {
  title: string;
  slug: string;
  content_type: SupportingContentType;
  target_keyword: string;
  related_sites: string[]; // existing site slugs
  priority: number;
  status: "queued" | "published";
}

// ---------------------------------------------------------------------------
// SECTION A — new site review queue
// Ordered: sites with confirmed affiliate URLs first, then pending approvals.
// ---------------------------------------------------------------------------
export const reviewQueue: ReviewQueueEntry[] = [
  // ── AdultForce (URL pending) ─────────────────────────────────────────────
  {
    name: "Men.com",
    slug: "men",
    homepage_url: "https://www.men.com",
    affiliate_url: null,
    affiliate_network: "AdultForce",
    niche: ["premium-studios", "hd-quality"],
    priority: 10,
    estimated_monthly_searches: 165000,
    status: "published",
    content_type: "review",
  },
  {
    name: "Sean Cody",
    slug: "sean-cody",
    homepage_url: "https://www.seancody.com",
    affiliate_url: null,
    affiliate_network: "AdultForce",
    niche: ["premium-studios", "hd-quality", "amateur-twinks"],
    priority: 10,
    estimated_monthly_searches: 110000,
    status: "published",
    content_type: "review",
  },
  {
    name: "Bromo",
    slug: "bromo",
    homepage_url: "https://www.bromo.com",
    affiliate_url: null,
    affiliate_network: "AdultForce",
    niche: ["premium-studios", "hd-quality"],
    // MONETIZABLE-SOON: AdultForce deal approved, affiliate URL pending.
    // Write the editorial review now so it's ready to flip to "ready".
    priority: 10,
    estimated_monthly_searches: 60500,
    status: "queued",
    content_type: "review", editorial_mode: "research-only"},

  // ── Buddy Profits (pending) ─────────────────────────────────────────────
  {
    name: "Falcon Studios",
    slug: "falcon-studios",
    homepage_url: "https://www.falconstudios.com",
    affiliate_url: null,
    affiliate_network: "Buddy Profits",
    niche: ["premium-studios", "hd-quality"],
    // MONETIZABLE-SOON: AEC/Falcon network — active conversation. Flagship
    // of the Falcon cluster (raging-stallion, hot-house, falcon-edge).
    priority: 10,
    estimated_monthly_searches: 49500,
    status: "queued",
    content_type: "review", editorial_mode: "research-only"},
  {
    name: "Icon Male",
    slug: "icon-male",
    homepage_url: "https://www.iconmale.com",
    affiliate_url: null,
    affiliate_network: "Buddy Profits",
    niche: ["premium-studios"],
    priority: 7,
    estimated_monthly_searches: 18100,
    status: "published",
    content_type: "review",
  },
  {
    name: "Active Duty",
    slug: "active-duty",
    homepage_url: "https://www.activeduty.com",
    affiliate_url: null,
    affiliate_network: "Buddy Profits",
    niche: ["premium-studios", "amateur-twinks"],
    // MONETIZABLE-SOON: Buddy Profits deal pending.
    priority: 10,
    estimated_monthly_searches: 33100,
    status: "queued",
    content_type: "review", editorial_mode: "research-only"},

  // ── MONETIZABLE-SOON: Buddy Profits (pending) ───────────────────────────
  // Write the editorial review before the deal closes so it's ready to flip
  // to "ready". Kept in the high band alongside bromo/falcon-studios/active-duty.
  { name: "Next Door Studios", slug: "next-door-studios", homepage_url: "https://www.nextdoorstudios.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 9, estimated_monthly_searches: 27100, status: "queued", content_type: "review", editorial_mode: "research-only" },

  // ── MONETIZABLE-SOON: AEC/Falcon network (active conversation) ──────────
  // Falcon cluster — falcon-studios is the flagship (above). These three
  // share the same network deal, so they monetize together.
  { name: "Raging Stallion", slug: "raging-stallion", homepage_url: "https://www.ragingstallion.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 9, estimated_monthly_searches: 22200, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Hot House", slug: "hot-house", homepage_url: "https://www.hothouse.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 9, estimated_monthly_searches: 14800, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Falcon Edge", slug: "falcon-edge", homepage_url: "https://www.falconedge.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 9, estimated_monthly_searches: 8100, status: "queued", content_type: "review", editorial_mode: "research-only" },

  // ── DE-PRIORITIZED: no affiliate path located ───────────────────────────
  // Speculative SEO coverage only — no partner program found yet. Capped in
  // the ≤5 band so they never consume the editorial-only cap (or a publish
  // slot) ahead of a monetizable review. Bump any one of these into the high
  // band the moment a real affiliate path appears. Relative order among them
  // is preserved (search-demand proxy); GSC demand re-spreads them at runtime.
  { name: "Bel Ami Online", slug: "bel-ami-online", homepage_url: "https://www.belamionline.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "amateur-twinks", "hd-quality"], priority: 5, estimated_monthly_searches: 49500, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Corbin Fisher", slug: "corbin-fisher", homepage_url: "https://www.corbinfisher.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "amateur-twinks"], priority: 5, estimated_monthly_searches: 40500, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "CockyBoys", slug: "cockyboys", homepage_url: "https://www.cockyboys.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 5, estimated_monthly_searches: 33100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Czech Hunter", slug: "czech-hunter", homepage_url: "https://www.czechhunter.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 5, estimated_monthly_searches: 60500, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Lucas Entertainment", slug: "lucas-entertainment", homepage_url: "https://www.lucasentertainment.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 4, estimated_monthly_searches: 22200, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Staxus", slug: "staxus", homepage_url: "https://www.staxus.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "hd-quality"], priority: 4, estimated_monthly_searches: 18100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "William Higgins", slug: "william-higgins", homepage_url: "https://www.williamhiggins.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 4, estimated_monthly_searches: 18100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Freshmen", slug: "freshmen", homepage_url: "https://www.freshmen.net", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "hd-quality"], priority: 4, estimated_monthly_searches: 22200, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "ChaosMen", slug: "chaos-men", homepage_url: "https://www.chaosmen.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "premium-studios"], priority: 4, estimated_monthly_searches: 18100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Randy Blue", slug: "randy-blue", homepage_url: "https://www.randyblue.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 3, estimated_monthly_searches: 14800, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "GayRoom", slug: "gay-room", homepage_url: "https://www.gayroom.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 3, estimated_monthly_searches: 14800, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Eurocreme", slug: "eurocreme", homepage_url: "https://www.eurocreme.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 3, estimated_monthly_searches: 12100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "TimTales", slug: "timtales", homepage_url: "https://www.timtales.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 3, estimated_monthly_searches: 12100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "CollegeDudes", slug: "college-dudes", homepage_url: "https://www.collegedudes.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 3, estimated_monthly_searches: 9900, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "MenOver30", slug: "men-over-30", homepage_url: "https://www.menover30.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 3, estimated_monthly_searches: 9900, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "SpunkWorthy", slug: "spunkworthy", homepage_url: "https://www.spunkworthy.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 3, estimated_monthly_searches: 9900, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "English Lads", slug: "english-lads", homepage_url: "https://www.englishlads.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 3, estimated_monthly_searches: 9900, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Kristen Bjorn", slug: "kristen-bjorn", homepage_url: "https://www.kristenbjorn.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 3, estimated_monthly_searches: 9900, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Badpuppy", slug: "badpuppy", homepage_url: "https://www.badpuppy.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 2, estimated_monthly_searches: 8100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Str8Hell", slug: "str8hell", homepage_url: "https://www.str8hell.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 2, estimated_monthly_searches: 8100, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Hammer Boys", slug: "hammer-boys", homepage_url: "https://www.hammerboys.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 2, estimated_monthly_searches: 6600, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "Maskurbate", slug: "maskurbate", homepage_url: "https://www.maskurbate.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 2, estimated_monthly_searches: 6600, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "DadCreep", slug: "dad-creep", homepage_url: "https://www.dadcreep.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 2, estimated_monthly_searches: 6600, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "BoyNapped", slug: "boy-napped", homepage_url: "https://www.boynapped.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 2, estimated_monthly_searches: 6600, status: "queued", content_type: "review", editorial_mode: "research-only" },
  { name: "SexuallyBroken", slug: "sexually-broken", homepage_url: "https://www.sexuallybroken.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 1, estimated_monthly_searches: 4400, status: "queued", content_type: "review", editorial_mode: "research-only" },

  // Already published — not a candidate (status: published).
  { name: "TwinkPop", slug: "twinkpop", homepage_url: "https://www.twinkpop.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "hd-quality"], priority: 7, estimated_monthly_searches: 18100, status: "published", content_type: "review" },
];

// ---------------------------------------------------------------------------
// SECTION B — supporting content queue (discounts, comparisons, hubs, etc.)
// ---------------------------------------------------------------------------

const EXISTING_SLUGS = [
  "helix-studios",
  "next-door-twink",
  "next-door-world",
  "twinks-in-shorts",
  "athletic-twinks",
  "southern-strokes",
  "daddy-on-twink",
  "touch-that-boy",
  "breed-me-raw",
  "bareback-that-hole",
  "hard-brit-lads",
  "prideflame",
  "rawhole",
  "peterfever",
  "gayasiannetwork",
  "alternadudes",
  "dirtyboyvideo",
  "dudesraw",
];

const TOP_10_SLUGS = EXISTING_SLUGS.slice(0, 10);
const SITE_NAME: Record<string, string> = {
  "helix-studios": "Helix Studios",
  "next-door-twink": "Next Door Twink",
  "next-door-world": "Next Door World",
  "twinks-in-shorts": "Twinks in Shorts",
  "athletic-twinks": "Athletic Twinks",
  "southern-strokes": "Southern Strokes",
  "daddy-on-twink": "Daddy on Twink",
  "touch-that-boy": "Touch That Boy",
  "breed-me-raw": "Breed Me Raw",
  "bareback-that-hole": "Bareback That Hole",
  "hard-brit-lads": "Hard Brit Lads",
  "prideflame": "Prideflame",
  "rawhole": "RawHole",
  "peterfever": "PeterFever",
  "gayasiannetwork": "GayAsianNetwork",
  "alternadudes": "AlternaDudes",
  "dirtyboyvideo": "DirtyBoyVideo",
  "dudesraw": "DudesRaw",
};

const discountEntries: SupportingQueueEntry[] = EXISTING_SLUGS.map((slug) => ({
  title: `${SITE_NAME[slug]} Discount Code 2026`,
  slug: `discount/${slug}`,
  content_type: "discount",
  target_keyword: `${SITE_NAME[slug].toLowerCase()} discount`,
  related_sites: [slug],
  priority: 8,
  status: "published" as const, // existing DiscountPage covers all 18 slugs
}));

// Top 20 most logical comparison pairs.
const comparisonPairs: [string, string][] = [
  ["helix-studios", "next-door-twink"],
  ["helix-studios", "next-door-world"],
  ["helix-studios", "bel-ami-online"],
  ["next-door-twink", "next-door-world"],
  ["next-door-twink", "twinks-in-shorts"],
  ["twinks-in-shorts", "athletic-twinks"],
  ["twinks-in-shorts", "southern-strokes"],
  ["athletic-twinks", "southern-strokes"],
  ["bareback-that-hole", "breed-me-raw"],
  ["bareback-that-hole", "rawhole"],
  ["rawhole", "dudesraw"],
  ["breed-me-raw", "rawhole"],
  ["peterfever", "gayasiannetwork"],
  ["alternadudes", "dirtyboyvideo"],
  ["hard-brit-lads", "english-lads"],
  ["daddy-on-twink", "men-over-30"],
  ["touch-that-boy", "twinks-in-shorts"],
  ["prideflame", "peterfever"],
  ["next-door-world", "men"],
  ["helix-studios", "sean-cody"],
];

const comparisonEntries: SupportingQueueEntry[] = comparisonPairs.map(([a, b]) => ({
  title: `${SITE_NAME[a] || a} vs ${SITE_NAME[b] || b}`,
  slug: `compare/${a}-vs-${b}`,
  content_type: "comparison",
  target_keyword: `${SITE_NAME[a] || a} vs ${SITE_NAME[b] || b}`.toLowerCase(),
  related_sites: [a, b],
  priority: 7,
  status: "queued",
}));

const isWorthItEntries: SupportingQueueEntry[] = TOP_10_SLUGS.map((slug) => ({
  title: `Is ${SITE_NAME[slug]} Worth It?`,
  slug: `${slug}-worth-it`,
  content_type: "isworthit",
  target_keyword: `is ${SITE_NAME[slug].toLowerCase()} worth it`,
  related_sites: [slug],
  priority: 6,
  status: "queued",
}));

const alternativesEntries: SupportingQueueEntry[] = TOP_10_SLUGS.map((slug) => ({
  title: `Best Alternatives To ${SITE_NAME[slug]}`,
  slug: `alternatives-to-${slug}`,
  content_type: "alternatives",
  target_keyword: `${SITE_NAME[slug].toLowerCase()} alternatives`,
  related_sites: [slug],
  priority: 6,
  status: "queued",
}));

const pricingEntries: SupportingQueueEntry[] = TOP_10_SLUGS.map((slug) => ({
  title: `${SITE_NAME[slug]} Pricing & Plans`,
  slug: `${slug}-pricing`,
  content_type: "pricing",
  target_keyword: `${SITE_NAME[slug].toLowerCase()} price`,
  related_sites: [slug],
  priority: 5,
  status: "queued",
}));

// Renamed from hub → bestof. Rotation map previously expected "bestof" but
// these were tagged "hub", which left Wed permanently empty. With queue-driven
// resolution this is less critical, but the names now match the rotation
// constant so older references don't drift.
const hubEntries: SupportingQueueEntry[] = [
  { title: "Best Gay Bareback Sites", slug: "gay-bareback-sites", content_type: "bestof", target_keyword: "gay bareback sites", related_sites: ["rawhole", "dudesraw", "bareback-that-hole", "breed-me-raw"], priority: 9, status: "queued" },
  { title: "Best Gay Asian Sites", slug: "gay-asian-sites", content_type: "bestof", target_keyword: "gay asian porn sites", related_sites: ["peterfever", "gayasiannetwork"], priority: 8, status: "queued" },
  { title: "Best Gay Amateur Sites", slug: "gay-amateur-sites", content_type: "bestof", target_keyword: "gay amateur sites", related_sites: ["next-door-twink", "twinks-in-shorts", "southern-strokes", "breed-me-raw", "bareback-that-hole", "hard-brit-lads", "prideflame"], priority: 9, status: "queued" },
  { title: "Best Gay Premium Studios", slug: "gay-premium-sites", content_type: "bestof", target_keyword: "gay premium porn sites", related_sites: ["helix-studios", "next-door-world", "peterfever", "alternadudes"], priority: 8, status: "queued" },
];

// ---------------------------------------------------------------------------
// 30-day priority backlog (May 6 – Jun 4, 2026)
// Priorities 100→71 — these fire BEFORE existing entries (priority ≤ 9) so
// the order matches the publishing plan exactly. Descending priority = next
// in line. Days listed are guidance only; the script publishes one per run.
// ---------------------------------------------------------------------------
const backlogEntries: SupportingQueueEntry[] = [
  // Days 1-7 — Comparison content (priority 100 → 94)
  { title: "Men.com vs Sean Cody", slug: "compare/men-vs-sean-cody", content_type: "comparison", target_keyword: "men.com vs sean cody", related_sites: ["men", "sean-cody"], priority: 100, status: "published" },
  { title: "NakedSword vs Men.com", slug: "compare/nakedsword-vs-men", content_type: "comparison", target_keyword: "nakedsword vs men.com", related_sites: ["nakedsword", "men"], priority: 99, status: "published" },
  { title: "Helix Studios vs Sean Cody", slug: "compare/helix-studios-vs-sean-cody", content_type: "comparison", target_keyword: "helix studios vs sean cody", related_sites: ["helix-studios", "sean-cody"], priority: 98, status: "published" },
  { title: "Twinks in Shorts vs Athletic Twinks", slug: "compare/twinks-in-shorts-vs-athletic-twinks", content_type: "comparison", target_keyword: "twinks in shorts vs athletic twinks", related_sites: ["twinks-in-shorts", "athletic-twinks"], priority: 97, status: "published" },
  { title: "PeterFever vs GayAsianNetwork", slug: "compare/peterfever-vs-gayasiannetwork", content_type: "comparison", target_keyword: "peterfever vs gayasiannetwork", related_sites: ["peterfever", "gayasiannetwork"], priority: 96, status: "published" },
  { title: "RawHole vs DudesRaw", slug: "compare/rawhole-vs-dudesraw", content_type: "comparison", target_keyword: "rawhole vs dudesraw", related_sites: ["rawhole", "dudesraw"], priority: 95, status: "published" },
  { title: "SayUncle vs FamilyDick", slug: "compare/sayuncle-vs-familydick", content_type: "comparison", target_keyword: "sayuncle vs familydick", related_sites: ["sayuncle", "familydick"], priority: 94, status: "published" },

  // Days 8-14 — Alternatives content (priority 93 → 87).
  // Slug must match the frontend route exactly so getAlternativesBody()
  // resolves correctly: e.g. /helix-studios-alternatives → key
  // "helix-studios-alternatives".
  { title: "Best Alternatives to Helix Studios", slug: "helix-studios-alternatives", content_type: "alternatives", target_keyword: "helix studios alternatives", related_sites: ["helix-studios"], priority: 93, status: "published" },
  { title: "Best Alternatives to Sean Cody", slug: "sean-cody-alternatives", content_type: "alternatives", target_keyword: "sean cody alternatives", related_sites: ["sean-cody"], priority: 92, status: "published" },
  { title: "Best Alternatives to NakedSword", slug: "nakedsword-alternatives", content_type: "alternatives", target_keyword: "nakedsword alternatives", related_sites: ["nakedsword"], priority: 91, status: "published" },
  { title: "Best Alternatives to Men.com", slug: "men-alternatives", content_type: "alternatives", target_keyword: "men.com alternatives", related_sites: ["men"], priority: 90, status: "published" },
  { title: "Best Alternatives to PeterFever", slug: "peterfever-alternatives", content_type: "alternatives", target_keyword: "peterfever alternatives", related_sites: ["peterfever"], priority: 89, status: "published" },
  { title: "Best Alternatives to Twinks in Shorts", slug: "twinks-in-shorts-alternatives", content_type: "alternatives", target_keyword: "twinks in shorts alternatives", related_sites: ["twinks-in-shorts"], priority: 88, status: "published" },
  { title: "Best Alternatives to Southern Strokes", slug: "southern-strokes-alternatives", content_type: "alternatives", target_keyword: "southern strokes alternatives", related_sites: ["southern-strokes"], priority: 87, status: "published" },

  // Days 15-21 — "Is X Worth It" body content (priority 86 → 80).
  // Slug = bare site slug, matching WorthItPage's getWorthItBody(site.slug).
  { title: "Is NakedSword Worth It?", slug: "nakedsword", content_type: "isworthit", target_keyword: "is nakedsword worth it", related_sites: ["nakedsword"], priority: 86, status: "published" },
  { title: "Is Sean Cody Worth It?", slug: "sean-cody", content_type: "isworthit", target_keyword: "is sean cody worth it", related_sites: ["sean-cody"], priority: 85, status: "published" },
  { title: "Is Helix Studios Worth It?", slug: "helix-studios", content_type: "isworthit", target_keyword: "is helix studios worth it", related_sites: ["helix-studios"], priority: 84, status: "published" },
  { title: "Is Men.com Worth It?", slug: "men", content_type: "isworthit", target_keyword: "is men.com worth it", related_sites: ["men"], priority: 83, status: "published" },
  { title: "Is Twinks in Shorts Worth It?", slug: "twinks-in-shorts", content_type: "isworthit", target_keyword: "is twinks in shorts worth it", related_sites: ["twinks-in-shorts"], priority: 82, status: "published" },
  { title: "Is Southern Strokes Worth It?", slug: "southern-strokes", content_type: "isworthit", target_keyword: "is southern strokes worth it", related_sites: ["southern-strokes"], priority: 81, status: "published" },
  { title: "Is PeterFever Worth It?", slug: "peterfever", content_type: "isworthit", target_keyword: "is peterfever worth it", related_sites: ["peterfever"], priority: 80, status: "published" },

  // Days 22-30 — Guides (priority 79 → 71)
  { title: "How To Cancel Gay Porn Site Subscriptions", slug: "guide/how-to-cancel-gay-porn-subscriptions", content_type: "guide", target_keyword: "cancel gay porn subscription", related_sites: TOP_10_SLUGS, priority: 79, status: "published" },
  { title: "Gay Porn Site Billing — What To Expect", slug: "guide/gay-porn-billing-guide", content_type: "guide", target_keyword: "gay porn site billing", related_sites: TOP_10_SLUGS, priority: 78, status: "published" },
  { title: "How To Watch Gay Porn On Mobile (iPhone vs Android)", slug: "guide/watch-gay-porn-on-mobile", content_type: "guide", target_keyword: "how to watch gay porn on iphone", related_sites: TOP_10_SLUGS, priority: 77, status: "published" },
  { title: "How Gay Porn Site Trials Work — Auto-Renewal Explained", slug: "guide/how-gay-porn-trials-work", content_type: "guide", target_keyword: "how do gay porn trials work", related_sites: ["next-door-twink", "next-door-world"], priority: 76, status: "published" },
  { title: "How To Find Gay Porn Site Discounts", slug: "guide/how-to-find-gay-porn-discounts", content_type: "guide", target_keyword: "gay porn discounts", related_sites: TOP_10_SLUGS, priority: 75, status: "queued" },
  { title: "Gay Porn Site Security & Privacy Guide", slug: "guide/gay-porn-security-privacy", content_type: "guide", target_keyword: "gay porn site privacy", related_sites: TOP_10_SLUGS, priority: 74, status: "queued" },
  { title: "Gay Porn Network Sites Explained", slug: "guide/gay-porn-network-sites-explained", content_type: "guide", target_keyword: "gay porn network sites", related_sites: ["next-door-world", "men", "nakedsword", "sayuncle"], priority: 72, status: "queued" },
];

const guideEntries: SupportingQueueEntry[] = [
  { title: "How To Choose A Gay Porn Site", slug: "how-to-choose-gay-porn-site", content_type: "guide", target_keyword: "how to choose gay porn site", related_sites: TOP_10_SLUGS, priority: 7, status: "queued" },
  { title: "Gay Porn Memberships Explained", slug: "gay-porn-memberships-explained", content_type: "guide", target_keyword: "gay porn memberships", related_sites: TOP_10_SLUGS, priority: 6, status: "queued" },
  { title: "How To Cancel A Gay Porn Subscription", slug: "how-to-cancel-gay-porn-subscription", content_type: "guide", target_keyword: "cancel gay porn subscription", related_sites: TOP_10_SLUGS, priority: 6, status: "queued" },
  { title: "Best Gay Porn Sites For Beginners", slug: "best-gay-porn-sites-for-beginners", content_type: "guide", target_keyword: "gay porn sites for beginners", related_sites: ["next-door-world", "next-door-twink", "helix-studios", "twinks-in-shorts"], priority: 7, status: "queued" },
];

const freeTrialEntry: SupportingQueueEntry = {
  title: "Gay Porn Sites With Free Trials",
  slug: "gay-porn-sites-free-trials",
  content_type: "freetrial",
  target_keyword: "gay porn sites free trial",
  related_sites: ["next-door-twink", "next-door-world"],
  priority: 8,
  status: "queued",
};

const awardsEntry: SupportingQueueEntry = {
  title: "Best Gay Porn Sites 2026 — Annual Awards",
  slug: "best-gay-porn-sites-2026",
  content_type: "awards",
  target_keyword: "best gay porn sites 2026",
  related_sites: TOP_10_SLUGS,
  priority: 9,
  status: "queued",
};

export const supportingQueue: SupportingQueueEntry[] = [
  // 30-day backlog fires first (priorities 71-100)
  ...backlogEntries,
  // Existing supporting entries (priorities 5-9) fire after backlog drains
  ...discountEntries,
  ...comparisonEntries,
  ...isWorthItEntries,
  ...alternativesEntries,
  ...pricingEntries,
  ...hubEntries,
  ...guideEntries,
  freeTrialEntry,
  awardsEntry,
];

/**
 * Eligible review pickers. The GSC-driven ranker in
 * src/lib/contentRanker.ts converts these candidates to effective
 * priority before final selection.
 *
 * "archived" entries are always excluded (slug collisions, abandoned
 * sites). "research-only" entries ARE eligible — the ranker applies a
 * no-affiliate penalty, so an affiliated review of equal static
 * priority wins head-to-head, but a high-demand research-only review
 * can still surface above a low-demand ready review.
 */
export function reviewCandidates(): ReviewQueueEntry[] {
  return reviewQueue.filter(
    (r) => r.status === "queued" && r.editorial_mode !== "archived",
  );
}

export function supportingCandidates(type?: SupportingContentType): SupportingQueueEntry[] {
  return supportingQueue.filter(
    (s) => s.status === "queued" && (!type || s.content_type === type),
  );
}

/**
 * Static-priority shortlist (kept for back-compat and as a fallback
 * when GSC data isn't available). For demand-driven picking use
 * pickHighestEffectivePriority() in src/lib/contentRanker.ts.
 */
export function nextReviewToPublish(): ReviewQueueEntry | undefined {
  // Affiliate-ready entries still preferred in the static fallback —
  // matches the prior behavior. The dynamic ranker is the new default
  // path; this stays as a last-resort cron pick if GSC is unreachable.
  const candidates = reviewCandidates();
  const ready = candidates.filter((r) => r.affiliate_url !== null);
  const pool = ready.length > 0 ? ready : candidates;
  return [...pool].sort((a, b) => b.priority - a.priority)[0];
}

export function nextSupporting(type?: SupportingContentType): SupportingQueueEntry | undefined {
  return [...supportingCandidates(type)].sort((a, b) => b.priority - a.priority)[0];
}
