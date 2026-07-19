# TwinkVault — Homepage Density Sprint

## Context for Claude Code

The TwinkVault homepage currently has a density problem. Compared to competitor affiliate sites in the same category (MyGaySites, ThePornDude), TwinkVault's homepage shows too little content in the first two viewports — large empty horizontal margins, sparse three-card rows, grayscale letter placeholders instead of real banner images, and the "Top 10" list reading as a Wikipedia table rather than a porn directory.

**The editorial restraint is correct. The sparseness is not.** A horny visitor arriving from organic search must see many clickable options in the first 1–2 viewports without sacrificing the editorial credibility that distinguishes TwinkVault from spam aggregators.

This sprint does NOT redesign the hero. The hero ("Independent reviews of 62 gay porn sites" + niche/methodology CTAs) stays as-is. Three sections change: **Browse by Niche**, **The Top 10**, **Latest Reviews**.

Both **desktop AND mobile** must be updated. Previous sprints have left mobile lagging behind desktop — do not repeat that. Build mobile breakpoints alongside desktop changes in every component touched.

---

## Files Expected to Change

- `src/pages/Index.tsx` — section composition and ordering
- `src/components/home/NicheBrowser.tsx` (or wherever the Browse by Niche section lives) — full restructure
- `src/components/home/TopTenList.tsx` (or equivalent) — row redesign + side feature card
- `src/components/home/LatestReviews.tsx` (or equivalent) — grid expansion
- `src/data/niches.ts` — confirm all 9 niches have cover image paths and site counts
- `src/data/sites.ts` — confirm top 10 sites have banner image paths (flag missing in `docs/missing-banners.md`)

If any of these file paths differ in the actual codebase, adapt — the section names ("Browse by niche", "The Top 10", "Latest reviews") are the source of truth.

---

# CHANGE 1 — Browse by Niche: Expanded Grid

## Current state

Three big featured cards (Twink, Bareback, Amateur) with cover images and editorial intros. Below them, a sad inline text row: "More: Daddy · Bear · Asian · College · Muscle · Jock". The six "More" niches are first-class categories being treated like footnotes.

## Target state

A single unified grid of all 9 niches as tiles. No "featured 3 + text list 6" split. Every niche gets an image, a name, a site count, and a one-line editorial hook.

## Desktop spec (≥1024px)

- **Grid:** 4 columns × first row of 4 tiles, then 4 tiles, then 1 tile on the third row (or equivalent for 9 total). Acceptable alternative: 3 columns × 3 rows (9 perfect grid). Pick whichever matches existing grid utilities — do not introduce a new grid system.
- **Tile dimensions:** roughly 280–340px wide, 16:10 image aspect ratio on top, text block below. Total tile height ~280px.
- **Tile structure (top to bottom):**
  - Cover image (16:10) with a subtle dark gradient overlay on the bottom third for text legibility if any text overlays the image
  - Eyebrow row: site count chip ("41 sites") on the left, optional badge slot on the right (e.g., "Most reviewed" on Twink, "Largest" on Bareback) — only show badges where the data justifies them, never all tiles
  - Niche name in serif display font, ~24px
  - One-line editorial hook in body font, ~14px, 2-line max with ellipsis overflow
- **Hover state:** subtle scale (1.02), gold border (1px), background brightens slightly. No dramatic transforms.
- **Spacing:** 24px gap between tiles. Section padding: 80px top/bottom, max-width 1280px centered.

## Mobile spec (<768px)

- **Grid:** 2 columns × 5 rows (9 tiles, last row has 1 — let it be left-aligned, do not stretch).
  - Alternative if 2-col feels too cramped given image quality: 1 column × 9 rows, but only if image legibility demands it. Default to 2-col.
- **Tile dimensions:** flex to viewport, image stays 16:10, text block compresses but does not hide. Total tile height ~200px in 2-col layout.
- **Eyebrow row:** site count chip stays, badge chip hides on mobile to reduce clutter.
- **Niche name:** ~18px on mobile.
- **Editorial hook:** ~13px, 2-line max.
- **Gap:** 12px between tiles.
- **Section padding:** 48px top/bottom, 16px horizontal page margin.

## Tablet spec (768–1023px)

- **Grid:** 3 columns × 3 rows.
- Tile dimensions and text sizes splits the difference between desktop and mobile (image stays 16:10, name ~20px).

## Data required per niche

```ts
{
  slug: string,
  name: string,           // "Twink", "Bareback", etc.
  siteCount: number,      // calculated from sites filtered by this niche
  coverImage: string,     // path to /public/niche-covers/{slug}.jpg
  editorialHook: string,  // one-line, hand-written, ≤90 chars
  badge?: string,         // optional, hand-curated, e.g. "Largest"
}
```

If any niche is missing a `coverImage`, flag it in `docs/missing-niche-images.md` with format:

| Slug | Name | Site Count | Notes |

Do NOT render a letter placeholder. If the image is missing, render a dark muted background with the niche name in large serif text — no single-letter fallback. Letter placeholders look unfinished.

## Copy — editorial hooks (use these verbatim if niches.ts lacks them)

- **Twink:** "The core of TwinkVault — premium studios down to amateur networks."
- **Bareback:** "The largest category here, all explicitly bareback-focused."
- **Amateur:** "Real performers, no studio polish. Casting feels found, not cast."
- **Daddy:** "Older-younger pairings. Mostly bareback, mostly mature studios."
- **Bear:** "Heavier, hairier, more masculine. Smaller but distinct catalog."
- **Asian:** "Asian performers and studios. Limited but growing selection."
- **College:** "Casting that skews 18–22, often dorm-themed or amateur networks."
- **Muscle:** "Built physiques, gym aesthetics. Heavy crossover with premium studios."
- **Jock:** "Athletic builds, sports themes. Crossover with college and amateur."

## Section header

Keep "Browse by niche" as the H2. Remove any subtitle currently under it. The tiles speak for themselves.

---

# CHANGE 2 — The Top 10: Real Rows + Side Feature Card

## Current state

Plain text-only list, 10 rows. Half the rows have grayscale single-letter placeholders ("N" for Next Door Twink, "N" for Next Door World, "S" for Sean Cody, "M" for Men.com). Rows are visually identical — no badges, no differentiation between #1 and #5. The right two-thirds of the viewport is empty space.

## Target state

Two-column layout on desktop: the Top 10 list on the left (~58% width), a sticky Editor's Pick feature card on the right (~38% width with gap). Every row in the list has a real banner image (no letter placeholders). Badges differentiate rows. The current standalone "MAY 2026 — EDITOR'S PICK / NakedSword" section that lives below the Top 10 gets moved INTO the side feature card slot, and the standalone section is removed.

## Desktop spec (≥1024px)

### Layout

- **Two-column flex/grid:** 58% list / 38% feature card / 4% gap. Or use a CSS grid with `grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr)`.
- **Section padding:** 80px top/bottom, max-width 1280px centered.
- **Section header:** "The Top 10" with subtitle "Ranked by overall score, updated monthly." — keep as-is, spans full width above the two columns.

### Left column — the list

- **10 rows.** Each row:
  - **Rank number:** large, muted gray, 2 digits (01, 02, ... 10), left-aligned, ~40px wide.
  - **Banner image:** 64×64px rounded square (12px radius). NO letter placeholders allowed. If missing, dark gradient background with the site name in small text — never a single letter. Flag missing banners in `docs/missing-banners.md`.
  - **Site info block** (flex column, takes available width):
    - Site name, 18px, white, semibold
    - Meta row: score (gold "4.8"), separator dot, price ("$11.99/mo"), separator dot, tier badge ("Premium" / "Amateur" / "Network") in muted text
  - **Badge slot** (between info and buttons, optional per row):
    - #1: "Editor's Choice" — gold filled chip
    - Lowest $/scene among top 10: "Best Value" — green outline chip
    - Any site added or re-tested in last 30 days: "Recently Tested" — violet outline chip
    - All other rows: no badge
  - **Action buttons** (right-aligned, flex row):
    - "Read" — outline button, violet
    - "Visit" — gold filled button (ONLY if site is affiliated; if not, hide and let "Read" sit alone)
- **Row height:** ~88px each. Thin 1px border-bottom in muted gray. No card containers — flat rows, just dividers.
- **Hover:** row background lightens 4%, no other transforms.
- **Below the list:** "See all 62 sites →" link, gold, 16px, left-aligned, 24px top margin.

### Right column — sticky Editor's Pick

- **Sticky positioning:** `position: sticky; top: 96px;` (offset to clear the nav).
- **Card structure:**
  - Eyebrow: "MAY 2026 — EDITOR'S PICK" in gold, tracking-wide, 12px
  - H3: Site name in serif, ~36px, with score chip inline ("4.6/5" in gold pill)
  - Editorial copy: 4–6 lines of body text, ~16px, the exact NakedSword paragraph currently shown below the Top 10
  - Action row:
    - "Read full review →" text link, gold
    - "Visit NakedSword →" gold filled button
- **Card styling:** 1px border in gold at 20% opacity, dark background slightly lighter than page bg, 32px internal padding, 16px border radius.
- **Remove** the existing standalone "MAY 2026 — EDITOR'S PICK / NakedSword" section that currently appears between the hero and the Top 10. It's replaced by this sidecar.

## Mobile spec (<768px)

- **Single column.** No two-column layout.
- **Editor's Pick card moves ABOVE the Top 10 list** on mobile (don't try to stack it below — the user needs the recommendation first, then the full list).
- **Editor's Pick card** spans full width, internal padding reduces to 20px, H3 reduces to ~28px.
- **Top 10 rows:**
  - Compress the rank number to ~28px wide.
  - Banner image stays 48×48px.
  - Site name 16px, meta row stays inline but may wrap to 2 lines.
  - Badge chip moves below the meta row if present (don't squeeze into one line).
  - Action buttons stack? NO — keep "Visit" prominent on the right, hide "Read" behind a tap on the row itself (entire row is tappable to the review page; "Visit" button remains as the standalone gold button on the right).
  - Row height ~72px.
- **"See all 62 sites →"** link stays at the bottom, centered.

## Tablet spec (768–1023px)

- Single column (no sidecar), Editor's Pick card stays ABOVE the Top 10 (same as mobile).
- Row dimensions match desktop (not compressed).

## Data required

For each top 10 entry:
```ts
{
  rank: number,
  slug: string,
  name: string,
  bannerImage: string,    // required, no letter placeholder fallback
  score: number,
  priceMonthly: number,   // use price_monthly field (per existing schema)
  tier: 'Premium' | 'Amateur' | 'Network',
  affiliateUrl: string | null,   // if null, hide Visit button
  badges: string[],       // computed: ['editors-choice'] | ['best-value'] | ['recently-tested'] | []
}
```

## Badge computation rules

- **`editors-choice`:** rank === 1
- **`best-value`:** lowest `priceMonthly / contentScore` ratio among top 10 (or simply lowest `priceMonthly` if no content score field exists)
- **`recently-tested`:** `updatedAt` within last 30 days

Only ONE badge per row. If multiple would apply, priority order: `editors-choice` > `best-value` > `recently-tested`.

---

# CHANGE 3 — Latest Reviews: 6 Cards, Tighter Grid

## Current state

Three cards in a row. The row sits in the middle of a huge empty viewport — wasted horizontal space on either side.

## Target state

Six cards in a denser grid. Slightly smaller cards individually, but the row feels full and gives the visitor twice as many entry points.

## Desktop spec (≥1024px)

- **Grid:** 3 columns × 2 rows (6 cards total).
- **Card dimensions:** ~380px wide, image 16:10 on top, text block below. Total height ~440px.
- **Card structure:**
  - Banner image (16:10) with subtle gradient overlay on bottom edge
  - Site name in serif, ~22px
  - Score row: 5 star icons (using existing icon set) + numeric score (e.g., "4.6")
  - Editorial excerpt, 2 lines, ~14px, ellipsis overflow
  - "Updated {Month Year}" meta in muted text, ~12px
  - Action row: "Read review →" text link on left, "Visit" gold button on right
- **Gap:** 24px between cards.
- **Section padding:** 80px top/bottom, max-width 1280px centered.
- **Below grid:** "All reviews →" link, gold, centered, 32px top margin.

## Mobile spec (<768px)

- **Grid:** 1 column × 6 rows. Do NOT try to fit 2 columns of cards at this size — the cards get too small to be readable and the images compress poorly.
  - **Alternative:** if the team prefers a horizontal scroll snap row, that works — 1.2 cards visible at a time, snap-x mandatory, but ONLY if the rest of the page already uses scroll snap. Default to vertical stack.
- **Card dimensions:** full viewport width minus page margins, image stays 16:10.
- **Site name:** 20px.
- **Excerpt:** 2 lines, 14px.
- **Action row:** stacked is fine — "Read review →" link on its own line, "Visit" button full-width gold below it.

## Tablet spec (768–1023px)

- **Grid:** 2 columns × 3 rows.
- Card sizes match desktop, gap reduces to 16px.

## Selection logic

The 6 reviews shown should be the 6 most recently updated reviews (by `updatedAt` desc). NOT the highest-scored — that's what the Top 10 is for. This section is about recency and freshness signal.

## Section header

Keep "Latest reviews" as the H2.

---

# CHANGE 4 — Section Order on Homepage

Final section order from top to bottom:

1. Hero (unchanged)
2. Browse by niche (CHANGE 1 — full 9-tile grid, replaces 3 featured + text list)
3. The Top 10 (CHANGE 2 — two-column with sidecar Editor's Pick on desktop, stacked on mobile)
4. Latest reviews (CHANGE 3 — 6-card grid)
5. Utility row: "Not sure what you want? Ask TwinkAI / Take the 30-second quiz" (unchanged)
6. Manfinder cross-promo line (unchanged)
7. Newsletter (unchanged)
8. Footer (unchanged)

**Remove** the standalone "MAY 2026 — EDITOR'S PICK / NakedSword" section that currently sits between the hero and the Top 10. It's absorbed into the Top 10 sidecar on desktop, and into the top of the Top 10 section on mobile.

---

# Mobile Audit Checklist

Before marking this sprint done, verify on a 375px-wide viewport (iPhone SE / standard mobile):

- [ ] Browse by niche shows 2 columns, all 9 tiles, no horizontal scroll
- [ ] Niche tile images are not letter placeholders
- [ ] Niche editorial hooks are visible (2 lines, ellipsis)
- [ ] The Top 10 shows the Editor's Pick card ABOVE the list
- [ ] Top 10 row banner images are real (not letter "N", "S", "M")
- [ ] Top 10 rows are tappable across full width to navigate to review page
- [ ] "Visit" button on Top 10 rows is reachable with thumb (right side)
- [ ] Latest reviews shows 1 column, 6 cards stacked, no horizontal scroll
- [ ] All section paddings are reduced appropriately (no 80px wasted vertical on mobile)
- [ ] Page horizontal margins are 16px, not 0

Also verify on a 768px tablet viewport:

- [ ] Browse by niche shows 3 columns × 3 rows
- [ ] The Top 10 still single-column (sidecar collapses), Editor's Pick above the list
- [ ] Latest reviews shows 2 columns × 3 rows

---

# Out of Scope

- Hero redesign — leave alone
- Any nav changes — leave alone
- Methodology page, reviews index, individual review pages, /best-deals — leave alone
- New components — only build what's needed; reuse existing card primitives if they exist
- Analytics events — keep existing tracking, don't add new events in this sprint
- Adding/removing actual sites or niches — content layer is fixed, only the presentation changes

---

# Deliverables

1. Modified `src/pages/Index.tsx` reflecting new section order and removed standalone Editor's Pick
2. Modified or new niche browser component with 9-tile grid
3. Modified Top 10 component with two-column layout (desktop) / stacked (mobile/tablet)
4. Modified Latest Reviews component with 6-card grid
5. `docs/missing-banners.md` updated with any Top 10 sites still missing real banner images
6. `docs/missing-niche-images.md` (new file if needed) listing any niches missing cover images
7. Screenshots of: desktop homepage scroll, mobile (375px) homepage scroll, tablet (768px) homepage scroll

Report back with a summary of: which files changed, which images are still missing (to fix manually), and any spec ambiguity that required a judgment call.
