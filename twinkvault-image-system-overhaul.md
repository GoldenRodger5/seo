# TwinkVault — Image System Overhaul

## Context for Claude Code

TwinkVault has an image quality problem that's visible across the entire site, not just the homepage. Images render at inconsistent aspect ratios, some contain competitor watermarks burned into the source, some are duplicated across slots, some are too low-resolution, and component-level handling varies (some surfaces use letter-initial fallbacks, others use dark-gradient fallbacks, others render broken images entirely). For an affiliate review site whose entire moat is editorial credibility, the visual inconsistency reads as unprofessional and undermines trust before a visitor even reads a review.

This is a four-prompt sprint executed in sequence:

1. **Audit** — inventory every image surface and produce a report
2. **Process** — standardize existing images via automated script
3. **Component hardening** — bulletproof rendering so imperfect images still look intentional
4. **Pipeline** — prevent regression by enforcing standards on future uploads

Run them in order. Do not skip the audit — the processing and component work both depend on the report it produces. Each prompt notes what files it expects to touch and what artifacts it should produce.

**Critical principle:** professional appearance ≠ pretending every image is perfect. Professional appearance = handling imperfect images with intentional, consistent fallbacks so the visitor never sees "this is broken." Some current images are unsalvageable (watermarks burned in) — the system must make their absence look as intentional as their presence.

---

# PROMPT 1 — Image Audit & Inventory

## Goal

Produce a complete inventory of every image used on the site, its source path, current dimensions, target dimensions (based on where it renders), and any quality issues. Output a single report file the rest of the sprint will reference.

## Surfaces to audit

Every image surface on the site. Don't assume — grep the codebase. At minimum:

- Homepage hero (if any image surface exists post-simplification sprint)
- Homepage niche grid tiles — `Browse by niche` section
- Homepage Top 10 list — row thumbnails
- Homepage Top 10 — Editor's Pick sidecar (any image)
- Homepage Latest Reviews — 6-card grid covers
- `/reviews` index page — every review card
- `/reviews/{slug}` individual review pages — hero image, any inline images
- `/discounts/{slug}` pages — site banners
- `/compare/{a}-vs-{b}` pages — side-by-side site images
- `/niches/{slug}` category pages — category hero, site cards within
- `/blog` index — post thumbnails
- `/blog/{slug}` — post hero images, inline images
- `/best-deals` — site cards
- Any other surface discovered during grep

## Audit script

Create `scripts/audit-images.ts`. The script must:

1. **Discover image references in code** by grep'ing `src/` for:
   - `import` statements pointing to `/public/` or asset directories
   - JSX `src=` attributes with literal paths
   - Data files (`src/data/sites.ts`, `src/data/niches.ts`, `src/data/blog-posts.ts`, etc.) for any `image`, `bannerImage`, `coverImage`, `thumbnail`, `hero` field
   - CSS `background-image:` declarations
2. **Discover image files on disk** by walking `public/` and identifying every `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
3. **For each image file**, capture:
   - File path
   - File size (KB)
   - Actual dimensions (width × height)
   - Aspect ratio (rounded to 2 decimals)
   - Format
   - Whether it's referenced in code (and if so, where)
4. **For each code reference**, capture:
   - Component file path and line number
   - Container/intended dimensions (best-effort: parse `aspect-ratio`, `w-`/`h-` Tailwind classes, or `width`/`height` props)
   - Field name in data file if applicable
5. **Flag suspicious images** with automated heuristics:
   - **DIMENSION_MISMATCH:** image aspect ratio differs from container aspect ratio by more than 0.2
   - **LOW_RESOLUTION:** image dimensions less than 2× the container's render dimensions (will look pixelated on Retina)
   - **HUGE_FILE:** file size over 500KB (perf concern)
   - **POTENTIAL_DUPLICATE:** identical file hash to another image at a different path
   - **UNREFERENCED:** image file on disk but no code reference (dead asset)
   - **MISSING:** code reference but no file on disk (broken)
   - **NON_STANDARD_FORMAT:** PNG used where JPG would suffice, or unoptimized format

## Output

Write to `docs/image-audit-report.md` with this structure:

```markdown
# Image Audit Report — {date}

## Summary
- Total images on disk: N
- Total code references: N
- Unique image surfaces (components): N
- Issues found: N

## Issues by severity

### Broken (must fix)
- MISSING references (table)
- UNREFERENCED files (table)

### Quality (visible to users)
- DIMENSION_MISMATCH (table with each row: path, source dims, container dims, ratio delta, component)
- LOW_RESOLUTION (table)
- POTENTIAL_DUPLICATE (table)

### Performance
- HUGE_FILE (table)
- NON_STANDARD_FORMAT (table)

## Surface inventory

For each surface, a section with:
- Component path
- Container dimensions / aspect ratio
- All images currently rendered on this surface
- Per-image issues
```

Also write a machine-readable `docs/image-audit.json` with the same data so subsequent scripts can consume it.

## What this audit does NOT do

- Does NOT detect watermarks (impossible reliably; that's manual review in a later step)
- Does NOT judge image content quality / brand fit (also manual)
- Does NOT auto-fix anything (this is read-only; processing happens in Prompt 2)

## Deliverable

`scripts/audit-images.ts`, `docs/image-audit-report.md`, `docs/image-audit.json`. Report back with the headline numbers (total images, total issues, top 3 most common issue types).

---

# PROMPT 2 — Image Processing Pipeline

## Goal

Take the audit output from Prompt 1 and automatically fix what's fixable: aspect ratio mismatches, oversized files, non-standard formats. Surface the unfixable issues so the owner can address them manually with a clear list.

## Files expected to change/create

- `scripts/process-images.ts` — new processing script
- `public/site-banners/` — processed image outputs (originals preserved in `public/site-banners/_originals/` for revert)
- `public/niche-covers/` — same pattern
- `public/blog/` and any other image directories — same pattern
- `docs/image-processing-report.md` — what was changed, what was skipped, why
- `docs/manual-image-replacements.md` — list of images that need owner intervention

## Standardized output dimensions

Establish canonical sizes for each surface. The processing script writes to these:

| Surface | Output dimensions | Aspect | Format | Target file size |
|---|---|---|---|---|
| Site banner (Top 10, Latest Reviews, Review pages, Reviews index) | 1200×750 | 16:10 | JPG, q80 | <150KB |
| Niche cover | 1200×750 | 16:10 | JPG, q80 | <150KB |
| Blog post hero | 1600×900 | 16:9 | JPG, q82 | <200KB |
| Blog post thumbnail | 800×500 | 16:10 | JPG, q80 | <100KB |
| Site logo / small icon | 256×256 | 1:1 | PNG | <30KB |
| Hero promotional image (if any) | 1920×1080 | 16:9 | JPG, q85 | <300KB |

Generate **two outputs per source image** using `sharp`:
- Full-size at canonical dimensions (above)
- 2× retina version at double dimensions, same aspect ratio (suffix `@2x`)

This enables `<picture>` / `srcset` for crisp Retina rendering without bloating mobile bandwidth.

## Processing logic per image

For each image referenced in the audit:

1. **Copy original** to `_originals/` subdirectory before any modification. NEVER overwrite originals.
2. **Determine target surface** from the audit's component mapping. Pick the canonical dimensions from the table above.
3. **Decide crop strategy:**
   - If source aspect ratio is within 0.1 of target → simple resize (no crop)
   - If source aspect is wider than target → crop horizontal center (preserve vertical content)
   - If source aspect is taller than target → crop **top 60%** (NOT center). Reasoning: in adult content imagery, faces and upper body are typically in the top portion; centering often crops out faces.
   - If source is dramatically off (e.g., a 5:1 banner being forced into 16:10) → **DO NOT PROCESS**. Add to manual replacement list. Forcing this crop produces garbage.
4. **Resize and compress** using sharp:
   - Use `fit: 'cover'` with the chosen crop strategy
   - Use `withMetadata(false)` to strip EXIF
   - JPG quality per the table above
   - Progressive JPG enabled
5. **Output to canonical path** and `@2x` variant
6. **Compare output file size** to target. If output exceeds target by >50%, reduce quality by 5 increments and retry until either size target met or quality drops below 70 (then ship at q70 and flag as `LARGE_FILE_UNAVOIDABLE`).
7. **Hash output** and write to a processing manifest so subsequent runs can skip unchanged images.

## What goes to manual replacement list

The script CANNOT fix and MUST flag:
- Images with detected watermarks (use a simple heuristic: detect uniform-color circles or rectangles with text-like edge density in the image — this will have false positives, that's fine, manual review filters them)
- Images flagged `POTENTIAL_DUPLICATE` from audit (need different source images)
- Images flagged `LOW_RESOLUTION` where source is below 1.5× target (upscaling produces visible artifacts; don't even try)
- Images with extreme aspect mismatch (>0.5 delta) — would be destroyed by cropping
- Images where the processing script detected a face in the cropped-out region (using a basic face detection library like `face-api.js` or similar; flag for owner review)

Write `docs/manual-image-replacements.md` with:

```markdown
# Manual Image Replacements Needed

## Critical (page-breaking)
[images with missing references]

## Visible quality (user-facing)
[watermarked, dupes, severe low-res]

## Per-image checklist
For each image needing replacement:
- Current path: ...
- Issue: ...
- Where it renders: ...
- Recommended source: studio press kit / affiliate dashboard / direct screenshot
- Required dimensions: 1200×750 (will be processed to multiple sizes automatically)
- Required format: JPG, no watermarks, no competitor branding
```

## Watermark detection caveat

True watermark detection is hard. Use a conservative heuristic that flags candidates rather than auto-rejects:

```ts
// Heuristic: detect high-contrast text-like regions or saturated geometric shapes
// covering >5% of image area in atypical positions (corners, center-overlay)
// This will produce false positives. Review is manual.
```

False positives are fine — manual review is the gate. False negatives are not (don't ship a watermarked image because the detector missed it). When in doubt, flag.

## Pipeline integration

Wire the script into the build:
- Add `npm run images:audit` (runs Prompt 1's script)
- Add `npm run images:process` (runs this script; reads audit output)
- Add `npm run images:check` to CI — runs audit, fails build if any `MISSING` or `LARGE_FILE_UNAVOIDABLE` issues exist
- Do NOT run `images:process` in CI — it's a one-time per-image-change operation, not a build step

## Critical: preserve git history

The originals MUST be committed to `_originals/` before processing. If the owner needs to revert, they pull from there. Add `_originals/` to a clear `.gitkeep` pattern so it's clear those files are intentional, not artifacts.

## Deliverable

Processed images, processing report, manual replacement list. Report back with: total images processed, total flagged for manual replacement, breakdown by issue type, and confirmation that originals are preserved.

---

# PROMPT 3 — Component Hardening

## Goal

Every component that renders an image must handle the full range of cases gracefully: image present and high quality, image present but loading, image missing, image errored on load, image with wrong dimensions. The goal is that a visitor never sees a broken image, a stretched image, a single-letter placeholder that looks abandoned, or two different fallback styles on the same page.

## Files expected to change

This depends on the audit. At minimum:
- A single new component `src/components/common/SmartImage.tsx` that becomes the only way images are rendered on the site
- Every component currently rendering `<img>` directly is refactored to use `SmartImage`
- `src/components/common/ImageFallback.tsx` for the unified fallback treatment

## The unified image component

Create `src/components/common/SmartImage.tsx`:

```tsx
interface SmartImageProps {
  src: string;              // path to processed canonical image
  alt: string;              // required, never optional
  aspectRatio: '16:10' | '16:9' | '4:5' | '1:1';  // explicit, no defaults
  sizes?: string;           // for responsive srcset
  priority?: boolean;       // true for above-fold images, disables lazy loading
  fallbackLabel?: string;   // text shown if image fails — e.g., site name
  className?: string;
}
```

Behavior:

1. **Always render in an aspect-ratio container.** Never let the image's intrinsic dimensions affect layout. Use CSS `aspect-ratio` property on the wrapper.
2. **Generate `srcset` automatically** from the path: if `src` is `/site-banners/helix.jpg`, also reference `/site-banners/helix@2x.jpg` for high-DPI displays.
3. **Loading state:** show a subtle pulse/shimmer on the container until the image loads. Background color: `rgba(255,255,255,0.04)`. Don't show spinners — they look amateur.
4. **Error state (image fails to load):** render the `ImageFallback` component with `fallbackLabel`.
5. **Lazy load by default**, eager-load when `priority={true}`. Use native `loading="lazy"` and `decoding="async"`.
6. **Object-fit cover** always. Never `contain` (causes letterboxing) or default (causes stretching).
7. **Set explicit `width` and `height` attributes** based on canonical dimensions for the aspect ratio — prevents CLS (cumulative layout shift) during load.

## The unified fallback component

Create `src/components/common/ImageFallback.tsx`:

This replaces both the letter-initial fallback AND the dark-gradient fallback currently in use. Pick **one** treatment and use it everywhere:

```tsx
interface ImageFallbackProps {
  label: string;           // site name, niche name, etc.
  aspectRatio: '16:10' | '16:9' | '4:5' | '1:1';
}
```

Visual treatment (single canonical approach):
- Dark muted background — gradient from `hsl(240, 15%, 8%)` top-left to `hsl(240, 15%, 4%)` bottom-right (very subtle, looks intentional not empty)
- Centered text: the `label` in serif font, ~16-20px (scales with container), color `hsl(240, 10%, 60%)` (muted but readable)
- A small accent — 2px gold dot or short line above the text — so it doesn't look like a missing image but like an intentional minimalist treatment
- **NEVER use single-letter initials** ("H" for Helix, "N" for Next Door). These signal "MVP placeholder." Always use the full label.
- **NEVER use the deprecated SitePlaceholderImage component** that's still in use on `/reviews` cards and Latest Reviews per the prior mobile audit. Replace those call sites with SmartImage + ImageFallback.

## Migration checklist

For each component currently rendering an image:

- [ ] Replace `<img>` with `<SmartImage>`
- [ ] Pass explicit `aspectRatio` prop (no defaults — every consumer is explicit)
- [ ] Pass explicit `alt` text (no empty alts; for decorative images, use `alt=""` but it must be intentional)
- [ ] Pass `priority={true}` for above-fold images on the homepage (hero, first row of niche grid, Top 10 row #1)
- [ ] Set `fallbackLabel` to the site/niche/post name
- [ ] Remove any legacy placeholder component imports
- [ ] Verify the container is no longer relying on the image's intrinsic dimensions for layout

Components in scope (verify against audit output):
- `Hero.tsx` (if it still has images post-simplification sprint)
- `NicheGrid.tsx` / niche tile component
- `TopTen.tsx` / top-10 row component
- `EditorPickSidecar.tsx`
- `LatestReviews.tsx` / latest review card
- `ReviewsIndex.tsx` / review card
- `ReviewPage.tsx`
- `DiscountPage.tsx`
- `ComparePage.tsx`
- `NicheCategoryPage.tsx`
- `BlogIndex.tsx`
- `BlogPost.tsx`
- `BestDeals.tsx`
- Any others in the audit

## Accessibility requirements

- Every `<SmartImage>` requires non-empty `alt` for content images
- Decorative images use `alt=""` (empty string, not omitted)
- Loading state has `aria-busy="true"` on the wrapper
- Error state has `role="img"` and the fallback label is announced

## Performance requirements

- Above-fold images: `priority={true}` + `fetchpriority="high"`
- Below-fold images: lazy load default
- Use `<picture>` with WebP sources if the audit shows JPG dominance — modern browsers get WebP, legacy gets JPG fallback
- Total image weight on homepage initial load should drop after this work — measure before/after

## Mobile behavior

- Same component, same props
- Containers reflow at mobile breakpoints but aspect ratio is preserved
- Loading state animates the same on mobile (the shimmer respects `prefers-reduced-motion: reduce` and disables animation)

## Out of scope

- Adding new images (that's content work in Prompt 2's manual list)
- Changing the layout/grid structure of any section (the previous sprints handled that)
- CDN integration (that's Prompt 4)

## Deliverable

`SmartImage.tsx`, `ImageFallback.tsx`, every consumer migrated, audit-driven checklist with all items checked. Report back with: list of components migrated, any consumer that had non-trivial migration (e.g., a component that was using image dimensions for layout), and screenshots of every fallback state (image loading, image errored, image missing) on desktop AND mobile.

---

# PROMPT 4 — Pipeline & Prevention

## Goal

Prevent regression. The previous three prompts fix the current state; this prompt ensures the next image added to the site enters the pipeline correctly. Without this, the audit findings will recur within months.

## Files expected to change/create

- `scripts/validate-image.ts` — pre-commit / pre-push validator for any image added to the repo
- `.husky/pre-commit` (or equivalent) — wire up the validator
- `CONTRIBUTING.md` or `docs/image-guidelines.md` — written standards
- `package.json` — new scripts
- `.github/workflows/image-check.yml` (or equivalent CI) — block PRs that introduce non-compliant images
- A new admin tool (optional, see below): `src/pages/admin/ImageUploader.tsx`

## The validator

`scripts/validate-image.ts` runs on any new image being committed:

1. **Format check:** must be JPG, WebP, or PNG (no GIF, no BMP, no TIFF, no HEIC)
2. **Dimension check:** must match one of the canonical sizes from Prompt 2's table (or 2×, 3× variants)
3. **File size check:** must be under target file size for its surface
4. **Aspect ratio check:** must match canonical aspect for the directory it's placed in (`/niche-covers/` → 16:10, `/blog/` → 16:9, etc.)
5. **Filename check:** lowercase, hyphens (not spaces or underscores), descriptive (not `IMG_1234.jpg` or `screenshot.png`)
6. **Watermark heuristic:** same conservative detector from Prompt 2 — flag (don't auto-reject) candidates for human review
7. **Duplicate check:** hash against existing images in the repo; warn if identical
8. **EXIF check:** must be stripped (no GPS data, no camera info — privacy)

Failure modes:
- Hard fails (format, dimensions, size, EXIF) → block commit
- Soft fails (watermark suspicion, duplicate suspicion) → require explicit `git commit --no-verify` and log to a review queue

## Pre-commit integration

Wire via Husky or simple git hook:
```bash
#!/bin/sh
# .husky/pre-commit
npx tsx scripts/validate-image.ts $(git diff --cached --name-only --diff-filter=A | grep -E '\.(jpg|jpeg|png|webp)$')
```

If validation fails, commit is blocked with a clear error message pointing to `docs/image-guidelines.md`.

## CI enforcement

Add `.github/workflows/image-check.yml`:
- Runs on every PR
- Executes `npm run images:audit` and fails if any `MISSING`, `DIMENSION_MISMATCH`, or `LOW_RESOLUTION` issues exist in changed files
- Posts a comment on the PR with the audit report excerpt for any new issues

## Image guidelines document

`docs/image-guidelines.md`:

```markdown
# TwinkVault Image Guidelines

## Where images go
- Site banners → `public/site-banners/{slug}.jpg`
- Niche covers → `public/niche-covers/{slug}.jpg`
- Blog posts → `public/blog/{slug}.jpg` (hero) + `public/blog/{slug}-thumb.jpg` (thumbnail)
- ...

## Required specs
[the canonical table from Prompt 2]

## What's prohibited
- Watermarks of any kind (competitor logos, "CLICK HERE" stamps, affiliate network branding)
- Personal photos of real people (consent + legal)
- Images scraped from other affiliate aggregator sites (signals 'aggregator' not 'editorial')
- Letter-initial placeholders (use SmartImage fallback, never single letters)
- HEIC or other formats not in the validator allowlist

## Sourcing
1. Studio press kits — preferred
2. Affiliate dashboard creative libraries — preferred  
3. Direct studio website hero screenshots — acceptable if cropped clean
4. Stock or AI-generated imagery — last resort, must match site aesthetic

## Processing
Drop the source into the appropriate directory and run `npm run images:process`. The pipeline handles resizing, format conversion, srcset generation, and validation.

## Approval flow
- Routine images (site banners, niche covers): no approval needed, just pass validation
- Hero / homepage above-fold images: visual review before merging
- Blog post heros: visual review

## Don't
- Don't bypass the validator with `--no-verify` without filing a manual review entry
- Don't commit images larger than the size limits; the build will fail in CI
- Don't add images to surfaces not in the canonical surface list — extend the list with a code change first
```

## Optional: admin image uploader

If the owner wants a UI flow (not strictly required):

`src/pages/admin/ImageUploader.tsx`:
- Drag-and-drop image upload
- Live preview of how it'll look in each surface at its target aspect
- Runs validation client-side before submit
- On submit, generates the canonical + @2x variants and writes to the appropriate directory
- Requires admin auth (existing `RequireAdmin` wrapper)

This is a nice-to-have. Ship Prompts 1-4 first; build this only if image-adding remains a pain point.

## Out of scope

- Migrating to a CDN (Cloudinary, ImageKit) — separate decision, has cost implications
- AI-generated alt text — manually written alts are higher quality for adult content where models hedge
- A/B testing different image treatments per surface — not yet, ship the baseline first

## Deliverable

Validator script, pre-commit hook, CI workflow, guidelines doc. Report back with: example of validator catching a non-compliant image, example of a CI run blocking a PR, and confirmation that all four prompts' scripts are wired into `package.json` as discoverable commands (`images:audit`, `images:process`, `images:validate`, `images:check`).

---

# Execution order & timing

1. **Prompt 1 (Audit)** — run first, alone. The report drives every subsequent decision. ~30 min of Claude Code time.
2. **Review the audit report manually.** Spend 15-20 min reading it. Identify:
   - Surprising findings (an image you didn't know was being used somewhere)
   - Wrong canonical sizes (if any surface has a different intended aspect than the table assumes)
   - Components that surfaced you'd forgotten
3. **Adjust Prompt 2's canonical size table** based on findings, then run Prompt 2.
4. **Manually review the `manual-image-replacements.md` output.** Each flagged image is either: genuinely needs replacement, or false positive (clear the flag). Replace the genuine ones over the next few days as you find clean source material — don't block the rest of the sprint on this.
5. **Run Prompt 3 (Component Hardening).** This is the biggest code change. Expect Claude Code to take 60+ minutes and possibly need clarification mid-stream on specific consumer migrations.
6. **Visual QA after Prompt 3.** Walk every surface on desktop and mobile. Confirm fallbacks render consistently. Confirm no regression on the surfaces that were already working.
7. **Run Prompt 4 (Pipeline).** This is the smallest prompt but the most important for long-term hygiene. Don't skip it.

# What success looks like

- Every image surface on the site uses `SmartImage`
- Every fallback is the same unified treatment — no letter initials anywhere
- Every image on disk has been through the processing pipeline (or is flagged for manual replacement)
- A new image added to the repo is automatically validated for size, format, dimensions, and watermark suspicion before it can be committed
- The `docs/image-audit-report.md` shows zero `MISSING`, `DIMENSION_MISMATCH`, or `LOW_RESOLUTION` issues after the sprint
- Visitor experience: every image either looks intentional and clean, or has a fallback that looks intentional and clean. No broken images. No competitor watermarks. No duplicate images across different slots.

# What success does NOT look like

- Every image is perfect (impossible without commissioning custom photography)
- The pipeline catches all watermarks automatically (heuristic only)
- The site looks like the competitor's image-dense aggregator pages (intentionally different — editorial restraint is the moat)
