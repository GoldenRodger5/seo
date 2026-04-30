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
    status: "queued",
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
    status: "queued",
    content_type: "review",
  },
  {
    name: "Bromo",
    slug: "bromo",
    homepage_url: "https://www.bromo.com",
    affiliate_url: null,
    affiliate_network: "AdultForce",
    niche: ["premium-studios", "hd-quality"],
    priority: 9,
    estimated_monthly_searches: 60500,
    status: "queued",
    content_type: "review",
  },

  // ── Buddy Profits (pending) ─────────────────────────────────────────────
  {
    name: "Falcon Studios",
    slug: "falcon-studios",
    homepage_url: "https://www.falconstudios.com",
    affiliate_url: null,
    affiliate_network: "Buddy Profits",
    niche: ["premium-studios", "hd-quality"],
    priority: 9,
    estimated_monthly_searches: 49500,
    status: "queued",
    content_type: "review",
  },
  {
    name: "Icon Male",
    slug: "icon-male",
    homepage_url: "https://www.iconmale.com",
    affiliate_url: null,
    affiliate_network: "Buddy Profits",
    niche: ["premium-studios"],
    priority: 7,
    estimated_monthly_searches: 18100,
    status: "queued",
    content_type: "review",
  },
  {
    name: "Active Duty",
    slug: "active-duty",
    homepage_url: "https://www.activeduty.com",
    affiliate_url: null,
    affiliate_network: "Buddy Profits",
    niche: ["premium-studios", "amateur-twinks"],
    priority: 8,
    estimated_monthly_searches: 33100,
    status: "queued",
    content_type: "review",
  },

  // ── Pending approval / unresolved network ───────────────────────────────
  { name: "Naked Sword", slug: "naked-sword", homepage_url: "https://www.nakedsword.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 8, estimated_monthly_searches: 40500, status: "queued", content_type: "review" },
  { name: "Corbin Fisher", slug: "corbin-fisher", homepage_url: "https://www.corbinfisher.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "amateur-twinks"], priority: 8, estimated_monthly_searches: 40500, status: "queued", content_type: "review" },
  { name: "Bel Ami Online", slug: "bel-ami-online", homepage_url: "https://www.belamionline.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "amateur-twinks", "hd-quality"], priority: 9, estimated_monthly_searches: 49500, status: "queued", content_type: "review" },
  { name: "Lucas Entertainment", slug: "lucas-entertainment", homepage_url: "https://www.lucasentertainment.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 7, estimated_monthly_searches: 22200, status: "queued", content_type: "review" },
  { name: "Randy Blue", slug: "randy-blue", homepage_url: "https://www.randyblue.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 6, estimated_monthly_searches: 14800, status: "queued", content_type: "review" },
  { name: "CockyBoys", slug: "cockyboys", homepage_url: "https://www.cockyboys.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 8, estimated_monthly_searches: 33100, status: "queued", content_type: "review" },
  { name: "Czech Hunter", slug: "czech-hunter", homepage_url: "https://www.czechhunter.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 8, estimated_monthly_searches: 60500, status: "queued", content_type: "review" },
  { name: "Badpuppy", slug: "badpuppy", homepage_url: "https://www.badpuppy.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 5, estimated_monthly_searches: 8100, status: "queued", content_type: "review" },
  { name: "Hammer Boys", slug: "hammer-boys", homepage_url: "https://www.hammerboys.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 5, estimated_monthly_searches: 6600, status: "queued", content_type: "review" },
  { name: "BoyFun", slug: "boyfun", homepage_url: "https://www.boyfun.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 6, estimated_monthly_searches: 9900, status: "queued", content_type: "review" },
  { name: "Staxus", slug: "staxus", homepage_url: "https://www.staxus.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "hd-quality"], priority: 7, estimated_monthly_searches: 18100, status: "queued", content_type: "review" },
  { name: "Eurocreme", slug: "eurocreme", homepage_url: "https://www.eurocreme.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 6, estimated_monthly_searches: 12100, status: "queued", content_type: "review" },
  { name: "William Higgins", slug: "william-higgins", homepage_url: "https://www.williamhiggins.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 7, estimated_monthly_searches: 18100, status: "queued", content_type: "review" },
  { name: "Str8Hell", slug: "str8hell", homepage_url: "https://www.str8hell.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 5, estimated_monthly_searches: 8100, status: "queued", content_type: "review" },
  { name: "Next Door Studios", slug: "next-door-studios", homepage_url: "https://www.nextdoorstudios.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 8, estimated_monthly_searches: 27100, status: "queued", content_type: "review" },
  { name: "Maskurbate", slug: "maskurbate", homepage_url: "https://www.maskurbate.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 5, estimated_monthly_searches: 6600, status: "queued", content_type: "review" },
  { name: "TimTales", slug: "timtales", homepage_url: "https://www.timtales.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 6, estimated_monthly_searches: 12100, status: "queued", content_type: "review" },
  { name: "Freshmen", slug: "freshmen", homepage_url: "https://www.freshmen.net", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "hd-quality"], priority: 7, estimated_monthly_searches: 22200, status: "queued", content_type: "review" },
  { name: "CollegeDudes", slug: "college-dudes", homepage_url: "https://www.collegedudes.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 6, estimated_monthly_searches: 9900, status: "queued", content_type: "review" },
  { name: "GayRoom", slug: "gay-room", homepage_url: "https://www.gayroom.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 6, estimated_monthly_searches: 14800, status: "queued", content_type: "review" },
  { name: "MenOver30", slug: "men-over-30", homepage_url: "https://www.menover30.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 6, estimated_monthly_searches: 9900, status: "queued", content_type: "review" },
  { name: "DadCreep", slug: "dad-creep", homepage_url: "https://www.dadcreep.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 5, estimated_monthly_searches: 6600, status: "queued", content_type: "review" },
  { name: "SpunkWorthy", slug: "spunkworthy", homepage_url: "https://www.spunkworthy.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 6, estimated_monthly_searches: 9900, status: "queued", content_type: "review" },
  { name: "ChaosMen", slug: "chaos-men", homepage_url: "https://www.chaosmen.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "premium-studios"], priority: 7, estimated_monthly_searches: 18100, status: "queued", content_type: "review" },
  { name: "SexuallyBroken", slug: "sexually-broken", homepage_url: "https://www.sexuallybroken.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios"], priority: 4, estimated_monthly_searches: 4400, status: "queued", content_type: "review" },
  { name: "TwinkPop", slug: "twinkpop", homepage_url: "https://www.twinkpop.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks", "hd-quality"], priority: 7, estimated_monthly_searches: 18100, status: "queued", content_type: "review" },
  { name: "BoyNapped", slug: "boy-napped", homepage_url: "https://www.boynapped.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 5, estimated_monthly_searches: 6600, status: "queued", content_type: "review" },
  { name: "English Lads", slug: "english-lads", homepage_url: "https://www.englishlads.com", affiliate_url: null, affiliate_network: null, niche: ["amateur-twinks"], priority: 6, estimated_monthly_searches: 9900, status: "queued", content_type: "review" },
  { name: "Bel Ami", slug: "bel-ami", homepage_url: "https://www.belami.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "amateur-twinks"], priority: 8, estimated_monthly_searches: 33100, status: "queued", content_type: "review" },
  { name: "Kristen Bjorn", slug: "kristen-bjorn", homepage_url: "https://www.kristenbjorn.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 6, estimated_monthly_searches: 9900, status: "queued", content_type: "review" },
  { name: "Raging Stallion", slug: "raging-stallion", homepage_url: "https://www.ragingstallion.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 7, estimated_monthly_searches: 22200, status: "queued", content_type: "review" },
  { name: "Hot House", slug: "hot-house", homepage_url: "https://www.hothouse.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 6, estimated_monthly_searches: 14800, status: "queued", content_type: "review" },
  { name: "Falcon Edge", slug: "falcon-edge", homepage_url: "https://www.falconedge.com", affiliate_url: null, affiliate_network: null, niche: ["premium-studios", "hd-quality"], priority: 6, estimated_monthly_searches: 8100, status: "queued", content_type: "review" },
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

const hubEntries: SupportingQueueEntry[] = [
  { title: "Best Gay Twink Sites", slug: "gay-twink-sites", content_type: "hub", target_keyword: "gay twink sites", related_sites: ["helix-studios", "next-door-twink", "twinks-in-shorts", "athletic-twinks", "southern-strokes", "daddy-on-twink", "touch-that-boy", "twinkpop"], priority: 9, status: "queued" },
  { title: "Best Gay Bareback Sites", slug: "gay-bareback-sites", content_type: "hub", target_keyword: "gay bareback sites", related_sites: ["rawhole", "dudesraw", "bareback-that-hole", "breed-me-raw"], priority: 9, status: "queued" },
  { title: "Best Gay Asian Sites", slug: "gay-asian-sites", content_type: "hub", target_keyword: "gay asian porn sites", related_sites: ["peterfever", "gayasiannetwork"], priority: 8, status: "queued" },
  { title: "Best Gay Amateur Sites", slug: "gay-amateur-sites", content_type: "hub", target_keyword: "gay amateur sites", related_sites: ["next-door-twink", "twinks-in-shorts", "southern-strokes", "breed-me-raw", "bareback-that-hole", "hard-brit-lads", "prideflame"], priority: 9, status: "queued" },
  { title: "Best Gay Premium Studios", slug: "gay-premium-sites", content_type: "hub", target_keyword: "gay premium porn sites", related_sites: ["helix-studios", "next-door-world", "peterfever", "alternadudes"], priority: 8, status: "queued" },
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

export function nextReviewToPublish(): ReviewQueueEntry | undefined {
  return reviewQueue
    .filter((r) => r.status === "queued" && r.affiliate_url !== null)
    .sort((a, b) => b.priority - a.priority)[0];
}

export function nextSupporting(type?: SupportingContentType): SupportingQueueEntry | undefined {
  return supportingQueue
    .filter((s) => s.status === "queued" && (!type || s.content_type === type))
    .sort((a, b) => b.priority - a.priority)[0];
}
