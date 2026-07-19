# Homepage Rebalance Prompt

Paste this into Claude Code. It's a targeted refinement of src/pages/Index.tsx — the editorial restructure shipped in e3af548 went too far on magazine-pacing and under-served the dominant horny-and-decided visitor. This sprint corrects the proportions without abandoning the editorial voice.

---

```
TASK: Rebalance src/pages/Index.tsx (homepage) for visual density. The editorial restructure shipped in e3af548 over-rotated toward magazine-style restraint. The current homepage takes a full desktop viewport for the H1 alone before any visual content appears. This sprint compresses the hero brutally, promotes the niche grid to the position immediately after the hero, and adds cover thumbnails to the Top 10 list so the upper half of the page shows porn-site visual content within the first scroll.

PHILOSOPHY:
TwinkVault serves two visitor types: (1) the horny-decided visitor who wants to scan options visually and click out fast, and (2) the trust-checking visitor who wants editorial credibility before clicking. Both matter. The current homepage over-serves type 2 at the expense of type 1. The fix is NOT to delete the credibility signals — those are the site's competitive moat. The fix is to compress the credibility signal into ~200px of vertical space at the top, then immediately become a visual product page.

The methodology page does the deep trust work. The homepage should do credibility in 3 seconds and then look like a porn affiliate site for the rest of the scroll.

DO NOT REGRESS:
- The headline copy ("Independent reviews of 62 gay porn sites.") — keep the words exactly
- The subhead copy ("Every review is built from a paid membership and scored on the same four-pillar rubric. Updated monthly. No paid placements, ever.") — keep the words
- The Editor's Pick editorial note (NakedSword) — keep the writing
- The Browse by niche editorial intros (Twink/Bareback/Amateur) — keep the writing
- The voice rules (no "actually," "really," "literally," "definitely"; no question-form headers; no emoji icons in section heads; no "2026" in H1)
- The Top 10 list voice and selection logic
- All tracking (cta_position, source_type) wiring
- All existing components — reuse, do not parallel-create

CHANGES IN ORDER:

1. HERO COMPRESSION (the most important change):
   - Reduce vertical padding from py-24/py-36 to py-10/py-12 (or whatever is roughly 1/3 of current).
   - Reduce H1 font size by at least two display steps. On desktop (≥1280px), the headline MUST fit on ONE line. Currently it wraps to three lines because the font size is set for editorial magazine layout, not for a homepage.
   - Reduce subhead font size proportionally.
   - Keep the two text links ("See how we score →" and "Browse all 62 sites →") at their current treatment but tighten vertical margin above them.
   - Total hero section height target: under 300px on desktop. Currently it's roughly the full viewport (~900px). This is a 3x compression.
   - The hero should feel like a tight masthead, not a magazine cover.

2. SECTION REORDER:
   Current order:
   1. Hero
   2. Editor's Pick
   3. The Top 10
   4. Browse by niche
   5. Latest reviews
   6. Utility row (Ask TwinkAI + Quiz)
   7. Manfinder one-liner
   8. Newsletter
   
   NEW order:
   1. Hero (compressed per #1 above)
   2. Browse by niche (PROMOTED — this becomes the first visual content section)
   3. Editor's Pick
   4. The Top 10 (with new thumbnails per #4 below)
   5. Latest reviews
   6. Utility row
   7. Manfinder one-liner
   8. Newsletter
   
   Browse by niche is now the second section on the page. Its cover-image-led cards will be the first porn-site visual content the visitor sees, appearing immediately after the compressed hero.

3. BROWSE BY NICHE TIGHTENING:
   - No copy changes. Keep all editorial intros.
   - Slightly reduce the vertical padding above this section so it sits close to the hero with minimal whitespace gap.
   - On desktop, the visitor should see the niche cards starting in roughly the first viewport, just after the hero, without scrolling far.

4. TOP 10 — ADD COVER THUMBNAILS:
   - Currently each Top 10 row is text-only: rank · name · score · price · category · [Read] [Visit].
   - ADD a small cover thumbnail (roughly 48px square on desktop, 40px on mobile) to the LEFT of each row, positioned between the rank number and the site name.
   - Use the existing site cover image component / logic (whatever serves cover images on /reviews cards). Reuse, do not create a new component.
   - Visual treatment: small, subtle, rounded corners. The thumbnail adds visual texture without converting the list into a card grid.
   - The thumbnail must NOT dominate the row. Rank number and site name remain the primary elements.
   - Mobile: thumbnail stays on the row. Row layout becomes thumbnail (left) + name+score stacked vertically (middle) + action buttons (right). Allow row to wrap action buttons to a second line if needed.

5. OPTIONAL — "HOTTEST THIS MONTH" HORIZONTAL STRIP (only if scoping allows):
   - If implementation time allows, ADD a horizontal-scroll strip between Browse by niche (section 2) and Editor's Pick (section 3).
   - Section eyebrow: "Hottest this month"
   - Pulls 6-8 sites with the highest combined (score + recent traffic) — for now, just sort by overall_score descending and slice [0:8].
   - Each card: cover image (larger than Top 10 thumbnails, roughly 200x150px), site name overlay, score chip in corner, tap-target opens /reviews/{slug}.
   - Horizontal-scroll on mobile (overflow-x-auto with scroll-snap); on desktop, wrap to one row that scrolls if needed.
   - cta_position='hottest-this-month-strip', source_type='homepage_hottest_strip' for any direct outbound clicks (note: these cards link to /reviews/{slug}, not to outbound, so tracking is internal).
   - If implementation time is tight, SKIP this section. The compression + niche reorder + Top 10 thumbnails should be sufficient. The strip is an enhancement, not a requirement.

DO NOT:
- Add the Today's Top Pick framing back (Editor's Pick stays)
- Add "Best Gay Twink Porn Sites 2026" back to the H1 (current H1 stays)
- Add an emoji trust strip back
- Add question-form section headers
- Add new dependencies
- Modify other pages
- Touch the Editor's Pick selection logic (getTopDealPick still drives it)
- Touch the affiliated/unaffiliated handling on Top 10 rows (Helix/NDT/NDW still get Read only)

DELIVERABLES:
- Modified src/pages/Index.tsx with the 4 mandatory changes (hero compression, niche promotion, top 10 thumbnails) plus optional #5
- No new components — reuse existing image/card components for the Top 10 thumbnails and the optional strip
- No new utilities required
- No schema changes to sites.ts

TESTING:
- Build and verify the homepage renders successfully at 1440px, 1280px, 1024px, 768px, 375px
- At 1440x900 (standard desktop viewport): verify the compressed hero AND the start of the Browse by niche section are both visible without scrolling. The visitor should see niche cover images within the first viewport.
- Verify the H1 fits on 1 line at desktop widths, max 2 lines on tablet, max 3 on mobile (375px)
- Verify the section order matches the new sequence (Hero → Niche → Editor's Pick → Top 10 → ...)
- Verify each Top 10 row has a small cover thumbnail to the left of the site name
- Verify mobile Top 10 rows render correctly with thumbnail + stacked text + actions
- Verify all OutboundLink CTAs still emit correct tracking values
- Hard-refresh https://twinkvault.com after Vercel deploy and walk the page top-to-bottom

VOICE RULES (unchanged from prior sprints):
- First-person singular
- No "actually," "really," "literally," "definitely"
- No emoji icons in section heads
- No question-form headers
- No "2026" in H1

WHAT THIS SPRINT IS EXPLICITLY NOT:
- Not a deletion of the hero (the hero stays — it just gets compressed by ~3x)
- Not a return to the old "We Watched So You Don't Have To" headline
- Not a return to the "Today's Top Pick" framing
- Not adding more sections beyond the optional Hottest This Month strip
- Not adding card-grid treatment to the Top 10 (it stays a list, just with small thumbnails)
- Not adding carousels anywhere except the optional Hottest This Month strip

COMMIT MESSAGE TARGET:
"homepage: compress hero, promote niche grid, add top 10 thumbnails"
```

---

## What this prompt is doing strategically

**Hero compression is the primary change.** The current 3-line H1 is the single biggest problem on the page. Cutting padding and font size by ~3x restores normal density without changing the words.

**Niche grid promotion is the second-biggest change.** Moving Browse by niche from #4 to #2 puts cover-image-led content in the first viewport on most screens. This is the change that satisfies your "show porn sites earlier" instinct without breaking the credibility signal.

**Top 10 thumbnails add visual density to the upper-middle of the page.** A list with thumbnails reads as both "ranked" and "visual." A pure text list reads as too text-heavy for this product category.

**The optional carousel section is the fallback** in case after shipping the first three changes, the page still feels under-dense visually. Most likely you won't need it. Try without first.

## What to do after it ships

1. Hard-refresh https://twinkvault.com
2. Land on the homepage and count: how many seconds before you see a cover image? Target: under 2 seconds at desktop, under 3 at mobile.
3. If you see images in the first viewport without scrolling — shipped right.
4. If you still feel like the page is too text-heavy on land, come back and we'll add the Hottest This Month strip.

Don't ship the carousel preemptively. Ship the three mandatory changes first. The fourth is insurance.
