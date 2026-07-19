# Image Sourcing Plan — cards & banners from affiliate creative libraries

Generated 2026-07-19. The problem: 39/71 site "heroes" are ad-unit banners
(970×250 billboards, 970×90 leaderboards) force-cropped into 16:10 slots, 32 sites
have no imagery at all, and 0 sites have dedicated card art. This doc is the
research base for a Claude Cowork run (browser control) that logs into each
program, navigates to the creatives/photos area, and downloads correctly sized
source images.

## Target spec (what the pipeline needs)

The build pipeline (`npm run images:process`, sharp) standardizes everything to:
- **Hero/banner**: 1200×750 (16:10) + @2x retina 2400×1500, WebP q80, ≤150KB
- **Guide/wide hero**: 1600×900 (16:9) + @2x
- Cards reuse the hero at smaller renditions — ONE good source serves every slot.

Therefore each downloaded source image must be:
- **≥1200px wide (2400px preferred for retina)**
- **Aspect between ~3:2 and ~21:9** — photos, site covers, or large promo panels.
  NEVER leaderboards/skyscrapers (970×90, 160×600) — they cannot crop to 16:10.
- SFW-leaning composition preferred where a choice exists (Google image policy —
  see docs/image-guidelines.md); explicit is acceptable if that is all a program offers.
- Format: JPG/PNG originals (pipeline converts to WebP). No animated GIFs.

## Where to look inside each dashboard
Affiliate dashboards label usable assets differently. In priority order:
1. "Site Covers" / "Promo Art" / "Featured Images" (rare, best)
2. **Largest static banners** — 1920×500 / 2000×800 class panels crop fine
3. **Hosted galleries / FHG / Photo sets** — pick 1-2 strong landscape stills
4. Content feeds / screenshots sections

## Naming + drop-off convention
- Save as `{site-slug}-hero.jpg` (primary 16:10-croppable) and optionally
  `{site-slug}-card.jpg` (alternate art if the program offers distinct cover art)
- Slugs are EXACTLY as listed in the tables below (match sites.ts).
- Drop into `public/source-creative/{program-folder}/` — the repo pipeline
  (`npm run images:check` → `npm run images:process`) takes it from there.

## Programs, logins, and per-site current state

### WoofCash / MyGayCash
- Dashboard: https://www.mygaycash.com  ·  username: TwinkVault26
- Notes: prideflame is also this network per our records but has no affiliate link in our data — grab its linking code + creatives while in the dashboard.

| site slug | current hero | action |
| --- | --- | --- |
| twinks-in-shorts | 1200×250 ✗ ad-unit strip | **replace (strip)** |
| athletic-twinks | 900×150 ✗ ad-unit strip | **replace (strip)** |
| southern-strokes | 1920×500 ✗ ad-unit strip | **replace (strip)** |
| daddy-on-twink | 950×200 ✗ ad-unit strip | **replace (strip)** |
| touch-that-boy | 900×150 ✗ ad-unit strip | **replace (strip)** |
| breed-me-raw | 1920×500 ✗ ad-unit strip | **replace (strip)** |
| bareback-that-hole | 1920×500 ✗ ad-unit strip | **replace (strip)** |
| hard-brit-lads | 1920×500 ✗ ad-unit strip | **replace (strip)** |
| barebackcumpigs | 984×170 ✗ ad-unit strip | **replace (strip)** |
| bearchubs | 900×150 ✗ ad-unit strip | **replace (strip)** |
| bearfilms | 1920×500 ✗ ad-unit strip | **replace (strip)** |
| hairyandraw | 1920×500 ✗ ad-unit strip | **replace (strip)** |

### ChargedCash
- Dashboard: https://www.chargedcash.com

| site slug | current hero | action |
| --- | --- | --- |
| twinktrade | 970×90 ✗ ad-unit strip | **replace (strip)** |
| dadcreep | 900×250 ✗ ad-unit strip | **replace (strip)** |
| brothercrush | 900×250 ✗ ad-unit strip | **replace (strip)** |
| familydick | 900×250 ✗ ad-unit strip | **replace (strip)** |
| sayuncle | 900×250 ✗ ad-unit strip | **replace (strip)** |
| boysatcamp | 900×250 ✗ ad-unit strip | **replace (strip)** |
| missionaryboys | 900×250 ✗ ad-unit strip | **replace (strip)** |
| militarydick | 600×350 ✗ ad-unit strip | **replace (strip)** |
| latinleche | 900×250 ✗ ad-unit strip | **replace (strip)** |
| yesfather | 900×250 ✗ ad-unit strip | **replace (strip)** |
| bullyhim | 970×90 ✗ ad-unit strip | **replace (strip)** |
| youngperps | 900×250 ✗ ad-unit strip | **replace (strip)** |

### zBuckz / WebMediaProz
- Dashboard: https://www.zbuckz.com  ·  username: TwinkVault23
- Notes: Last run: 6 sites (dudesraw, hiroyaxxx, wuboyz, barebackrtxxx, cumpigmen, aussiesdoit) had ZERO banners in the dashboard — for these, pull stills from Hosted Galleries / FHG or Content Feeds instead.

| site slug | current hero | action |
| --- | --- | --- |
| rawhole | 1600×240 ✗ ad-unit strip | **replace (strip)** |
| peterfever | 1323×270 ✗ ad-unit strip | **replace (strip)** |
| gayasiannetwork | 1130×69 ✗ ad-unit strip | **replace (strip)** |
| alternadudes | 970×250 ✗ ad-unit strip | **replace (strip)** |
| dirtyboyvideo | 970×90 ✗ ad-unit strip | **replace (strip)** |
| japanboyz | 1323×270 ✗ ad-unit strip | **replace (strip)** |
| sexjapantv | 1130×69 ✗ ad-unit strip | **replace (strip)** |
| yoshikawasakixxx | 970×90 ✗ ad-unit strip | **replace (strip)** |
| realmenfuck | 1000×150 ✗ ad-unit strip | **replace (strip)** |
| swinginballs | 970×250 ✗ ad-unit strip | **replace (strip)** |
| squirtstudios | 2000×300 ✗ ad-unit strip | **replace (strip)** |
| dudesraw | MISSING | **source new** |
| hiroyaxxx | MISSING | **source new** |
| wuboyz | MISSING | **source new** |
| barebackrtxxx | MISSING | **source new** |
| cumpigmen | MISSING | **source new** |
| aussiesdoit | MISSING | **source new** |

### NakedSword Cash
- Dashboard: https://nakedswordcash.com  ·  username: TwinkVault26
- Notes: Already have 2000×800 and 2000×500 heroes — GOOD size. Only grab additional card-friendly photo art if easy.

| site slug | current hero | action |
| --- | --- | --- |
| nakedsword | 2000×800 ✓ usable | keep / optional upgrade |
| trailertrashboys | 2000×500 ✗ ad-unit strip | **replace (strip)** |

### XXXRewards
- Dashboard: https://www.xxxrewards.com
- Notes: jawked only had an animated GIF banner last run — grab gallery stills instead.

| site slug | current hero | action |
| --- | --- | --- |
| boyfun | 980×170 ✗ ad-unit strip | **replace (strip)** |
| jawked | 970×170 ✗ ad-unit strip | **replace (strip)** |

### Adult Empire Cash
- Dashboard: https://www.adultempirecash.com
- Notes: Fresh account (July 2026).

| site slug | current hero | action |
| --- | --- | --- |
| tla-gay-unlimited | MISSING | **source new** |

### VisionX (program portal TBC by owner)
- Dashboard: https://www.visionxflix.com
- Notes: Owner has partner ID 45202227; confirm where the affiliate creatives dashboard lives.

| site slug | current hero | action |
| --- | --- | --- |
| visionx-flix | MISSING | **source new** |

### AdultForce (owner to confirm creatives access)
- Dashboard: https://www.adultforce.com
- Notes: The landing.* tracking domains in our data match AdultForce offer landers. Confirm which of these have creative libraries in the dashboard.

| site slug | current hero | action |
| --- | --- | --- |
| men | MISSING | **source new** |
| sean-cody | MISSING | **source new** |
| gaywire | MISSING | **source new** |
| biempire | MISSING | **source new** |
| twinkpop | MISSING | **source new** |
| reality-dudes | MISSING | **source new** |
| bigstr | MISSING | **source new** |
| black-male-me | MISSING | **source new** |
| noirmale | MISSING | **source new** |
| guy-selector | MISSING | **source new** |
| spicevidsgay | MISSING | **source new** |
| maleaccess | MISSING | **source new** |

### HelixCash (dormant — skip)
- Dashboard: https://www.helixcash.com
- Notes: Program unreachable since May. Source from the public tour page screenshots if needed.

| site slug | current hero | action |
| --- | --- | --- |
| helix-studios | MISSING | **source new** |

### Buddy Profits / Gamma (unresponsive — skip)
- Dashboard: https://www.gammastats.com
- Notes: Only if the account ever activates.

| site slug | current hero | action |
| --- | --- | --- |
| icon-male | MISSING | **source new** |

## Priority order for the Cowork run
1. **ChargedCash** — 12 monetized sites incl. every demand-review page we just got indexed
2. **WoofCash/MyGayCash** — 12 sites, all strips today
3. **zBuckz** — 17 sites (11 replace + 6 gallery-only)
4. **XXXRewards, Adult Empire Cash, VisionX** — small accounts, quick wins
5. **AdultForce** — confirm creative access first

Skip: HelixCash (dormant), Gamma (unresponsive).
