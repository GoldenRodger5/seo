# TwinkVault Site Overhaul — Claude Code Prompts

**Run these in order. Each sprint is designed to be independently shippable.**

---

## CONTEXT TO PASTE AT THE START OF EVERY PROMPT

```
You are working on TwinkVault.com — a gay adult content affiliate review site (React/Vite, Vercel, Supabase).

CRITICAL CONTEXT:
- 50+ sites in src/data/sites.ts using SiteData interface (price_monthly, price_annual fields — NOT deprecated price_from)
- Affiliate routing: src/components/OutboundLink.tsx → /go/:slug → GoRedirect.tsx (logs to Supabase clicks table) → window.open(affiliate_url)
- Active affiliate programs (with affiliate_url already wired): zBuckz (17 sites), MyGayCash/WoofCash (12), NakedSword Cash (2), CrakRevenue (smartlink + Manfinder), ChargedCash (12), XXXRewards (2), AdultForce (pending approval, 15 offers)
- Sites WITHOUT affiliate_url yet: helix-studios, next-door-twink, next-door-world, prideflame
- Tech: React 18 + Vite + TypeScript, TailwindCSS, React Router, Supabase, prerender-meta script for SEO
- Key files: src/data/sites.ts, src/hooks/useAIReview.ts, src/components/OutboundLink.tsx, scripts/generate-sitemap.ts

SEO PERFORMANCE CONTEXT (from Google Search Console, last 30 days):
- "best twink sites" — pos 5.65, 95 impressions, 11 clicks (PUSH TO TOP 3)
- "twink sites" — pos 6.28, 110 impressions (PUSH TO TOP 3)
- "twinktrade discount" — pos 11.16, 43 impressions, 0 clicks (CAPTURE)
- "next door twink discount" — pos 25.5, 8 impressions (CAPTURE when Buddy Profits unlocks)
- "best gay twink sites" — pos 16.47, 15 impressions (CAPTURE)
- /best-deals page: 77 impressions, 0 clicks at pos 14.75 (FIX CTR + RANKING)
- 100% of clicks land on homepage — review pages not yet ranking
- Mobile = 50% of traffic but only 7.74% CTR (UX leak)

Always commit changes with descriptive messages. Run `pnpm build` after major changes to verify nothing breaks.
```

---

# SPRINT 1 — Quick Picks Above the Fold + Dynamic Site Count

**Why:** 60% of traffic is impulse browsers (Marco persona). Current homepage hides all sites below the hero. The hardcoded "12 Sites" claim across the site undercuts authority — actual count is 50+. This is the single highest-impact UX change.

**GSC link:** Homepage gets 100% of clicks (57/57). Anything we put above the fold WILL be seen.

```
Read /context above.

GOAL: Add a "Quick Picks" section above the fold on the homepage that converts impulse browsers in under 30 seconds, AND replace all hardcoded site counts site-wide with a dynamic count.

PART 1 — Dynamic Site Count
1. Create src/lib/siteStats.ts that exports:
   - TOTAL_SITES (count of sites in src/data/sites.ts)
   - REVIEWED_SITES (count where hasReview === true OR review body exists in useAIReview)
   - DEAL_SITES (count where discount_percent > 0)
2. Search the entire codebase for hardcoded "12 Sites", "12 sites", "12 reviewed", and any similar phrases. Replace ALL of them with dynamic values from siteStats.ts.
3. Verify by running grep -r "12 sites" src/ — should return zero results.

PART 2 — Quick Picks Hero
4. Build a new component src/components/QuickPicks.tsx that renders BELOW the existing hero copy but ABOVE the "Featured Reviews" section.
5. Layout: 3 cards in a horizontal row (desktop) / vertical stack (mobile). Each card represents a "shortcut" intent:
   - Card 1: "🔥 Hottest Premium" → links to /go/helix-studios (top scored site, currently no affiliate but prep for when Buddy Profits unlocks; for now link to /reviews/helix-studios)
   - Card 2: "💸 Best Value" → links to /go/next-door-twink (when affiliate live; currently /reviews/next-door-twink)
   - Card 3: "🎁 Free Trial" → links to /go/athletic-twinks (or whichever site has a trial — check sites.ts has_trial field)
6. Each card must show:
   - The intent label as the headline
   - Site name beneath it
   - Score circle (small, top right)
   - One-line tagline (e.g., "Polished American twinks, cinematic productions")
   - Primary CTA button "Visit Site →" (gold, full width)
   - Tiny "Read review" text link beneath
7. Card design: 
   - Use a colored gradient background unique to each card (warm orange for hot, green for value, blue for trial)
   - Each card needs a visual element — for now use the site's first letter in a large stylized font as background watermark, OR a Lucide icon (Flame, DollarSign, Gift)
   - Hover: subtle lift + border glow
   - Mobile: full-width cards, tap targets ≥44px

PART 3 — Wire CTAs Through Affiliate Routing
8. Each "Visit Site →" button must use the existing OutboundLink component so clicks log to Supabase. If a site has no affiliate_url, OutboundLink should fall back to the review page (already supported).

PART 4 — Headline Above Quick Picks
9. Above the 3 cards add an H2: "Skip the Reading. Here's What You Actually Want."
10. Beneath it a subhead: "Three picks for three moods. One click to the goods."

PART 5 — Verify
11. Run pnpm build and confirm no TypeScript errors.
12. Open the site locally and verify:
    - Quick Picks renders between hero and Featured Reviews
    - All 3 cards have visual elements (no plain text-only cards)
    - All site count references show the real number (50+)
    - Mobile view: cards stack vertically with proper spacing

Commit message: "feat: add Quick Picks above fold + dynamic site count"
```

---

# SPRINT 2 — Niche Tags + Niche Category Pages (David Persona + Long-Tail SEO)

**Why:** David (10% of traffic) currently has zero way to browse by content type. More importantly, this unlocks dozens of long-tail SEO landing pages.

**GSC link:** Right now you rank for generic "twink sites." Niche pages (`/best-bareback-sites`, `/best-asian-twink-sites`) capture entirely new keyword universes. Each niche page is a new front door.

```
Read /context above.

GOAL: Add niche tagging to every site and build niche category pages that rank for long-tail SEO.

PART 1 — Add Niche Field to SiteData
1. In src/types/site.ts (or wherever SiteData is defined), add: niches: string[] (array of niche slugs)
2. Define the canonical niche taxonomy in src/data/niches.ts as an exported const:
   - bareback, twink, asian, latin, bear, daddy, college, military, amateur, big-dick, jock, uncut, hairy, smooth, group, solo, fetish, interracial, muscle, str8-curious
   - Each niche should have: slug, displayName, description (1 sentence for SEO), heroTagline (punchy line for the page), seoTitle, seoDescription
3. For each site in src/data/sites.ts, add 3-7 relevant niches based on the site's actual content. Use your knowledge of the brands:
   - helix-studios → twink, college, smooth, amateur
   - next-door-twink → twink, amateur, college, str8-curious
   - bareback-cum-pigs → bareback, daddy, group, hairy
   - athletic-twinks → twink, jock, college, smooth
   - peter-fever → asian, muscle, jock
   - latin-leche → latin, twink, amateur, str8-curious
   - bear-films → bear, daddy, hairy
   - (etc — assign based on each brand's actual content)
   IMPORTANT: Do not invent niches a site doesn't have. Use only what's accurate.

PART 2 — Niche Category Page Template
4. Create src/pages/NicheCategoryPage.tsx that renders at /niche/:slug
5. The page should:
   - Pull all sites with the matching niche tag, sorted by score desc
   - Show H1: "Best {DisplayName} Sites in 2026" (e.g., "Best Bareback Sites in 2026")
   - Subhead from niche.heroTagline
   - 2-paragraph SEO intro that mentions the niche, what to expect, and links to 3-5 sub-niches
   - Grid of site cards (reuse SiteCard component) showing all matching sites
   - FAQ section with 4-5 niche-specific questions (use FAQPage JSON-LD schema)
   - Internal links to 3 related niches at the bottom ("People interested in {niche} also browse: {related niches}")
6. Add full meta tags via the prerender system: title, description, canonical, OpenGraph, Twitter card.

PART 3 — Add Routes
7. Add route /niche/:slug in src/App.tsx (or wherever routes are defined) pointing to NicheCategoryPage.
8. Update scripts/generate-sitemap.ts to include all niche pages.
9. Update prerender script to pre-render meta tags for each niche page.

PART 4 — Niche Tags on Site Cards
10. Update src/components/SiteCard.tsx to display 3 niche tags as small clickable pills below the site name. Each pill links to /niche/{slug}.
11. Update src/pages/ReviewPage.tsx (the individual site review page) to show all niches as larger clickable pills in the sidebar.

PART 5 — Niche Browser on Homepage
12. Add a new homepage section between Quick Picks and Featured Reviews titled "Browse by What You're Into."
13. Render 12 niche tiles in a grid (3x4 desktop, 2x6 mobile). Each tile:
    - Niche name in big text
    - Lucide icon or emoji (no AI-generated images for now)
    - Site count e.g. "18 sites"
    - Color-coded background (rotate through the brand palette)
    - Links to /niche/{slug}
14. Choose the 12 most important niches: bareback, twink, daddy, bear, asian, latin, college, military, amateur, big-dick, muscle, jock.

PART 6 — Internal Linking from Existing Pages
15. On every site review page, add a "More {primary niche} sites" CTA in the sidebar that links to that site's primary niche page.
16. On the homepage Featured Reviews section, add a "View all {niche} sites →" link beneath each featured site.

PART 7 — Verify
17. Run pnpm build. Verify the sitemap includes /niche/* URLs.
18. Open /niche/bareback and /niche/asian — confirm they render with proper sites, FAQ, and meta tags.
19. Click a niche pill on a site card — confirm it navigates to the correct niche page.

Commit message: "feat: niche taxonomy + niche category pages for long-tail SEO"
```

---

# SPRINT 3 — Visual Site Cards + Mobile Conversion Bar

**Why:** Site cards are 100% text right now. This is fatal for impulse adult traffic. Also: mobile = 50% of traffic with only 7.74% CTR. Mobile-first conversion fix.

**GSC link:** Mobile CTR (7.74%) lags Tablet (19.44%). Closing that gap = 60% more clicks from mobile alone.

```
Read /context above.

GOAL: Make site cards visually distinctive and add a sticky mobile conversion bar to every site review page.

PART 1 — Visual Site Cards
1. Update src/components/SiteCard.tsx so every card has visual interest:
   - Top section: a stylized header bar with the site's brand color (add brand_color hex field to SiteData if not present, populate based on each brand's actual identity — helix is gold/yellow, NakedSword is red, Bear Films is brown, etc.)
   - Watermark: site's first letter rendered huge (180px, opacity 0.08) behind the card content
   - Score circle in top-right corner (already exists)
   - Niche pills below site name
   - Pricing strip: monthly price + savings % if discounted
   - Primary CTA: "Visit Site →" full width gold button
   - Secondary: tiny "Read review" text link
2. Use SVG patterns or CSS gradients for visual texture — never AI-generated images (legal/copyright risk for adult content).
3. Cards must look distinct from each other. No two adjacent cards should look identical.

PART 2 — Sticky Mobile CTA Bar on Review Pages
4. Create src/components/StickyMobileCTA.tsx that renders only on mobile (<768px) and only on /reviews/:slug pages.
5. It pins to the bottom of the viewport and contains:
   - Left side: site name + small score badge
   - Right side: "Visit Site →" gold button (uses OutboundLink for tracking)
6. The bar appears after the user scrolls 400px down the page (so it doesn't compete with the in-page CTA above the fold).
7. Bar is dismissible with an X — but reappears on next page load (we WANT it to nag).
8. Add safe-area-inset-bottom padding for iOS notch.

PART 3 — Sticky Desktop Sidebar (Already Exists, Enhance)
9. The desktop review page already has a sticky sidebar with score + Visit Site button. Enhance it:
   - Add the discount badge ("-66%") prominently if applicable
   - Add a secondary line: "or {site} starts at ${price_annual / 12}/mo billed annually" for transparency
   - Add a "Compare with another site" link that opens a niche-filtered comparison picker (build basic version: dropdown with other top sites in same niche)

PART 4 — Card Hover States
10. Desktop: on hover, card lifts 4px and gold border glows. Add a faint preview tooltip showing 3 quick stats: "Updated weekly · 200+ scenes · HD/4K".
11. Mobile: long-press shows the same tooltip for 1.5 seconds.

PART 5 — Verify
12. Run pnpm build.
13. Open /reviews on desktop — every card should look visually distinct, with brand colors and watermarks.
14. Open any /reviews/:slug page on mobile — sticky CTA bar should appear after scrolling.
15. Verify dismiss works and tracks via OutboundLink.

Commit message: "feat: visual site cards + mobile sticky CTA bar"
```

---

# SPRINT 4 — Comparison Page Verdict CTAs + Multi-Site Comparison

**Why:** Comparison pages have NO affiliate CTAs in their verdict cards — pure money leak for James persona. Plus, 2-up only when users want 3-4 way comparisons.

**GSC link:** Adds new long-tail URLs (e.g., `/compare/helix-vs-next-door-twink-vs-boy-fun`) and gives readers conversion paths after they decide.

```
Read /context above.

GOAL: Add affiliate CTAs to verdict cards on comparison pages, build a multi-site comparison tool, and generate the next 50 highest-priority 2-way comparison pages.

PART 1 — Verdict Card CTAs
1. On every comparison page (template at src/pages/ComparisonPage.tsx or similar), the "Our Verdict" / "Bottom Line" section currently has cards declaring winners but no affiliate buttons.
2. Update the verdict cards to include:
   - Winner site: large "Visit {Site} →" button (gold, OutboundLink-wrapped)
   - Runner-up: smaller "Try {Site} instead →" button (secondary style, also OutboundLink-wrapped)
   - One-line reason for each ("Best for premium production value" / "Best if budget matters")

PART 2 — Multi-Site Comparison Builder
3. Create src/pages/CompareBuilder.tsx at route /compare
4. UI: dropdown/multi-select where users can pick 2-4 sites from sites.ts
5. On submit, render a side-by-side comparison table showing for each selected site:
   - Hero row: name, score, price/mo, price/yr, trial available
   - Content row: total scenes (estimate from site description), update frequency, video quality
   - Pricing row: monthly, annual, discount %, total annual cost
   - Niches: comma-separated niche tags
   - Pros/cons: top 3 each
   - Verdict CTA: Visit Site button per column
6. URL should be sharable — encode selected slugs in URL query params (?sites=helix-studios,next-door-twink,boy-fun)
7. Add "Save this comparison" button that stores in localStorage so user can come back to it.

PART 3 — Generate Next 50 Comparison Pages
8. Create scripts/generate-comparison-pages.ts that:
   - Reads all sites from sites.ts
   - For each pair of top-30 sites, generates a comparison page entry
   - Prioritizes pairs that share a primary niche (these get more search volume)
   - Outputs 50 new comparison page slugs to src/data/comparisons.ts
9. The comparison page template should pull from this data file so every comparison has structured data: which sites, primary niche overlap, suggested winner, runner-up.
10. Each comparison page includes:
    - H1: "{Site A} vs {Site B}: Which Is Better in 2026?"
    - Bottom Line Up Front (1 paragraph, names winner)
    - Side-by-side table
    - Pros/cons for each
    - Verdict cards with CTAs
    - FAQ (4-5 questions specific to this comparison)
    - "Other comparisons in {primary niche}" — 3 internal links
    - FAQPage + Article JSON-LD schema
11. Update sitemap generator to include all 50 new comparison URLs.

PART 4 — Comparison Discovery on Site Cards
12. Add "Compare with..." dropdown to every site review page sidebar — picks another site, navigates to that comparison page (or to /compare with both pre-selected if no static page exists).

PART 5 — Verify
13. Run pnpm build.
14. Open /compare — verify multi-site builder works for 2, 3, and 4 sites.
15. Open one of the new comparison pages — verify verdict CTAs are present and click through OutboundLink.
16. Confirm sitemap.xml has all new URLs.

Commit message: "feat: comparison verdict CTAs + multi-site comparison builder + 50 new comparison pages"
```

---

# SPRINT 5 — /best-deals CTR + Trust Overhaul

**Why:** /best-deals has 77 impressions and 0 clicks. It's ranking but not converting. Tyler persona is bouncing because urgency claims aren't credible.

**GSC link:** Direct fix for the 77-impression page that's underperforming. Even a 5% CTR = 4 clicks/mo from this page alone, doubling current site traffic to deals.

```
Read /context above.

GOAL: Make /best-deals convert by adding real countdowns OR removing fake urgency, fixing total cost transparency, and adding a "Free Trials Only" filter.

PART 1 — Audit and Replace Fake Urgency
1. On /best-deals, find every "Limited Time" / "Expires Soon" / "Active Deal" badge.
2. For each deal, add an expires_at field to the SiteData deal entry. If the deal is genuinely time-limited, set a real ISO date. If it's evergreen, set null.
3. Update the badge logic:
   - expires_at exists AND <72 hours away → show real countdown timer (HH:MM:SS) with "Ends in" prefix
   - expires_at exists AND <7 days → show "Ends {weekday}"
   - expires_at exists AND >7 days → show "Limited time"
   - expires_at null → show "Always available" (NOT "Limited Time" — be honest)
4. Build src/components/CountdownTimer.tsx for the <72hr case.

PART 2 — Total Cost Transparency
5. Every deal card must show:
   - Discounted price prominently ("$11.99/mo")
   - Total annual cost beneath ("= $143.88 billed annually")
   - Original undiscounted price crossed out ("$24.99/mo")
   - Total savings ("Save $156/year")
6. If the site is monthly only, say "Cancel anytime — no annual commitment."
7. If the site is annual only, say "Annual subscription required."

PART 3 — Filter Bar
8. Add a sticky filter bar at the top of /best-deals:
   - "All Deals" (default)
   - "Free Trials Only" (filters where has_trial === true)
   - "Under $10/mo" (filters where price_monthly < 10)
   - "50%+ Off" (filters where discount_percent >= 50)
   - "Sort: Biggest Discount" (default) | "Lowest Price" | "Highest Score"
9. Filters should be URL-encoded so /best-deals?filter=trials is sharable.

PART 4 — Deal-Specific Email Capture
10. Add an email capture row at the top of /best-deals:
    - "Get a Friday Deal Alert. Never miss a price drop."
    - Single email input + "Notify Me" button
    - Stores to Supabase subscribers table with source: "deals_page"
11. Add a small "Why subscribe?" tooltip: "We send one email Friday with the best deals of the week. Unsubscribe anytime."

PART 5 — Page CTR Improvements (for SEO)
12. Update /best-deals page meta:
    - Title: "Best Gay Twink Site Deals & Discounts 2026 — Up to 70% Off"
    - Description: "Every active discount on premium gay twink sites in one place. Real prices, total cost shown upfront, free trials marked. Updated weekly."
13. Update H1: "Every Active Twink Site Deal in 2026"
14. Add a "Last updated: {date}" badge below H1 — populates from the most recent deal modification timestamp.

PART 6 — Verify
15. Run pnpm build.
16. Open /best-deals — confirm:
    - No fake urgency on evergreen deals
    - All deals show total annual cost
    - Filters work and update URL
    - Email capture submits to Supabase
17. If you have a deal with expires_at < 72hr, confirm the countdown renders.

Commit message: "feat: /best-deals CTR overhaul — real countdowns, total cost transparency, free trial filter"
```

---

# SPRINT 6 — Capture "twinktrade discount" + Discount Page Template

**Why:** "twinktrade discount" has 43 impressions at position 11. You're now monetized on TwinkTrade via ChargedCash. A dedicated, optimized discount page should rank top 3-5 and convert.

**GSC link:** Direct capture of 43 impressions/month from a single keyword. Same template applies to all 12 ChargedCash sites + future programs.

```
Read /context above.

GOAL: Build a reusable discount page template at /{site-slug}-discount and create dedicated discount pages for the top 15 sites with active deals — starting with twinktrade-discount.

PART 1 — Discount Page Template
1. Create src/pages/DiscountPage.tsx at route /:slug-discount
2. The route slug pattern matches /twinktrade-discount, /next-door-twink-discount, etc.
3. Page structure (built for high CTR + conversion + SEO):
   - H1: "{Site Name} Discount: {Discount %} Off in 2026"
   - Hero: huge price comparison ("$11.99/mo — was $24.99/mo")
   - Primary CTA: "Claim {Site} Discount →" (gold, full-width on mobile)
   - 1-paragraph description of what the deal is and why it's the best price
   - "How to claim" 3-step list (1. Click the button below 2. Sign up on {Site} 3. Discount auto-applies — no code needed)
   - "What you get for {price}" — bullet list pulled from site data
   - Score breakdown (compact version)
   - Pros/cons (top 3 each)
   - FAQ (5 questions: "Is this discount real?", "Does {Site} have a free trial?", "What's the cancellation policy?", "Is this the best price for {Site}?", "When does this discount expire?")
   - Secondary CTA: "Claim Now →"
   - "Other deals in {primary niche}" — 3 internal links to related discount pages

PART 2 — Meta Tags Per Page
4. Each discount page must have unique meta:
   - Title: "{Site} Discount {Year} — {Discount%} Off (Lowest Price)"
   - Description: "Get {Site} for ${price}/mo with our active discount. Save ${savings}/year. No promo code needed — discount auto-applies. Updated {month year}."
   - canonical: full URL
   - OpenGraph + Twitter card
5. Add Article + Offer + FAQPage JSON-LD schema. The Offer schema should include price, priceCurrency, availability, validThrough.

PART 3 — Generate Pages for Top 15 Sites
6. Identify the 15 sites with the highest combination of (search volume potential × discount % × current rank). Priorities:
   - twinktrade (43 imp at pos 11 — HIGHEST PRIORITY)
   - next-door-twink (8 imp at pos 25.5 — when Buddy Profits unlocks)
   - helix-studios (rank 1, no current deal but page is brandable)
   - All ChargedCash sites with active discounts
   - All MyGayCash sites with active discounts
7. Create the route mapping in App.tsx and the URL list in src/data/discount-pages.ts.

PART 4 — Internal Linking from Site Reviews
8. On every site review page where a discount page exists, add a "Get the Discount →" button in the sidebar that links to /{slug}-discount. This button is gold and prominent.
9. The site card on /reviews and /best-deals should link to /{slug}-discount when a discount page exists, otherwise to the regular review.

PART 5 — Sitemap + Prerender
10. Update generate-sitemap.ts to include all 15 discount URLs.
11. Update prerender-meta.ts to pre-render unique meta for each discount page.
12. Submit updated sitemap to Google Search Console after deploy.

PART 6 — Verify
13. Run pnpm build.
14. Open /twinktrade-discount — verify:
    - Unique meta tags
    - Real price and discount %
    - Affiliate CTA goes through /go/twinktrade
    - FAQ schema validates (use Google Rich Results Test after deploy)
15. View page source (after build) — confirm prerendered title and description are correct, not "TwinkVault — Default."

Commit message: "feat: dedicated discount pages for top 15 sites — capture 'twinktrade discount' and similar long-tail"
```

---

# SPRINT 7 — Similar Sites + Smart Internal Linking + Exit Intent

**Why:** James persona wants alternatives. Right now review pages are dead-ends with no cross-linking — bad for both UX and SEO authority distribution.

**GSC link:** Internal linking pushes authority from homepage (which gets all current rankings) to review pages (which currently rank for nothing). Also: exit intent recovers Tyler-types who almost left.

```
Read /context above.

GOAL: Add "Similar Sites" sections to every review page, build smart internal linking, and add an exit-intent popup.

PART 1 — Similar Sites Algorithm
1. Create src/lib/similarSites.ts that takes a site slug and returns the 3 most similar sites based on:
   - Niche overlap (60% weight) — count shared niches
   - Score similarity (20% weight) — closer scores rank higher
   - Same affiliate program (10% weight) — slight boost for inventory we can convert
   - Different brand (10% weight) — penalize sites from same studio (don't recommend Falcon to a Falcon viewer)
2. Function signature: getSimilarSites(slug: string, count: number = 3): SiteData[]

PART 2 — Similar Sites Component
3. Create src/components/SimilarSites.tsx that renders 3 site cards in a horizontal row.
4. Heading: "If You Like {Current Site}, Try These"
5. Each card uses the visual SiteCard from Sprint 3 but in compact mode (smaller, score circle only, single-line tagline).
6. Each card has an OutboundLink-wrapped Visit Site button.
7. Component appears at the bottom of every /reviews/:slug page, above the FAQ.

PART 3 — Niche-Based Recommendations
8. On every site review page, also add a "More {primary niche} sites →" text link that goes to /niche/{slug}.
9. On every comparison page, add "More {niche} comparisons →" linking to a filtered comparison list.

PART 4 — Footer Hub Linking
10. Update the footer to include 4 columns:
    - Top Sites: links to /top-sites, /reviews, /best-deals
    - Browse Niches: 8 most popular niche pages
    - Compare: /compare + 5 most popular static comparisons
    - About: /about, /methodology, /privacy-policy, /2257, /affiliate-disclosure
11. Make the niche column dynamic — pull top 8 from siteStats.

PART 5 — Exit Intent Popup
12. Create src/components/ExitIntent.tsx that fires when:
    - Mouse moves above viewport top edge (desktop)
    - User scrolls up rapidly + scroll to top (mobile fallback)
    - User has been on page >10 seconds
    - User has not already dismissed in this session
13. Popup content (varies by page type):
    - On /reviews/:slug: "Wait — {Site} has {discount}% off right now. Claim it before you go." + Visit Site button
    - On /compare/*: "Picked your winner? Claim {winning site}'s discount." + Visit Site button
    - On /best-deals: "Get a Friday Deal Alert" email capture
    - On homepage: "Browse 50+ reviewed sites" CTA to /reviews
14. Popup is dismissible, stores dismissal in sessionStorage so it doesn't fire twice.
15. Popup tracks impression and dismissal events to Supabase clicks table (event_type: 'exit_intent_shown' / 'exit_intent_dismissed' / 'exit_intent_converted').

PART 6 — Breadcrumbs Everywhere
16. Add breadcrumb navigation to every page (Home > Reviews > {Site}, Home > Niches > Bareback, etc.)
17. Each breadcrumb has BreadcrumbList JSON-LD schema.

PART 7 — Verify
18. Run pnpm build.
19. Open any /reviews/:slug page — confirm Similar Sites section renders with 3 relevant sites.
20. Move mouse above viewport on desktop — confirm exit intent fires.
21. Dismiss it and reload — should not fire again until new session.

Commit message: "feat: similar sites + smart internal linking + exit intent popups"
```

---

# SPRINT 8 — Mobile-First Polish + International + GA4

**Why:** Mobile = 50% of traffic but underconverting. International queries (Germany, Italy, Brazil, Japan) show intent. And we need GA4 to actually measure all of this.

**GSC link:** Mobile CTR fix + international hreflang + analytics infrastructure to measure every change from Sprints 1-7.

```
Read /context above.

GOAL: Polish the mobile experience, add basic international support for top non-US markets, and install GA4.

PART 1 — Mobile Audit + Polish
1. Open every major page on mobile viewport (375x667) and fix:
   - Tap targets <44px on any interactive element
   - Horizontal overflow on any container
   - Text smaller than 14px in body content
   - Buttons that don't span full width on cards
   - Sticky elements that overlap content
2. Specifically audit and fix:
   - Homepage Quick Picks: cards must stack and have 16px gap
   - /reviews grid: 1 column on mobile, 2 on tablet, 3 on desktop
   - /best-deals: filter bar must be horizontally scrollable on mobile (not wrapping)
   - Comparison pages: tables must scroll horizontally with sticky first column
   - Review page sidebar: collapses to inline section on mobile, with sticky CTA bar from Sprint 3

PART 2 — Mobile-First Above the Fold
3. On homepage mobile view: Quick Picks must be visible without scrolling. If hero copy pushes them down, shrink hero copy to 2 lines max on mobile.
4. On any /reviews/:slug page mobile: site name, score, primary CTA must all be visible above fold. Move pros/cons and FAQ further down.

PART 3 — International (Light Touch)
5. Add hreflang tags to every page:
   - en-us (default)
   - en-gb 
   - en-ca
   - en-au
   - x-default
6. Detect user country from CloudFlare/Vercel headers and adjust pricing display:
   - Show $ for US/CA/AU
   - Show £ for UK
   - Show € for Germany/Italy/France/Spain (with note "approximate, charged in USD")
7. Do NOT translate content. Just adjust currency display and add a small flag indicator.
8. For Germany/Italy/Brazil/Japan markets specifically: add a short translated tagline on the homepage hero in their language ("Die besten Twink-Seiten" / "I migliori siti twink" / etc.) — small text, not a full translation. This signals to search engines we serve those markets.

PART 4 — GA4 Installation
9. Add GA4 via @vercel/analytics OR raw gtag.js (preferred for full control):
   - Add tracking ID env var VITE_GA4_ID
   - Load gtag.js in index.html with consent default 'denied' (GDPR-safe)
   - Create src/lib/analytics.ts with helpers: trackPageView, trackEvent, trackOutbound
10. Wire events:
    - All OutboundLink clicks → trackOutbound(slug, affiliate_program)
    - Email signups → trackEvent('email_signup', {source})
    - Quick Pick clicks → trackEvent('quick_pick_click', {intent})
    - Niche tile clicks → trackEvent('niche_click', {niche})
    - Comparison verdict clicks → trackEvent('verdict_click', {site, comparison})
11. Add a basic cookie consent banner that respects "deny" — only loads gtag after consent. Use a minimal solution like tarteaucitron or a simple custom banner.

PART 5 — Performance Audit
12. Run Lighthouse on homepage, /reviews, /reviews/helix-studios, /best-deals.
13. Fix anything below 80 on Performance.
14. Specifically:
    - Lazy-load images below the fold
    - Defer non-critical JS
    - Inline critical CSS
    - Minify and compress everything via Vite build

PART 6 — Verify
15. Run pnpm build.
16. Open every key page on mobile (375px) — confirm zero horizontal overflow, all CTAs above fold where appropriate.
17. Verify GA4 events fire by opening the GA4 DebugView and clicking through CTAs.
18. Verify hreflang tags appear in page source for at least 4 locales.
19. Run Lighthouse — confirm Performance ≥80, SEO ≥95, Accessibility ≥90 on homepage.

Commit message: "feat: mobile polish + international light touch + GA4 + cookie consent"
```

---

# POST-OVERHAUL CHECKLIST

After running all 8 sprints, manually verify:

1. **Sitemap submitted** to Google Search Console + Bing Webmaster Tools (resubmit after each sprint deploy)
2. **GA4 receiving events** — check DebugView
3. **Supabase tables in place** — clicks, subscribers, contact_submissions, content_log
4. **No fake urgency anywhere** — search codebase for "expires soon" / "limited time" — every instance must tie to a real expires_at OR be removed
5. **Dynamic site count everywhere** — search for hardcoded numbers
6. **All affiliate links route through /go/:slug** — never direct affiliate URLs in the DOM
7. **No copyrighted images** — only SVG/CSS visual elements (legal protection)
8. **Mobile sticky CTA tested** on real device, not just simulator
9. **Exit intent fires correctly** on real mouse movement
10. **All 50 comparison pages indexable** — submit to GSC

---

# WHAT THIS OVERHAUL ACCOMPLISHES

**For Marco (60% of traffic):** Quick Picks above fold, visual cards, sticky mobile CTA, exit intent. Click-to-buy in <30 seconds.

**For James (15%):** Verdict CTAs on comparisons, multi-site builder, similar sites cross-linking, total cost transparency.

**For Tyler (15%):** Real countdowns, total cost shown, free trial filter, deal-alert email capture, no fake urgency erosion.

**For David (10%):** Niche taxonomy, niche category pages, niche-based browsing on homepage, niche-tagged site cards.

**For SEO:**
- 20+ niche category pages capturing long-tail
- 50 new comparison pages
- 15 dedicated discount pages capturing "{site} discount" keywords
- Internal linking from homepage authority to review pages
- Mobile CTR improvements
- hreflang for international
- GA4 to actually measure what works

**Estimated traffic impact (60-90 days):** 3-5x current traffic from SEO infrastructure alone, before counting authority compounding.

**Estimated revenue impact:** Quick Picks + exit intent + verdict CTAs alone should 2-3x conversion rate on current traffic. Combined with traffic growth, you're looking at $1,500-3,000/mo by month 3 if execution is clean.
