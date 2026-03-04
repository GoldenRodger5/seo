# TwinkVault — UI, Motion & Marketing Polish Prompt

Run this as Prompt 1B, immediately after the initial setup prompt.

---

## PROMPT 1B — Premium UI, Motion & Marketing Design

```
Upgrade TwinkVault's UI to feel like a premium modern SaaS marketing site —
think Linear.app, Vercel.com, or Stripe.com but dark and for adult content.
This site should feel shockingly modern compared to every other porn site
on the internet. That contrast IS the brand.

Apply all of the following:

---

### TYPOGRAPHY UPGRADES
- "TwinkVault" logo: "Twink" in off-white, "Vault" in animated gold shimmer
  (CSS shimmer animation sweeping left to right continuously on the word)
- All H1 headings: large confident size using clamp(2.5rem, 6vw, 5rem)
- Major headings get a subtle horizontal gradient: off-white on the left
  fading into violet (#7c3aed) on the right, using background-clip: text
- Body text line-height: 1.75 for comfortable reading
- Nav links: uppercase, 0.05em letter-spacing, small font size, 
  hover color transitions to gold over 0.2s

---

### BACKGROUND & ATMOSPHERE
- Hero section: animated gradient mesh background — deep navy, dark violet,
  and near-black slowly morphing using CSS @keyframes on background-position
  over a large gradient. Slow and cinematic, not jarring.
- Subtle noise texture overlay on the entire site background: use a 
  CSS pseudo-element with an SVG feTurbulence noise filter at ~3% opacity.
  This makes flat dark backgrounds feel premium and tactile, not flat.
- Cards: backdrop-filter blur(10px) with semi-transparent dark background
  for a frosted glass effect sitting on the dark background
- Faint radial gradient glow centered behind the hero headline —
  violet, large spread radius, opacity 0.12. Atmospheric, not distracting.
- Thin 1px gradient border on cards: transparent → violet → transparent,
  running along the top edge only (like a light reflection)

---

### MOTION & ANIMATIONS

PAGE LOAD:
- Stagger all above-the-fold elements: each fades in with translateY(16px → 0)
  with 0.1s delay between logo, nav, headline, subheadline, CTA buttons
- Hero headline: each word animates up from below with opacity 0→1,
  staggered 0.08s per word

SCROLL:
- Any section entering the viewport: fade in + translate up 24px
  using Intersection Observer with threshold 0.15
- Once triggered, animation does not replay (add a "visible" class)

CARD INTERACTIONS:
- Hover: scale 1.0 → 1.025, box-shadow gains violet glow
  (0 8px 40px rgba(124,58,237,0.25)), border brightens to violet
- Transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)
- Active/click: scale briefly to 0.99 for tactile feel

CTA BUTTONS:
- Primary gold button: on hover, shimmer sweep animation moves across,
  slight translateY(-2px) lift, shadow deepens
- All buttons: cursor changes to pointer, no outline on focus
  (use custom focus ring in violet instead)

STAR RATINGS:
- On page load, stars fill in one by one left to right with 0.1s stagger
- Use CSS animation, not JS

---

### MARKETING UI COMPONENTS

1. RANKING SYSTEM
- #1 card: glowing gold left border (4px), pulsing gold crown badge 👑
  with subtle keyframe pulse on the glow
- Top 3 cards: gold left border, slightly larger card
- "Editor's Choice" badge: pill shape, gold gradient fill, small caps,
  positioned top-right corner of the card
- "Best Value" / "Most Popular" / "Free Trial" badges: 
  different colored pills — violet, teal, green respectively

2. SOCIAL PROOF STRIP
Below the hero, a full-width thin strip with:
"⭐ 50+ Sites Reviewed  |  🔄 Updated Monthly  |  👁 Trusted by 10,000+ Readers  |  🔒 100% Independent"
- Desktop: static centered row with separator dots
- Mobile: auto-scrolling marquee animation (continuous loop, no JS needed)
- Strip background: slightly lighter than page bg with a top/bottom 
  1px border in muted violet

3. SCORE RINGS
- Overall score displayed as an animated SVG circle progress ring
- Draws from 0 to the score value over 1.2s on page load using
  stroke-dasharray / stroke-dashoffset animation
- Color: #22c55e for 4.5+, #f59e0b for 3.5–4.4, #ef4444 below 3.5
- Score number counts up from 0 inside the ring using a JS counter

4. PRICING DISPLAY
- Price shown in a small pill: dark background, muted border
- Free trial sites get a bright green "FREE TRIAL" badge
- "Best Deal" sites get a gold "💰 Best Deal" tag

5. COMPARISON TABLE (for top-sites page)
- Sticky header row with column labels
- Alternating row backgrounds (near-black / slightly lighter)
- Checkmark icons in green, X icons in muted red
- Hover highlights the entire row in a faint violet tint

6. LOADING STATES
- Skeleton loaders that match the site's dark aesthetic:
  dark base (#1a1a2e) with a shimmer sweep in slightly lighter dark
  moving left to right — NOT the default grey skeleton look

7. STICKY CTA BAR (mobile only)
- On review pages, a bar fixed to the bottom of the screen on mobile
- Shows: site name, star score, and a full-width gold "Visit Site →" button
- Appears after the user scrolls past the hero section
- Smooth slide-up entrance animation

---

### MICRO-DETAILS THAT MATTER
- Custom scrollbar: thin (6px), dark track, violet thumb with rounded ends
- Text selection color: violet background, white text
- External links (affiliate links) open in new tab with rel="noopener noreferrer"
- All images use object-fit: cover with a dark overlay gradient at the bottom
- Focus states: violet 2px outline offset 2px (never remove focus visibility)
- Smooth scroll behavior on the entire page: scroll-behavior: smooth
- Page transitions: if using React Router, add a subtle fade between routes
```
