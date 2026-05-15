# Missing site banners

23 sites currently have no hero image and fall back to a letter-initial
watermark on cards. This file is the prioritized work queue for sourcing
sanctioned creative from each affiliate dashboard.

When you have a banner:

1. Drop it in `public/site-banners/<slug>-hero.jpg` (or `.gif`).
2. Wire it up in `src/data/site-imagery.ts` — set `hero_image_url` to
   `"/site-banners/<slug>-hero.jpg"` for the slug.
3. If the site is missing entirely from `site-imagery.ts`, add a full
   record (use existing entries as a template — keep `banner_alt` SFW).

Aspect ratio target: ~16:9 (cards crop to 3:2, review-page banner shows
the full 16:9). Use the affiliate dashboard's official wide banners —
never scrape member-area screenshots.

## Priority queue (by overall_score)

| Slug | Site | Score | Network | Source | Priority |
|---|---|---|---|---|---|
| helix-studios | Helix Studios | 4.8 | (no affiliate) | helixstudios.com | 🔥 P0 — Rank #1, featured everywhere |
| next-door-twink | Next Door Twink | 4.6 | (no affiliate) | nextdoortwink.com | 🔥 P0 — Rank #2 |
| next-door-world | Next Door World | 4.5 | (no affiliate) | asgmax.com | 🔥 P0 — Rank #3 |
| sean-cody | Sean Cody | 4.4 | AdultForce | seancody.com | 🔴 P1 — affiliate active |
| men | Men.com | 4.4 | AdultForce | men.com | 🔴 P1 — affiliate active |
| twinkpop | Twinkpop | 4.2 | AdultForce | men.com/twinkpop | 🔴 P1 — affiliate active |
| noirmale | NoirMale | 4.1 | AdultForce | noirmale.com | 🔴 P1 |
| maleaccess | MaleAccess | 4.1 | AdultForce | maleaccess.com | 🔴 P1 |
| spicevidsgay | SpiceVidsGay | 4.0 | AdultForce | spicevidsgay.com | 🟡 P2 |
| icon-male | Icon Male | 4.0 | AdultForce | iconmale.com | 🟡 P2 |
| aussiesdoit | Aussies Do It | 4.0 | zBuckz | aussiesdoit.com | 🟡 P2 |
| wuboyz | WuBoyz | 3.9 | zBuckz | wuboyz.com | 🟡 P2 |
| reality-dudes | Reality Dudes | 3.9 | AdultForce | realitydudes.com | 🟡 P2 |
| hiroyaxxx | HiroyaXXX | 3.9 | zBuckz | hiroyaxxx.com | 🟡 P2 |
| dudesraw | DudesRaw | 3.9 | (no affiliate) | dudesraw.com | 🟡 P2 |
| cumpigmen | Cum Pig Men | 3.9 | zBuckz | cumpigmen.com | 🟡 P2 |
| biempire | BiEmpire | 3.9 | AdultForce | biempire.com | 🟡 P2 |
| gaywire | Gay Wire | 3.8 | AdultForce | gaywire.com | 🟢 P3 |
| barebackrtxxx | Bareback RT XXX | 3.8 | zBuckz | barebackrtxxx.com | 🟢 P3 |
| prideflame | Prideflame | 3.7 | (no affiliate) | prideflame.com | 🟢 P3 |
| black-male-me | Black Male Me | 3.7 | AdultForce | blackmaleme.com | 🟢 P3 |
| guy-selector | Guy Selector | 3.5 | AdultForce | guyselector.com | 🟢 P3 |
| bigstr | BigStr | 3.5 | AdultForce | bigstr.com | 🟢 P3 |

## Where to source

- **AdultForce sites** — dashboard at https://adultforce.com → Creative
  Library after approval. Mostly need landing-page banners (1920×1080 or
  1600×900 ideal).
- **zBuckz sites** — dashboard → Marketing Tools → Banners. Wide banners
  available in 600×500, 728×90, and larger.
- **Helix Studios / NakedSword / Next Door** — these don't have active
  affiliate URLs in `sites.ts` yet (`affiliate_url: null`). If/when an
  affiliate relationship is set up, banners typically come from their
  Press Kit page (publicly available for editorial use).

## Why this matters

Sites without banners show a letter-initial watermark on every card,
which looks unprofessional and reduces click-through vs cards with
real imagery. Phase 3 analytics will let you measure exactly how
much CTR improves once banners are in place — compare
`destination_slug=helix-studios` before/after.
