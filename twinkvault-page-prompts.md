# TwinkVault Page Refinement — Complete Prompt Set

A single document containing every Claude Code prompt for the editorial refinement sprint across TwinkVault. Each prompt is self-contained and can be pasted directly into Claude Code.

**Recommended ship order:**
1. Homepage (✓ SHIPPED — commit `e3af548`)
2. /reviews index (✓ SHIPPED — commit `bfc8c6d`)
3. /methodology (✓ SHIPPED — commit `94a2c59`)
4. Prompt A — /best-deals affiliated-only filter (ship before /best-deals refinement)
5. Prompt B — Featured compare pair cleanup
6. /reviews/{slug} — individual review template
7. /best-deals — two-tier layout
8. /compare — index + individual compare pages
9. /ask-ai
10. Blog — index + post template

---

## SHIPPED PROMPTS (for reference only — do not re-run)

These have already been shipped. Included here for completeness and so future-Isaac can audit what was done.

### Prompt 1 — Homepage restructure (SHIPPED commit `e3af548`)

```
TASK: Restructure src/pages/Index.tsx (homepage) to an editorial-first layout.

PHILOSOPHY (read first, internalize before writing code):
The current homepage reads as AI-generated affiliate spam. The fix is fewer sections, stronger editorial voice, and first-person framing that matches the methodology page. No emoji icons, no year-in-title, no question-form headers, no "Today's Top Pick" framing. The voice should match src/pages/Methodology.tsx (first-person, specific, no marketing fluff). Read that file before writing the new homepage to internalize the tone.

CONSTRAINTS:
- Do NOT change src/data/sites.ts, the ranking logic in src/lib/compareRanking.ts, or the affiliated/unaffiliated detection.
- Do NOT change the Top Pick selection formula in getTopDealPick() — but the SECTION that displays it is being renamed and reframed.
- Keep all existing tracking (cta_position, source_type) wired correctly for the new CTAs.
- Keep all existing components (OutboundLink, DualCTAButtons, etc.) and reuse them — do not create parallel components.

SECTIONS TO REMOVE FROM THE HOMEPAGE:
1. "Skip the Reading. Here's What You Actually Want." (the 3 mood cards section). Delete entirely from homepage.
2. "Popular Comparisons" 6-card section. Remove from homepage.
3. "More Lists" 6-card section. Remove from homepage.
4. "The Ones Worth Your Money" 5-card section if it still exists.
5. The current trust strip with emoji icons (star/refresh/trophy/lock). Remove.

NEW HOMEPAGE SECTION ORDER (top to bottom):

1. ANNOUNCEMENT BAR (keep as-is).
2. NAVIGATION (keep as-is).

3. HERO (rewrite completely):
   - Site wordmark "TwinkVault"
   - H1: "Independent reviews of 62 gay porn sites."
   - Subhead: "Every review is built from a paid membership and scored on the same four-pillar rubric. Updated monthly. No paid placements, ever."
   - Two text links: "See how we score →" /methodology and "Browse all 62 sites →" /reviews
   - NO hero card with a specific site recommendation
   - NO emoji trust strip
   - Generous vertical padding

4. EDITOR'S PICK (renamed from "Today's Top Pick"):
   - Eyebrow: "May 2026 Editor's Pick" (dynamic month/year via existing helper)
   - H2: site name with score chip inline
   - Editor's note paragraph: 60-80 words, first-person, specific
   - Mark with comment "// EDITOR_NOTE: rewrite manually each month"
   - Two CTAs: "Read full review →" and "Visit [SiteName] →"
   - Selection logic: keep getTopDealPick()
   - cta_position='editor-pick', source_type='homepage_editor_pick'

5. THE TOP 10 LIST:
   - H2: "The Top 10"
   - Subhead: "Ranked by overall score, updated monthly."
   - Render as a list (not cards). 10 rows: Rank · Name · Score · Price · Tag · [Read] [Visit]
   - Affiliated sites get both buttons; unaffiliated get only "Read"
   - cta_position='top-10-row', source_type='homepage_top_10'
   - Thin row dividers, NO card containers
   - Below the list: "See all 62 sites →" link

6. BROWSE BY NICHE:
   - H2: "Browse by niche"
   - 3 featured niche cards (Twink, Bareback, Amateur) with editorial intros
   - Below: inline text row "More: Daddy · Bear · Asian · College · Muscle · Jock"

7. LATEST REVIEWS:
   - H2: "Latest reviews"
   - 3-card grid (keep current)
   - "All reviews →" link

8. UTILITY ROW (compressed):
   - Single horizontal row
   - "Ask TwinkAI" + "Take the 30-second quiz" inline buttons
   - "Not sure what you want?" intro

9. MANFINDER CROSS-PROMO (compressed):
   - One-line: "Looking for connections instead of content? [Try Manfinder →]"

10. NEWSLETTER + FOOTER (keep as-is).

VOICE RULES:
- First-person singular ("I tested," "I subscribed") not "we"
- No "2026" in any H1 or H2 except where SEO-critical
- No question-form headers
- No emoji icons in section headers
- No words: "actually," "really," "literally," "definitely"
- Section headers are statement-form, short, declarative

DELIVERABLES:
- Modified src/pages/Index.tsx
- Helper utilities in src/lib/ with clear filenames if needed
- Inline comments marking hand-curated strings
- No new components unless absolutely necessary
```

### Prompt 2 — /reviews index refinement (SHIPPED commit `bfc8c6d`)

```
TASK: Refine src/pages/ReviewsIndex.tsx (the /reviews page) — index of all 62 site reviews.

PHILOSOPHY:
This is the second-strongest page on the site after Methodology. The fixes are tightening copy to remove AI-slop language, removing decorative filters that don't actually filter, refining card density, and adding a small Editor's Recommendations strip at the top.

DO NOT do a full redesign. Targeted refinement only.

CHANGES:

1. PAGE HEADER:
   - H1: "Twink Site Reviews" → "All reviews"
   - New subhead: "{N} reviews. Every site tested with a paid membership. Same rubric, every time. Last updated {currentMonthYear}."
   - Remove standalone "Updated May 2026" badge

2. NEW SECTION — EDITOR'S RECOMMENDATIONS (between header and filter row):
   - Eyebrow: "Editor's recommendations"
   - 3 cards in a row, hand-curated:
     • NakedSword — "Start here if you want premium production quality and the largest scene library at the best annual rate."
     • Sean Cody — "The all-American athletic casting we keep returning to, especially at 75% off."
     • Next Door World — "The deepest network catalog. One subscription, 45+ channels. Best value if you want variety."
   - Each card: site name (link), score chip, editorial line, "Read review →"
   - NO Visit Site button in this section
   - Comment: // EDITOR_RECOMMENDATIONS: rewrite manually each month

3. FILTER PILLS:
   - REMOVE: "HD Quality", "Mobile Friendly"
   - KEEP: All, Amateur Twinks, Premium Studios, Best Value, Free Trials
   - Best Value becomes derived filter: price_annual ≤ $10/mo AND score ≥ 4.0
   - Free Trials: verify data, add TODO comment if data is inconsistent

4. CARD DENSITY:
   - One niche tag pill (not 3-4)
   - One-sentence description (max 15 words; add TODO if longer)
   - Green checkmark inline with site name (replaces "Reviewed" pill)
   - Deal badge only if deal_discount > 0
   - Two buttons: Read Review (always) + Visit Site (only if affiliated)
   - cta_position='reviews-grid-card', source_type='reviews_index_card'

5. FOOTER HINT:
   - Below grid: "Missing a site? It's because I haven't tested it yet. [How I pick what to test →]"
   - Small muted text, NOT a CTA, links to /methodology

VOICE: Never "honest", never "in one place", first-person in editorial notes, third-person in card descriptions.
```

### Prompt 3 — /methodology additions (SHIPPED commit `94a2c59`)

```
TASK: Minor additions to src/pages/Methodology.tsx. The strongest page on the site. Do NOT rewrite existing content.

CHANGES:

1. SUBHEAD: Use dynamic site count and month/year (already template-driven).

2. NEW PARAGRAPH after intro callout box:
"Not every review is built the same way. Sites I've subscribed to and tested across at least two billing cycles carry a 'Tested from a paid subscription' badge. Others are built from publisher materials, scene samples, and user reports — those carry a 'Researched' badge. Both go through the same scoring rubric, but the depth differs. I'm working through the catalog and converting research-based reviews to subscription-based ones as time and budget allow."

3. REFINE "How the overall score is calculated":
"Each pillar is scored 0–10, then multiplied by its weight (Content Quality 35%, Value for Money 25%, Site Design 20%, Update Frequency 20%). The four weighted scores are summed to produce a 0–10 overall score, which is converted to a 5-star display by multiplying by 0.5. Pillar scores shown on review pages are rounded to the nearest 5 for visual clarity — the underlying calculations use the precise scores."

4. NEW SECTION "Who writes these reviews":
"TwinkVault is written and operated by Isaac, an independent reviewer based in the US. No team, no co-writers — every review on this site is the result of one person's time and a paid subscription. Reach me at isaac.m.builds@gmail.com if you spot something I got wrong, want to suggest a site, or work in the industry and want to share context I should know."

5. NEW SECTION "Edge cases":
Intro: "A few things that come up often:"
- Network sites scored at network level
- Pricing changes noted with date
- Free press subscriptions disclosed
- Site relaunches treated as new reviews

6. NEW SECTION "Changes to this methodology":
Intro: "The rubric is stable but not frozen. Material changes are noted here with the date."
- May 2026: Clarified subscription-tested vs research-based distinction. Added pillar-score rounding (nearest 5).

VOICE: Match existing first-person declarative tone exactly.
```

---

## ACTIVE PROMPTS (ship in this order)

### Prompt A — /best-deals affiliated-only filter (SHIP FIRST)

This is a small precursor that the /best-deals refinement depends on.

```
TASK: Add isAffiliated() filter to /best-deals page so unaffiliated sites no longer appear.

PHILOSOPHY:
A deals page should be 100% monetizable surface. Sites without affiliate URLs (currently Helix Studios, Next Door Twink, Next Door World) appear on /best-deals because they have deal_discount > 0, but their CTAs go nowhere monetizable. They should be filtered off the page.

CONSTRAINTS:
- Do NOT modify the underlying site data in sites.ts
- Do NOT change badge logic or hero pick formula
- Once NDT and NDW are approved by Gamma Buddy Profits and get affiliate URLs, they reappear on /best-deals automatically
- Once Helix Studios gets an AdultEmpireCash tracking URL, it reappears automatically

CHANGES:
1. Locate the data source that feeds /best-deals (BestDeals.tsx). The current filter is `deal_discount > 0`.
2. Add an AND condition: `isAffiliated(site) === true`.
3. Use the existing isAffiliated() helper from src/lib/affiliateHelpers.ts (or wherever it currently lives).
4. The combined filter becomes: `site.deal_discount > 0 && isAffiliated(site)`.

VERIFY:
- Helix Studios, Next Door Twink, Next Door World no longer appear on /best-deals after the change
- All currently-affiliated sites with active deals still appear
- The page count in the subhead ("X active deals") reflects the post-filter count
- No other pages are affected (this filter applies only to /best-deals)

DELIVERABLES:
- Modified src/pages/BestDeals.tsx (or its data hook if extracted)
- No new components, no schema changes
- Run npm run dev and verify the filter works
```

### Prompt B — Featured compare pair cleanup

Small cleanup that improves /compare quality before the larger compare refinement.

```
TASK: Remove three all-unaffiliated featured comparison pairs from src/data/featured-compare-pairs.ts, then regenerate the sitemap.

PHILOSOPHY:
Featured compare pages with two unaffiliated sites have CTAs that go nowhere monetizable. They should not be featured. The reviews themselves stay; only the "featured pair" designation is removed.

CHANGES:
1. Locate src/data/featured-compare-pairs.ts.
2. Remove these three pairs:
   - helix-studios vs next-door-twink
   - helix-studios vs next-door-world
   - next-door-twink vs next-door-world
3. Mixed pairs (one affiliated + one unaffiliated) STAY in the featured list because at least one side has a working Visit Site CTA.
4. After editing the file, run scripts/generate-sitemap.ts to regenerate the sitemap so the removed pairs are no longer in the sitemap as featured routes (they remain crawlable via /compare/{a}-vs-{b} URLs but aren't promoted).
5. Verify the build still succeeds.

VERIFY:
- featured-compare-pairs.ts is now 188 entries (was 191)
- Sitemap regenerated without errors
- The /compare index page no longer shows the 3 removed pairs as featured cards
- All other featured pairs render correctly

DELIVERABLES:
- Modified src/data/featured-compare-pairs.ts
- Regenerated sitemap
- No other changes
```

### Prompt 4 — /reviews/{slug} individual review template

This is the most important page on the site. 62 instances. Each improvement compounds 62x.

```
TASK: Refine src/pages/ReviewPage.tsx (and sub-components) — the individual review page template.

PHILOSOPHY:
The review page is the conversion workhorse. The current template has four problems that read as AI-generated affiliate spam:
1. Too many redundant CTAs (four in body + sticky sidebar = five)
2. Methodology contradiction (methodology page claims paid-subscription testing; review disclosure says "publicly available information")
3. AI-slop body copy voice ("carves out a specific niche," "is solid," score-as-prose)
4. Fake-precision scores (84/100 implies measurement accuracy that doesn't exist)

This sprint fixes problems 1, 2, and 4. Problem 3 requires per-review editorial work — the sprint sets up the structure so Isaac can grind through it later.

DO NOT do a full redesign. Targeted refinement only.

CONSTRAINTS:
- Do NOT change the sticky sidebar (it converts; leave it alone)
- Do NOT change the Score Breakdown component structure
- Do NOT change Pros/Cons component
- Do NOT change Niches pills, Compare With dropdown, breadcrumbs
- Do NOT modify src/data/sites.ts except to ADD new optional fields
- Do NOT change /reviews, /best-deals, /compare, /, /methodology, /ask-ai
- Keep all existing tracking

CHANGES IN ORDER:

1. CTA REDUCTION:
   Audit ReviewPage.tsx and identify each InlineReviewCTA (or equivalent) instance in body content. KEEP only TWO:
   - INSTANCE 1: Immediately after the Verdict callout box near the top
   - INSTANCE 2: Immediately after the Pricing Table section
   
   REMOVE the other in-body CTAs. Sticky sidebar still provides always-visible CTA on desktop.
   
   Removed CTAs: ensure source_type='mid_review_cta' stops emitting for those positions. Existing analytics data in Supabase stays.

2. VERDICT DEDUPLICATION:
   Currently verdict appears in three places. Restructure:
   - TOP CALLOUT BOX: becomes TL;DR — site name, score, and ONE 12-20 word sentence. Not the full verdict.
   - MID-PAGE "[Site] scores X/5 overall" CTA banner: REMOVE entirely.
   - BOTTOM "Our Verdict" section: KEEP as the full verdict (only place full verdict appears).
   
   TL;DR derived from new optional field in sites.ts: `tldr?: string`. Fall back to short_description if absent.
   Add comment: `// TODO: write per-site tldr field in sites.ts (12-20 words)`

3. SCORE PRECISION SMOOTHING:
   Round all pillar scores to nearest 5 at DISPLAY time only.
   - Underlying data in sites.ts stays precise
   - 84 displays as 85, 78 displays as 80
   
   Add utility src/lib/scoreFormatting.ts:
   ```
   export function displayPillarScore(raw: number): number { 
     return Math.round(raw / 5) * 5; 
   }
   ```
   
   Use everywhere pillar scores are rendered.
   
   Below the Score Breakdown component, add footnote (text-xs, muted): "Scores reflect editorial assessment, not absolute measurement. See methodology."
   
   Overall score (4.3/5, 4.6/5) keeps decimal precision — only pillar scores get smoothed.

4. METHODOLOGY DISCLOSURE HONESTY:
   Current disclosure: "✓ Editorially Reviewed — This review is based on publicly available information..."
   Contradicts methodology.tsx which claims paid-subscription testing.
   
   Fix:
   
   a) Add OPTIONAL field to Site type in src/data/sites.ts:
      `review_depth?: 'subscription' | 'research';`
      Default if absent: treat as 'research'.
      
      Comment near the type:
      ```
      // review_depth: 'subscription' = Isaac paid for and tested this site
      // 'research' or undefined = built from publicly available info
      // Manually flag as 'subscription' as Isaac confirms which ones he's paid for
      ```
      
      DO NOT bulk-populate. Only add the field to the type.
   
   b) Disclosure banner becomes conditional:
      - review_depth === 'subscription': "✓ Tested from a paid subscription. Reviewed {N} billing cycles. Last updated {month year}." (N defaults to 2)
      - review_depth === 'research' or undefined: "✓ Researched from publisher materials, scene samples, and user reports. Last updated {month year}."
      
      Same visual treatment, conditional language.

5. PRICING TABLE REFINEMENT:
   Current: list of Monthly/Quarterly/Annual rows.
   Refine to:
   - Same three rows, same data
   - "Best Plan" badge inline next to cheapest per-month row (usually Annual). Small green pill.
   - Sentence below table: "Annual works out to ${annualPrice * 12} per year — ${(monthlyPrice * 12) - (annualPrice * 12)} less than paying monthly." Computed dynamically.
   - If deal_discount > 0: "Current deal: {dealDiscount}% off applies to the annual plan."
   - If cancellation_notes exists: render as third sentence.

6. BODY COPY TODO MARKING (no rewrites):
   DO NOT rewrite existing body copy. Add ONE inline HTML comment at the START of each major content section (Content Quality, Site Design, Pricing & Value, Our Verdict):
   `{/* TODO_VOICE: rewrite this section in first-person methodology voice. Ban words: "actually," "really," "literally," "definitely," "is solid," "carves out," "specific niche." Restate WHY scores are what they are; do not restate the score number itself. */}`

7. PROS/CONS ASYMMETRY:
   Verify component supports variable-length arrays (6 pros / 2 cons; 3 pros / 5 cons). Fix if it forces symmetry. Otherwise just verify.

8. "BEST FOR" LINE:
   Add to Site type: `best_for_specific?: string;`
   If present, use it. If absent, fall back to existing logic.
   TODO in sites.ts: "write best_for_specific for each site (15-25 words, name the use case)"

DELIVERABLES:
- Modified src/pages/ReviewPage.tsx
- Modified src/pages/Methodology.tsx (already shipped — but verify the review_depth paragraph from Prompt 3 is in place)
- New utility src/lib/scoreFormatting.ts
- Updated Site type in src/data/sites.ts (NEW optional fields: review_depth, tldr, best_for_specific, cancellation_notes — type only, no broad population)
- Conditional disclosure banner: extract to src/components/ReviewDisclosureBanner.tsx if currently inline
- Inline TODO_VOICE comments at the start of each prose section

TESTING:
- Build and verify all 62 review pages render successfully
- Verify pillar scores display rounded to nearest 5
- Verify disclosure banner shows 'research' variant on all sites (since review_depth is unpopulated)
- Verify only 2 in-body CTAs render (post-verdict, post-pricing)
- Verify TL;DR callout is 12-20 words
- Verify all 62 routes prerender successfully

DO NOT:
- Rewrite existing AI-generated body copy
- Add new components beyond ReviewDisclosureBanner
- Change sticky sidebar
- Modify other pages
- Change SEO meta tags / schema markup
- Add new dependencies
```

### Prompt 5 — /best-deals two-tier layout

Ship Prompt A first. This refinement assumes affiliated-only filter is live.

```
TASK: Refine src/pages/BestDeals.tsx into a two-tier layout — hero deals on top, compact list below.

PREREQUISITE: Prompt A (affiliated-only filter) must be shipped. By end of this sprint, no unaffiliated sites appear on the page.

PHILOSOPHY:
A deals page is structurally hard to make non-spammy. The fix: (1) replace trust-claim badges with verification dates, (2) restructure for two visitor types — fast deal-hunters (hero cards, price-first) and comparison shoppers (compact list, scan many options).

CONSTRAINTS:
- Do NOT change the DealCard component if used elsewhere — create HeroDealCard variant
- Do NOT change badge logic (Editor's Pick / Biggest Savings / Most Popular)
- Do NOT change /reviews, /reviews/{slug}, /methodology, /compare, /, /ask-ai
- No urgency language ("limited time," "ending soon," "act now")

CHANGES IN ORDER:

1. PAGE HEADER:
   - H1: "Active gay porn deals, {Month} {Year}" (using existing currentMonthLong/currentYear)
   - Subhead: "Checked {currentMonthLong} {currentYear}. {N} active deals on tested sites. Codes apply automatically through the visit link — no manual entry needed."
   - One line below: "Sorted by editorial pick first, then by discount size."

2. NEW SECTION — "Featured deals" (hero tier):
   - Eyebrow: "Featured deals"
   - 3 large cards (sm:grid-cols-3). These are the cards bearing Editor's Pick / Biggest Savings / Most Popular badges.
   - Each hero card layout (top to bottom):
     a. Badge name as eyebrow text (small caps)
     b. Discount in LARGE display type ("−67% OFF")
     c. Site name (H3, smaller than discount)
     d. Price: "{discounted}/mo · was {original}/mo" (original strikethrough)
     e. Metadata row: "Score: {score} · {category_tag}"
     f. CTA: "Visit {SiteName} →" with cta_position='best-deals-hero', source_type='best_deals_hero_card'
     g. Verification date (small, muted), conditional:
        - Within 14 days: "Verified {Month Day}"
        - 15-30 days: "Verified {Month Day} — may have changed"
        - Older than 30 days OR missing: omit line entirely
   - Use new component src/components/HeroDealCard.tsx. Do NOT modify existing DealCard.

3. NEW SECTION — "All active deals" (compact list tier):
   - Eyebrow: "All active deals"
   - Render as rows (not card grid). Match homepage Top 10 pattern.
   - Each row, left to right (desktop):
     • Discount badge: "−{N}%" (bold, distinct)
     • Site name (link to /reviews/{slug})
     • Discounted price: "${X}/mo"
     • Score (small)
     • Category tag (small pill)
     • Verification date (right-aligned, muted)
     • CTA: "Visit Site →" with cta_position='best-deals-list-row', source_type='best_deals_list_row'
   - Mobile: row becomes 2 lines (discount + name + price on line 1; score + tag + verification + CTA on line 2)
   - Sort by discount_size descending
   - EXCLUDE 3 sites already in hero section (no duplicates)
   - Thin row dividers, no card containers

4. SCHEMA ADDITION:
   Add to Site type in src/data/sites.ts:
   `deal_last_verified?: string;  // ISO date YYYY-MM-DD`
   
   Comment:
   ```
   // deal_last_verified: ISO date when Isaac last manually confirmed the deal is live.
   // Within 14 days: shown as "Verified MMM DD"
   // 15-30 days: shown with "may have changed" caveat
   // Older than 30 days or missing: not shown
   // Update monthly: visit each deal link, confirm price, update date
   ```
   
   DO NOT auto-populate. Field stays undefined until Isaac manually verifies.

5. REMOVE "Verified deal" PILL:
   Find all instances of "✓ Verified deal" pill. Remove entirely. Trust now communicated via verification date in #4.

6. FOOTER HINT:
   Below list: "Don't see a deal? Some sites don't run regular promotions — the full review pages always list current pricing. [Browse all reviews →]"
   Small text, muted, NOT a CTA button.

7. REMOVE redundant CTAs:
   Audit page for "Sound like a deal?" or "Ready to save?" banner CTAs. Remove them. Hero cards and list rows already have per-item CTAs.

VOICE RULES:
- Never "verified" without a date
- No "best" in body copy (route is enough)
- No urgency language
- Discount % is visual headline; site name is secondary
- Verification dates: "Verified May 14"

DELIVERABLES:
- Modified src/pages/BestDeals.tsx
- New component src/components/HeroDealCard.tsx
- Updated Site type in src/data/sites.ts (new optional field, no broad population)
- New utility src/lib/dealVerification.ts:
  ```
  export function getVerificationDisplay(isoDate?: string): { 
    show: boolean; 
    text: string; 
    caveat: boolean 
  }
  ```

TESTING:
- Build and verify renders successfully
- No unaffiliated sites appear (Helix, NDT, NDW excluded)
- Hero section shows exactly 3 cards (Editor's Pick / Biggest Savings / Most Popular)
- List section shows remaining affiliated deals, sorted by discount desc
- 3 hero deals NOT duplicated in list
- No "Verified deal" pill anywhere
- Verification date line HIDDEN when deal_last_verified undefined
- All CTAs have correct cta_position and source_type
- Mobile: list rows wrap to 2 lines; hero cards stack vertically

DO NOT:
- Modify other pages
- Add urgency language
- Populate deal_last_verified for any site this sprint
- Add carousels or countdown timers
```

### Prompt 6 — /compare index and individual compare pages

The /compare architecture is the largest area of the site by page count (188 featured comparisons after Prompt B). Treat carefully.

```
TASK: Refine /compare index (src/pages/CompareIndex.tsx or equivalent) AND individual /compare/{a}-vs-{b} pages (src/pages/ComparePage.tsx).

PHILOSOPHY:
Compare pages are decision-aid content — visitors arrive at "Helix vs NakedSword" because they're between two options. The page must help them decide, not push one side artificially. The current template is functional but has the same AI-slop voice and over-CTA'd structure as review pages. This sprint applies the same editorial refinement.

DO NOT do a full redesign. Targeted refinement.

CONSTRAINTS:
- Do NOT change comparison logic in src/lib/compareRanking.ts
- Do NOT change the dual-CTA fallback logic (Sprint 13 handled affiliated-vs-unaffiliated rendering)
- Do NOT change /reviews, /reviews/{slug}, /methodology, /best-deals, /, /ask-ai
- Keep featured pair handling intact (post Prompt B, this is 188 pairs)

CHANGES IN ORDER:

PART 1: /compare INDEX PAGE

1. PAGE HEADER:
   - H1: "Compare gay porn sites side by side"
   - Subhead: "{N} head-to-head comparisons. Same rubric, same scoring, just two sites at a time."
   - {N} computed dynamically from featured-compare-pairs.ts length

2. INTRO SECTION (new, small):
   - Below header, one paragraph:
   "Most comparisons here exist because they're the questions readers actually ask — Helix vs Sean Cody, NakedSword vs Men.com, Twink networks vs Premium studios. Each comparison page shows both sites against the same four pillars and ends with a recommendation for who should pick which."

3. POPULAR COMPARISONS SECTION (existing if present, refine):
   - Eyebrow: "Most-asked comparisons"
   - Grid of 6-9 featured pair cards
   - Each card: "{SiteA} vs {SiteB}" + 1-sentence editorial framing + "See full comparison →"
   - Hand-curate 6-9 high-traffic pairs; mark with comment

4. ALL COMPARISONS SECTION:
   - Eyebrow: "All comparisons"
   - Either a searchable/filterable grid OR a compact list of all 188 pairs
   - Default: compact list, alphabetical
   - Each row: "{SiteA} vs {SiteB}" link + score-vs-score quick preview
   - Pagination if needed (40 per page)

5. FOOTER HINT:
   - "Don't see a comparison you want? [Use the comparison tool →]"
   - Links to a compare-builder UI if one exists; otherwise to /reviews

PART 2: /compare/{a}-vs-{b} INDIVIDUAL PAGE

1. PAGE HEADER:
   - H1: "{SiteA} vs {SiteB}"
   - Subhead: "Two sites scored on the same four pillars. Here's how they stack up."
   - Remove generic boilerplate intro if currently present

2. AT-A-GLANCE COMPARISON (top of page):
   - Side-by-side card layout: SiteA on left, SiteB on right
   - For each side: cover image, name, score, niche tag, price, ONE CTA
   - Affiliated sites get "Visit Site"; unaffiliated get "Read Full Review"
   - Center column shows "vs" or quick win indicator

3. PILLAR-BY-PILLAR BREAKDOWN:
   - 4 sections, one per pillar (Content Quality, Value, Site Design, Update Frequency)
   - Each pillar section:
     • Pillar name + weight
     • Two scores side by side (smoothed to nearest 5)
     • 2-sentence editorial framing of which site wins this pillar and why
   - Mark editorial framing with TODO_VOICE comment for per-pair rewriting

4. THE VERDICT:
   - H2: "Which should you pick?"
   - Two paragraphs, one for each scenario:
     • "Pick {SiteA} if..." — name the use case
     • "Pick {SiteB} if..." — name the use case
   - Both recommendations should be honest; not artificially balanced if one clearly wins
   - Mark with TODO_VOICE comment

5. CTA ROW (single, at bottom):
   - Both Visit Site buttons inline (one per affiliated site)
   - Unaffiliated sides show "Read Full Review" instead
   - cta_position='compare-page-final', source_type='compare_page_cta'

6. RELATED COMPARISONS (small, bottom):
   - "Also compared: {SiteA} vs X · {SiteB} vs Y · X vs Y"
   - 3-5 small text links to related compare pages

REMOVE FROM COMPARE PAGES:
- Any redundant mid-page CTA banners
- Any "honest comparison" / "unbiased comparison" trust-claim language
- Any score-as-prose ("SiteA scores 4.6 vs SiteB's 4.3, meaning...")

VOICE RULES (for new copy):
- Statement-form pillar verdicts ("SiteA wins on library size" not "SiteA might be considered the winner")
- Specific over general (cite numbers: "12,500 scenes vs 4,000 scenes")
- First-person where personal judgment is involved ("I'd lean toward...")
- No hedging words ("might," "could," "perhaps") except where genuine uncertainty exists
- No "actually," "really," "literally," "definitely"

DELIVERABLES:
- Modified src/pages/CompareIndex.tsx (or equivalent)
- Modified src/pages/ComparePage.tsx
- New small components if needed (at-a-glance card row, pillar breakdown row) — but reuse existing where possible
- TODO_VOICE comments at pillar verdicts and final recommendation paragraphs

TESTING:
- Build and verify all 188 compare pages render correctly
- Verify affiliated/unaffiliated CTA logic still works (Sprint 13 fixes are preserved)
- Verify the index page lists all 188 pairs
- Verify mobile layout for side-by-side comparison works (stacks vertically)
- Verify tracking emits correctly with new cta_position values

DO NOT:
- Change comparison logic
- Change featured pair list (Prompt B handles that)
- Modify other pages
- Add new dependencies
```

### Prompt 7 — /ask-ai page refinement

The AI-powered recommender page. Lower priority than the others; ship after the bigger pages are clean.

```
TASK: Refine src/pages/AskAI.tsx — the AI-powered site recommender.

PHILOSOPHY:
The /ask-ai page is a utility tool, not editorial content. The fix is making it feel like a tool, not like another marketing page. Cleaner intake form, more confident recommendation output, less filler text around it.

CONSTRAINTS:
- Do NOT change the underlying useAIReview hook or AI generation logic
- Do NOT change the sessionStorage caching
- Do NOT modify Anthropic API integration or model
- Do NOT change /reviews, /reviews/{slug}, /methodology, /best-deals, /compare, /, blog

CHANGES IN ORDER:

1. PAGE HEADER:
   - H1: "Ask TwinkAI" → consider "Find your site in 30 seconds" (more functional, less brand-y) OR keep "Ask TwinkAI" if it's been promoted elsewhere as the feature name
   - Subhead: "Tell me your budget and what you're into. I'll match you to a site from the 62 I've tested."
   - First-person voice (matches methodology page)

2. INPUT FORM SIMPLIFICATION:
   - Reduce to 3 questions max:
     • Budget per month (slider or 3 options: under $15, $15-25, over $25)
     • What you're into (multi-select niche pills, 6-8 options max)
     • What matters most (single select: huge library / latest content / best value / specific niche)
   - Remove any free-text questions — they slow people down and produce noise for the AI
   - Single "Find my site →" button to submit

3. RESULT DISPLAY:
   - Show ONE primary recommendation prominently (not 3)
   - Below: "Also consider:" with 2 secondary recommendations as smaller cards
   - Primary recommendation should include:
     • Site name + score
     • Cover image
     • ONE paragraph (3-4 sentences) explaining why this match — first-person, specific to the user's inputs
     • CTA: Visit Site (if affiliated) + Read Full Review
     • cta_position='ask-ai-primary', source_type='ask_ai_primary'
   - Secondary recommendations:
     • Compact cards, name + score + 1-line note
     • cta_position='ask-ai-secondary', source_type='ask_ai_secondary'

4. RESET / TRY AGAIN:
   - Below results, a small "Try different answers →" link that resets the form
   - Do NOT lose user inputs if they reset — pre-fill with last answers so they can tweak

5. REMOVE clutter:
   - Any "Powered by Claude AI" branding (this is a utility, not a feature pitch)
   - Any "AI thinks" framing — the recommendation should be presented as a recommendation, not as AI output
   - Any extra CTA banners or marketing copy on the page outside the form/result

VOICE RULES:
- First-person ("I'd recommend...", "I tested...")
- Specific over general (cite numbers, name competing options)
- No "based on your preferences" filler — go straight to the recommendation

DELIVERABLES:
- Modified src/pages/AskAI.tsx
- Updated AI prompt template (in whatever file currently holds it) to produce first-person specific recommendations matching the methodology voice
- Tracking wiring for new cta_position values

TESTING:
- Submit the form with 5 different input combinations
- Verify the primary recommendation is specific and references the user's inputs
- Verify secondary recommendations are different from primary
- Verify CTAs route correctly (affiliated vs unaffiliated)
- Verify reset preserves last inputs

DO NOT:
- Change the AI provider or model
- Change caching logic
- Add new dependencies
- Modify other pages
```

### Prompt 8 — Blog index and post template

The blog is the SEO long-tail. Smaller fixes than the page templates above but worth doing.

```
TASK: Refine blog index (src/pages/BlogIndex.tsx) and blog post template (src/pages/BlogPost.tsx).

PHILOSOPHY:
The blog has 6 articles currently. The bones are fine; the voice and CTA structure mirror the review pages and have the same AI-slop and over-CTA issues. Same fixes apply.

CONSTRAINTS:
- Do NOT rewrite the 6 existing blog post bodies (per-post editorial work)
- Do NOT change blog routing or schema markup
- Do NOT modify /reviews, /reviews/{slug}, /methodology, /best-deals, /compare, /, /ask-ai

CHANGES:

PART 1: /blog INDEX

1. HEADER:
   - H1: "The TwinkVault Blog" or "Notes & explainers" — pick the more editorial framing
   - Subhead: "Longer-form pieces on the industry, individual sites, and how to think about the catalog. {N} articles."

2. ARTICLE GRID:
   - Each card: cover image, title, 1-sentence excerpt (max 20 words), date, "Read →"
   - Remove "Published by TwinkVault" footer text — implied
   - Sort by date desc

3. NO FILTER/CATEGORY pills unless there are >12 articles. Below 12, simple grid is fine.

PART 2: /blog/{slug} POST TEMPLATE

1. HEADER:
   - Title (H1)
   - Below title: "By Isaac · {date} · {readTime} min read"
   - Byline is important — adds credibility per the methodology byline addition

2. BODY:
   - Existing prose stays
   - Add TODO_VOICE comments at the start of each major section, same pattern as review pages

3. INLINE SITE CTAs:
   - The existing BlogBlockSiteCta blocks: KEEP but audit each instance
   - For posts that reference specific sites, ensure the inline CTA shows the affiliated site's Visit button (and falls back to Read Review for unaffiliated)
   - cta_position='blog-inline-cta', source_type='blog_inline_cta' (already wired per Sprint 11)

4. END OF POST:
   - Single closing CTA: "Browse all reviews →" or "See related sites →"
   - NOT a generic "Visit a top site" CTA
   - Should route based on post content — for now, /reviews is the safe default

5. RELATED ARTICLES:
   - Below closing CTA: "More from the blog" with 3 related posts (manual selection in frontmatter or hand-curated array)

VOICE RULES:
- Bylines visible
- First-person essays (matches methodology and homepage voice)
- No "in this article we will" intro framing
- No "in conclusion" outro framing

DELIVERABLES:
- Modified src/pages/BlogIndex.tsx
- Modified src/pages/BlogPost.tsx
- TODO_VOICE comments at section starts in existing blog post data
- Byline rendering verified

TESTING:
- Build and verify all 6 blog posts render
- Verify bylines display correctly
- Verify inline site CTAs route correctly
- Verify related articles render (if implemented)

DO NOT:
- Rewrite blog post bodies
- Add new dependencies
- Modify other pages
- Change SEO/schema
```

---

## FOLLOW-UP RITUALS (not Claude Code prompts; manual work)

After all sprints ship, these are the recurring tasks that maintain the site's editorial quality. Roughly 1-2 hours per month total.

### Monthly (1st of each month, ~30 min)
1. Run `getTopDealPick()` formula or read its output. Whichever site wins, that's the new Editor's Pick.
2. Rewrite the editor's note in src/pages/Index.tsx (60-80 words, first-person, specific).
3. Update Editor's Recommendations on src/pages/ReviewsIndex.tsx if any of the 3 picks have changed.
4. Add a change-log entry to /methodology if any material rubric changes shipped.

### Monthly (mid-month, ~30 min)
1. Visit each affiliate dashboard, confirm active deals.
2. Update `deal_last_verified` ISO date in src/data/sites.ts for verified deals.
3. Remove `deal_discount` for any deals that have ended.
4. Run `npm run dev` and spot-check /best-deals visually.

### Ongoing (15-20 min/day, as bandwidth allows)
1. Pick one site review at random (or rotate through alphabetically).
2. Search the file for TODO_VOICE markers.
3. Rewrite the marked paragraph in first-person methodology voice (ban list: actually, really, literally, definitely, is solid, carves out, specific niche).
4. If you've actually subscribed to the site, set `review_depth: 'subscription'` in sites.ts.
5. If you have a clear use case for the site, write `best_for_specific`.
6. Commit and ship.

After 2-3 months of daily-ish review-rewriting, the entire catalog will be in your voice. Compound improvement over time.

### Quarterly (~1 hour)
1. Review the methodology page; add a change-log entry if you've evolved how you score.
2. Audit the Top 10 on the homepage — does it still reflect your rankings?
3. Audit Featured Comparisons — are the 6-9 highlighted pairs still the highest-traffic / highest-converting ones? Swap based on Supabase data.

---

## NOTES ON HOW TO USE THIS DOCUMENT

- Each prompt is self-contained. Paste one into Claude Code and ship before moving to the next.
- Prompt A and Prompt B are small and quick — ship them before their larger dependent prompts.
- Don't try to ship multiple prompts in one Claude Code session. The compounding context bloat reduces quality.
- After each ship, hard-refresh the affected URL and visually verify before moving on.
- Commit messages should reference the prompt: "ship: prompt 4 — review page refinement" etc.
- If a prompt produces output that exceeds 40% file change ceiling, stop Claude Code and reconsider — likely the prompt is too vague or the AI is over-reaching.
