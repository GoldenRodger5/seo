# Missing niche cover images

The 9-tile niche grid on the homepage currently reuses representative
site banners (e.g. `twinks-in-shorts-hero.jpg` for the Twink tile) as
cover art. This is a stopgap — dedicated niche cover photography would
produce stronger first-viewport visual identity, since site banners
sometimes don't represent the breadth of a niche.

Mapping in place (`ALL_NICHES` in [src/pages/Index.tsx](src/pages/Index.tsx)):

| Niche | Slug | Site count | Current cover (proxy) | Dedicated needed |
|---|---|---|---|---|
| Twink | `twink` | 41 | `/site-banners/twinks-in-shorts-hero.jpg` | Yes |
| Bareback | `bareback` | 47 | `/site-banners/bareback-that-hole-hero.jpg` | Yes |
| Amateur | `amateur` | 40 | `/site-banners/southern-strokes-hero.jpg` | Yes |
| Muscle | `muscle` | 14 | `/site-banners/athletic-twinks-hero.jpg` | Yes |
| Daddy | `daddy` | 7 | `/site-banners/daddy-on-twink-hero.jpg` | Yes |
| Asian | `asian` | 7 | `/site-banners/peterfever-hero.jpg` | Yes |
| Jock | `jock` | 6 | `/site-banners/athletic-twinks-hero.jpg` (shared with Muscle) | **High priority** — shares with Muscle |
| College | `college` | 5 | `/site-banners/boys-at-camp-hero.jpg` | Yes |
| Bear | `bear` | 4 | `/site-banners/bear-films-hero.jpg` | Yes |

## Action

When dedicated niche art is ready:
1. Drop image at `/public/niche-covers/{slug}.jpg` (suggested path,
   16:10 aspect ratio, ~1200×750)
2. Update the `image` field in `ALL_NICHES` array
   ([src/pages/Index.tsx](src/pages/Index.tsx))
3. Remove this row from the table above

## Fallback rendering

If an image file is missing on the live site (404), the tile still
renders correctly — the dark `bg-muted/40` underneath the `<img>`
shows through and the niche name + hook are layered in normal
foreground text. No single-letter placeholder is ever shown.
