# Image Guidelines

TwinkVault renders affiliate site banners, niche covers, and blog heros. Source images come from affiliate dashboards, press kits, and stock — quality is uneven. The pipeline enforces consistency.

## Canonical dimensions

| Surface         | Path                  | Dimensions    | Aspect | Max file size |
| --------------- | --------------------- | ------------- | ------ | ------------- |
| Site banner     | `public/site-banners/`| 1200×750 + @2x| 16:10  | 250KB         |
| Niche cover     | `public/niche-covers/`| 1200×750 + @2x| 16:10  | 250KB         |
| Blog hero       | `public/blog/`        | 1600×900 + @2x| 16:9   | 350KB         |

All raster outputs are progressive mozjpeg. Originals preserved under each directory's `_originals/`.

## Pipeline

```
npm run images:audit       # inventory + issue report → docs/image-audit-report.md
npm run images:process     # normalize via sharp → outputs + @2x variants
npm run images:validate    # gate: dimensions, size, aspect
npm run images:check       # audit + validate (CI)
```

## When to use SmartImage

Always. Every `<img>` consumer renders through `src/components/common/SmartImage.tsx`. It:

- Reserves the aspect box (no CLS).
- Falls through to `ImageFallback` (dark gradient + full label text) on missing or errored source — never letter initials.
- Emits `srcset` with `@2x` for retina sources.
- Respects `priority` for above-the-fold (eager + high fetchPriority).

```tsx
<SmartImage
  src={imagery.hero_image_url}
  alt={imagery.banner_alt || `${site.name} preview`}
  aspectRatio="16:10"
  fallbackLabel={site.name}
  priority={false}
  objectPosition="center 20%"
/>
```

## Replacing flagged images

`docs/manual-image-replacements.md` lists images the pipeline declined to crop (extreme aspect, severely low-res, suspected watermark). For each:

1. Pull a clean source from the affiliate dashboard / press kit at ≥ 1200px wide and within 0.5 of the target aspect.
2. Drop it in the same path as the original.
3. Re-run `npm run images:process`.
4. Verify `npm run images:validate` passes.

## Forbidden

- Watermarked affiliate creative (badges, "VISIT US" stamps, competitor URLs).
- Letter-initial placeholders. The fallback is always the full label.
- Inline `<img>` tags outside SmartImage in app code.
