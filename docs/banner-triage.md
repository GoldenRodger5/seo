# Banner Triage — Featured Affiliate Banner System

Source pool: 38 EXTREME_ASPECT banners flagged by `scripts/process-images.ts` and excluded from card slots. Repurposed here as horizontal promotional placements.

## Eligibility against affiliate status

Blocked brands (per owner spec):
- **Buddy Profits / Gamma** — Next Door Twink, Next Door World
- **HelixCash** — Helix Studios

None of the 38 banners come from blocked brands. Every banner below is `ELIGIBLE`.

| Status            | Count |
| ----------------- | ----- |
| ELIGIBLE          | 38    |
| BLOCKED_PENDING   | 0     |
| UNKNOWN_BRAND     | 0     |

## Aspect-class buckets

| Class          | Range    | Use                                            | Count |
| -------------- | -------- | ---------------------------------------------- | ----- |
| half-banner    | 3:1–5:1  | Primary placement (best legibility on mobile)  | 22    |
| leaderboard    | 5:1–8:1  | Placement, but auto-hidden if ratio >6:1 mobile | 10    |
| skyscraper     | >8:1     | Pool only — excluded from desktop placement    | 6     |

## Per-banner table

| File                                    | Brand                | Status   | Quality | Aspect | Class       |
| --------------------------------------- | -------------------- | -------- | ------- | ------ | ----------- |
| bareback-that-hole-hero.jpg             | Bareback That Hole   | ELIGIBLE | 5       | 3.84   | half-banner |
| bear-films-hero.jpg                     | Bear Films           | ELIGIBLE | 5       | 3.84   | half-banner |
| breed-me-raw-hero.jpg                   | Breed Me Raw         | ELIGIBLE | 5       | 3.84   | half-banner |
| hairy-and-raw-hero.jpg                  | Hairy and Raw        | ELIGIBLE | 5       | 3.84   | half-banner |
| hard-brit-lads-hero.jpg                 | Hard Brit Lads       | ELIGIBLE | 5       | 3.84   | half-banner |
| southern-strokes-hero.jpg               | Southern Strokes     | ELIGIBLE | 5       | 3.84   | half-banner |
| trailer-trash-boys-hero.jpg             | Trailer Trash Boys   | ELIGIBLE | 4       | 4.00   | half-banner |
| nakedsword-hero.jpg                     | NakedSword           | ELIGIBLE | 4       | 2.50   | half-banner |
| boys-at-camp-hero.jpg                   | Boys at Camp         | ELIGIBLE | 4       | 3.60   | half-banner |
| brother-crush-hero.jpg                  | Brother Crush        | ELIGIBLE | 4       | 3.60   | half-banner |
| dad-creep-hero.jpg                      | Dad Creep            | ELIGIBLE | 4       | 3.60   | half-banner |
| family-dick-hero.jpg                    | Family Dick          | ELIGIBLE | 4       | 3.60   | half-banner |
| latin-leche-hero.jpg                    | Latin Leche          | ELIGIBLE | 4       | 3.60   | half-banner |
| missionary-boys-hero.jpg                | Missionary Boys      | ELIGIBLE | 4       | 3.60   | half-banner |
| say-uncle-hero.jpg                      | Say Uncle            | ELIGIBLE | 4       | 3.60   | half-banner |
| yes-father-hero.jpg                     | Yes Father           | ELIGIBLE | 4       | 3.60   | half-banner |
| young-perps-hero.jpg                    | Young Perps          | ELIGIBLE | 4       | 3.60   | half-banner |
| daddy-on-twink-hero.jpg                 | Daddy on Twink       | ELIGIBLE | 4       | 4.75   | half-banner |
| twinks-in-shorts-hero.jpg               | Twinks in Shorts     | ELIGIBLE | 4       | 4.80   | half-banner |
| japanboyz-hero.jpg                      | Japanboyz            | ELIGIBLE | 4       | 4.90   | half-banner |
| peterfever-hero.jpg                     | PeterFever           | ELIGIBLE | 4       | 4.90   | half-banner |
| alternadudes-hero.jpg                   | AlternaDudes         | ELIGIBLE | 3       | 3.88   | half-banner |
| swingin-balls-hero.jpg                  | Swingin Balls        | ELIGIBLE | 3       | 3.88   | half-banner |
| rawhole-hero.jpg                        | RawHole              | ELIGIBLE | 4       | 6.67   | leaderboard |
| squirt-studios-hero.jpg                 | Squirt Studios       | ELIGIBLE | 4       | 6.67   | leaderboard |
| boyfun-hero.jpg                         | BoyFun               | ELIGIBLE | 3       | 5.76   | leaderboard |
| bareback-cum-pigs-hero.jpg              | Bareback Cum Pigs    | ELIGIBLE | 3       | 5.79   | leaderboard |
| athletic-twinks-hero.jpg                | Athletic Twinks      | ELIGIBLE | 3       | 6.00   | leaderboard |
| bear-chubs-hero.jpg                     | Bear Chubs           | ELIGIBLE | 3       | 6.00   | leaderboard |
| touch-that-boy-hero.jpg                 | Touch That Boy       | ELIGIBLE | 3       | 6.00   | leaderboard |
| real-men-fuck-hero.jpg                  | Real Men Fuck        | ELIGIBLE | 3       | 6.67   | leaderboard |
| bully-him-hero.jpg                      | Bully Him            | ELIGIBLE | 2       | 10.78  | skyscraper  |
| dirty-boy-video-hero.jpg                | DirtyBoyVideo        | ELIGIBLE | 2       | 10.78  | skyscraper  |
| twinktrade-hero.jpg                     | TwinkTrade           | ELIGIBLE | 2       | 10.78  | skyscraper  |
| yoshi-kawasaki-xxx-hero.jpg             | Yoshi Kawasaki XXX   | ELIGIBLE | 2       | 10.78  | skyscraper  |
| gay-asian-network-hero.jpg              | GayAsianNetwork      | ELIGIBLE | 1       | 16.38  | skyscraper  |
| sexjapantv-hero.jpg                     | SexJapanTV           | ELIGIBLE | 1       | 16.38  | skyscraper  |

## Top 10 placement candidates (by quality + aspect fit)

These are the banners `pickBanner()` will rotate through on the homepage and other primary surfaces:

1. **Bareback That Hole** — 1920×500, 3.84:1 (clean 1920-wide composition)
2. **Bear Films** — 1920×500, 3.84:1
3. **Breed Me Raw** — 1920×500, 3.84:1
4. **Hairy and Raw** — 1920×500, 3.84:1
5. **Hard Brit Lads** — 1920×500, 3.84:1
6. **Southern Strokes** — 1920×500, 3.84:1
7. **NakedSword** — 2000×800, 2.5:1 (more card-like; high resolution)
8. **Trailer Trash Boys** — 2000×500, 4.0:1
9. **Squirt Studios** — 2000×300, 6.67:1 (leaderboard but high-res)
10. **RawHole** — 1600×240, 6.67:1

## UNKNOWN_BRAND list

None. All 38 banners map cleanly to a `sites.ts` entry via filename slug.

## Notes

- **Skyscrapers (>8:1)** are kept in the pool for documentation but `placeableBanners` excludes them. They're too thin for legible promotion at any viewport size; if owner wants to surface them as a "logo strip" later, that's a different component.
- **`military-dick-hero.jpg`** is *not* in this pool — it was flagged LOW_RES (600×350, aspect 1.71) and is closer to card-shape than banner. It belongs in the card-image replacement queue, not the banner pool.
- Quality scores are heuristic (resolution + aspect proximity to standard leaderboard 5:1). Owner should spot-check the top 10 and downgrade anything that's visually weak.
