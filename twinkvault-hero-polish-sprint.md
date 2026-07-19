# TwinkVault — Hero Redesign + Polish Sprint

## Context for Claude Code

The previous homepage density sprint (commit `ecccdfb` and the one before it) restructured Browse by Niche, the Top 10, and Latest Reviews into a denser, more competitive layout. That work is solid and shipped.

This sprint cleans up what remains: a hero that's still mostly empty space, several cover images with watermarks or low quality, a sidecar spacing miss, and one section-gap that reads as a layout break.

**Three prompts in this document. Run them in order.** Prompt 1 is the hero redesign (most code, biggest visual change). Prompt 2 is the image content debt list (no code — manual asset work for the owner). Prompt 3 is small polish that should ship in the same commit as Prompt 1.

---

# PROMPT 1 — Hero Redesign + Layout Polish

## Files expected to change

- `src/pages/Index.tsx` — hero section markup
- `src/components/home/Hero.tsx` (or wherever the hero lives) — full restructure
- `src/components/home/TopTen.tsx` or equivalent — sidecar left-padding fix
- Section padding values in whichever component currently wraps Top 10 / Latest Reviews

## What's wrong with the current hero

- Headline ("Independent reviews of 62 gay porn sites.") is left-aligned and consumes ~50% of horizontal viewport width
- The right half of the hero viewport is empty black space — no thumbnails, no image, no visual weight balancing the headline
- Two CTAs ("See how we score →" and "Browse all 62 sites →") render as small gold text links beneath the body copy — too quiet, both styled identically, neither reads as the primary action
- A horny visitor arriving from organic search sees no porn imagery above the fold

## Target hero — two-column layout with thumbnail grid

### Desktop spec (≥1024px)

**Outer container:**
- `min-height: calc(100vh - {navHeight})` so the hero fills the first viewport but doesn't overflow
- Vertical padding: 80px top, 80px bottom
- Max width: 1280px, centered
- Two-column grid: `grid-template-columns: 1.2fr 1fr`, gap 64px, both columns vertically centered (`align-items: center`)

**Left column — text block:**
- H1: "Independent reviews of 62 gay porn sites." — keep current serif font, current size, current violet accent on key phrase if any
- Body copy: "Every review is built from a paid membership and scored on the same four-pillar rubric. Updated monthly. No paid placements, ever." — keep current copy verbatim
- CTA row, 16px gap between buttons:
  - Primary: filled gold button labeled "Browse all 62 sites" — links to `/reviews`. Use the same gold button component used on Top 10 "Visit" buttons. Size: padding `12px 24px`, font 16px, min-height 44px
  - Secondary: outline button labeled "See how we score" — links to `/methodology`. Same dimensions as primary, violet outline, transparent background
- Both buttons are real buttons with proper hit targets, not text links

**Right column — thumbnail grid:**
- 2 columns × 3 rows = 6 thumbnails
- Each thumbnail: aspect-ratio 4:5 (portrait), border-radius 12px, gap 12px between tiles
- Pull 6 sites: the top 6 entries from the Top 10 that have real banner images (skip any falling back to dark-gradient placeholders — this grid must be all-images or it defeats its purpose). If fewer than 6 top-10 sites have real banners, pull from highest-scored affiliated sites overall.
- Each thumbnail is wrapped in a link to that site's `/reviews/{slug}` page
- Subtle hover state: scale 1.03, brightness 1.1
- Tile contents: just the cover image with `object-fit: cover`. No text overlay, no badges, no buttons. The grid is purely visual — it signals "we have content."
- Background: each tile has a 1px border at `rgba(255,255,255,0.06)` so they read as a coherent grid even on a dark background

**Visual relationship between columns:**
- Left text column is the visual anchor. Right thumbnail grid is supporting weight.
- The grid should feel tight and editorial — like a contact sheet, not a Pinterest dump
- Subtle dark-to-transparent gradient overlay on the right column from the right edge inward (~12% opacity at right edge fading to 0%) so the grid feels like it "extends off the page" rather than being a hard rectangle

### Tablet spec (768–1023px)

- Stacks to single column. Text block on top, thumbnail grid below.
- Thumbnail grid becomes 3 columns × 2 rows = 6 thumbnails (wider, shorter)
- Each thumbnail aspect-ratio 16:10
- Section padding: 64px top, 64px bottom
- CTAs stay side-by-side, full-width if needed

### Mobile spec (<768px)

- Single column. Text block on top, thumbnail grid below.
- Thumbnail grid: 3 columns × 2 rows = 6 thumbnails, aspect-ratio 1:1 (squares — denser on small screens)
- Gap 8px between tiles
- Section padding: 48px top, 32px bottom
- CTAs stack vertically, full-width:
  - Primary "Browse all 62 sites" gold button on top
  - Secondary "See how we score" outline button below
  - 12px gap between

### Data source for thumbnail grid

Add a helper in `src/lib/heroThumbnails.ts` (or wherever similar helpers live):

```ts
import { sites } from '@/data/sites';

export function getHeroThumbnailSites(count = 6) {
  return sites
    .filter(s => s.bannerImage && !s.bannerImage.endsWith('placeholder.png'))
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, count);
}
```

If the field name for the banner is different (`banner_image`, `cover`, etc.), match the existing schema. If there's no straightforward way to detect placeholder fallbacks, the rule is: any site appearing in the Top 10 with a real banner is eligible; pull those first, then fall back to next-highest scored.

### Hero must NOT include

- A search bar (no `<input>` element in the hero)
- A newsletter signup (lives lower on the page already)
- A rotating ticker / animation / countdown (we tried this in prior sprints, it didn't ship, don't reintroduce it)
- Any video element or autoplay media (perf + bandwidth + autoplay restrictions)
- The current "✓ Independent" / "✓ No paid placements" trust badges if they exist anywhere in the hero — those can live further down

## Layout polish to ship in the same commit

### Fix 1 — Editor's Pick sidecar spacing

In the Top 10 section, the sticky Editor's Pick card on the right currently sits flush against the list rows. Add:
- 24px gap between the list column and the sidecar column (adjust the grid `gap` value)
- Verify the sidecar's internal padding is still 32px (don't double-pad)

### Fix 2 — Reduce vertical gap between Top 10 and Latest Reviews

There's currently a large dead space (~200px on desktop) between the bottom of the Top 10 / Editor's Pick section and the "Latest reviews" H2. The sidecar makes the Top 10 section taller than the list alone, but the section padding wasn't tuned for that.

Fix by reducing the Top 10 section's `padding-bottom` from its current value to `48px` on desktop, `32px` on mobile. If the gap is coming from Latest Reviews' `padding-top` instead, reduce that one — whichever is currently larger should drop by ~40px.

### Fix 3 — Latest Reviews card aspect-ratio consistency

The 6 Latest Reviews cards currently render with slightly varying image aspect ratios (some 16:10, some closer to 1:1, some 16:9) because the source images have different dimensions.

Fix in the card component: wrap each image in a container with `aspect-ratio: 16 / 10` and `overflow: hidden`, set the `<img>` to `object-fit: cover` and `width: 100%; height: 100%`. This forces all 6 to render uniformly regardless of source image dimensions.

This is the same fix that should apply to the niche grid tiles and the hero thumbnail grid — every grid uses `aspect-ratio` + `object-fit: cover`, never relies on the source image dimensions.

## Mobile audit checklist for this sprint

Before marking done, verify on 375px viewport:

- [ ] Hero text block visible without scrolling
- [ ] Thumbnail grid below text block visible without scrolling (or with one short scroll)
- [ ] Primary CTA "Browse all 62 sites" is full-width, min-height 44px, easy thumb-tap
- [ ] Secondary CTA below it, also full-width
- [ ] Thumbnail grid is 3×2 squares, no horizontal overflow
- [ ] No empty horizontal space on either side beyond the standard 16px page margin
- [ ] Sidecar in Top 10 section does NOT render on mobile (collapses, Editor's Pick card moves above the list per prior sprint spec — confirm this is still working)

## Out of scope for this prompt

- Replacing actual cover images (that's Prompt 2 — manual asset work)
- Section ordering changes
- Newsletter, footer, utility row
- Any changes outside `Index.tsx` and the hero/top-10/latest-reviews components

## Deliverables

1. Modified hero component with two-column desktop, stacked mobile/tablet
2. New helper `getHeroThumbnailSites()` or equivalent
3. Editor's Pick sidecar with 24px gap from list
4. Reduced vertical gap between Top 10 and Latest Reviews sections
5. Latest Reviews cards with enforced 16:10 aspect ratio via `aspect-ratio` + `object-fit: cover`
6. Screenshots: desktop hero, mobile (375px) hero, full desktop scroll showing the new sidecar spacing + reduced gap

Report back with: files changed, the 6 sites that ended up in the hero thumbnail grid (so the owner can verify the selection), and any spec ambiguity that required a judgment call.

---

# PROMPT 2 — Image Content Debt (Manual Asset Work)

**This is NOT a Claude Code prompt. This is a manual task list for the site owner.**

The homepage layout is now correct, but several cover images are either watermarked from affiliate landing pages, duplicated across slots, or low-resolution. These need to be replaced manually with clean source images.

## Images to replace

### Niche cover images — `public/niche-covers/`

| Niche slug | Problem | What to source |
|---|---|---|
| `daddy` | Has "CLICK TO VISIT US TODAY" red stamp burned into the image (scraped from affiliate landing page) | Clean studio shot featuring an older/younger pairing. Recommended source: BearFilms, MenOver30, or similar studio press kits. Final dimensions 1200×750, no watermarks |
| `college` | Has "BOYS AT CAMP" studio logo burned into the bottom-right | Clean shot from a college/dorm-themed studio. Recommended source: CorbinFisher, SeanCody, BluCollege, or similar. Final dimensions 1200×750 |
| `jock` | Currently uses the same "three guys in dark jackets" image as the Muscle tile | Need a distinct image showing athletic/sports themes. Recommended source: ActiveDuty, GayHoopla, athletic-themed studios. Final dimensions 1200×750 |
| `muscle` | Same duplicate image as Jock | Keep one of the two on Muscle (the duplicate is fine here since Muscle is the higher-priority niche), and source a new one for Jock. Or replace both with cleaner shots |

### Latest Reviews cover images — `public/site-banners/`

| Site slug | Problem | What to source |
|---|---|---|
| `gay-asian-network` | Has "of" watermark stamp in top-left (scraped from another aggregator) | Clean banner from the actual GayAsianNetwork affiliate kit. Final dimensions 1200×750 |
| `athletic-twinks` | Image is noticeably lower resolution / grainier than other tiles | Higher-res version of the same banner if available, or alternative shot from the studio's affiliate materials |
| `family-dick` | Studio logo overpowers the bottom of the image | Acceptable as-is; if a cleaner alt exists in the affiliate kit, swap, but not blocking |

### Top 10 banner images — `public/site-banners/`

These currently render as dark-gradient-with-site-name fallback (the improved fallback from prior sprint). Functional but visibly different from the real-banner rows.

| Site slug | Priority | Source |
|---|---|---|
| `helix-studios` | HIGH — it's #1 on the list | HelixCash affiliate kit, or screenshot from helixstudios.com homepage hero |
| `next-door-twink` | HIGH — it's #2 with "Best Value" badge | Buddy Profits / Gamma affiliate kit |
| `next-door-world` | MEDIUM — #4 | Same network as Next Door Twink |
| `men-com` | MEDIUM — #6 | AdultForce affiliate kit, or Men.com direct |

## Sourcing rules

1. **Never use a screenshot that has another aggregator's UI in it.** If the image has a "CLICK HERE" button, a "VISIT" stamp, or competitor branding, it's contaminated. Reshoot.
2. **Prefer affiliate kit assets over screenshots.** Most affiliate programs provide a `/banners/` or `/creatives/` page with clean assets. Use those — they're legally licensed for affiliate use.
3. **Consistent dimensions:** 1200×750 (16:10) for all niche covers and site banners. Crop on upload if needed.
4. **No text overlays.** The site's own UI adds the niche name and site name. Source images should be pure imagery.
5. **Compression:** Save as JPG at 80% quality. PNG only if the image has transparency (which it shouldn't for these).

## File naming

- Niche covers: `public/niche-covers/{slug}.jpg` (e.g. `daddy.jpg`, `college.jpg`)
- Site banners: `public/site-banners/{slug}.jpg` (e.g. `helix-studios.jpg`)

Match the existing naming convention in those directories — don't introduce a new pattern.

## Verification after replacement

After dropping in new images, run `npm run dev` and check the homepage. Each replaced image should:
- Display at the correct dimensions without distortion
- Have no visible watermarks or competitor branding
- Render at acceptable quality on a Retina display (no visible compression artifacts)

---

# PROMPT 3 — Pre-flight Checklist Before Shipping Prompt 1

Run these checks against the codebase before invoking Prompt 1, so Claude Code has clean ground to work from:

1. **Confirm the hero component path.** Open `src/pages/Index.tsx` and identify which component renders the H1 "Independent reviews of 62 gay porn sites." If it's inline JSX in `Index.tsx`, the changes happen there. If it's a `<Hero />` component import, the changes happen in that component. Note the path before starting.

2. **Confirm the site data schema.** Check `src/data/sites.ts` (or wherever the site list lives) for the field names: is it `bannerImage` or `banner_image` or `cover` or `image`? Is it `overallScore` or `overall_score` or `score`? Use the actual field names in the helper function, not the ones in this spec.

3. **Confirm the gold button component.** The Top 10 Visit button and the hero "Browse all 62 sites" button must look identical. Find the existing gold button (likely a `<Button variant="primary">` or a CSS class like `.btn-gold` or `.button-primary`) and reuse it. Don't create a new button variant.

4. **Confirm the page-wrap max-width.** The hero should respect the same max-width as the rest of the homepage (1280px per spec). Check what value `Index.tsx` uses on its outer wrapper and match it.

5. **Confirm whether Top 10 and Latest Reviews live in the same file.** If `Index.tsx` imports `<TopTen />` and `<LatestReviews />` as separate components, the section-padding fix happens in those components. If they're inline, it happens in `Index.tsx`. Identify before starting so the spacing fix lands in the right place.

If any of the above turn up something inconsistent with this spec (e.g., the gold button doesn't exist, the schema field names are wildly different), pause and flag before proceeding — don't guess.
