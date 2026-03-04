# TwinkVault.com — Complete Lovable Build Prompts

Use these prompts in order. Complete each one fully before moving to the next.

---

## PROMPT 1 — Initial Setup & Design System

```
Build a website called TwinkVault — a premium gay adult review and ranking site focused on the twink niche. This is a legitimate affiliate review site, similar to a "best of" guide.

Design direction: Dark luxury editorial. Think GQ magazine meets a high-end nightlife site. NOT cheap or garish. Clean, modern, and authoritative.

Design system to use throughout the entire site:
- Background: near-black (#0a0a0f)
- Primary accent: electric violet (#7c3aed)
- Secondary accent: warm gold (#f59e0b)
- Text: off-white (#f1f5f9)
- Muted text: (#94a3b8)
- Cards: (#12121a) with subtle border (#1e1e2e)
- Font: Use "Playfair Display" for headings (import from Google Fonts) and "DM Sans" for body text
- Rounded corners: 12px on cards, 8px on buttons
- Subtle gold gradient on primary CTA buttons

Create the base app structure with:
- A top navigation bar with logo "TwinkVault" (the word "Vault" in gold), and nav links: Home, Top Sites, Reviews, Best Deals
- A mobile hamburger menu
- A footer with: About, Privacy Policy, Affiliate Disclosure, Contact — and a small disclaimer: "TwinkVault.com is an adult content review site. All sites reviewed contain content intended for adults 18+. We earn commissions from affiliate links."
- An age verification modal that appears on first visit — dark overlay, centered card asking "Are you 18 or older?" with Yes/No buttons. Store the answer in localStorage so it only shows once.

Make it fully responsive and mobile-first.
```

---

## PROMPT 2 — Homepage

```
Build the homepage for TwinkVault. Use the design system already established.

The homepage should have these sections in order:

1. HERO SECTION
- Headline: "The Internet's Best Guide to Twink Content"
- Subheadline: "Honest, independent reviews of the top gay twink sites — ranked by quality, value, and content."
- Two CTA buttons: "See Top Rated Sites" (primary, gold gradient) and "Browse All Reviews" (secondary, outlined)
- A subtle animated background — dark with slowly moving violet/purple gradient orbs
- A row of 5 star rating icons and text: "Reviewing the web's best twink content since 2024"

2. TOP SITES QUICK LIST
- Section heading: "🏆 Editor's Top Picks"
- A horizontal scrollable row of 5 site cards on mobile, grid on desktop
- Each card has: site name placeholder, star rating (out of 5), one-line description, a "Visit Site" gold button, and a badge like "Best Value" or "Top Rated" or "Most Popular"
- Use placeholder site names: Site A, Site B, Site C, Site D, Site E for now

3. CATEGORIES SECTION
- Section heading: "Browse By Category"  
- Grid of 6 category tiles with icons:
  - 🔥 Amateur Twinks
  - ⭐ Premium Studios
  - 💰 Best Value
  - 🎬 HD Quality
  - 🆓 Free Trials
  - 📱 Mobile Friendly
- Each tile is clickable and links to /category/[slug]

4. LATEST REVIEWS SECTION
- Section heading: "Latest Reviews"
- 3 review preview cards in a grid
- Each card: site name, star rating, short excerpt (2 lines), "Read Full Review" link
- Use placeholder content for now

5. WHY TRUST US SECTION
- 3 columns with icons:
  - 🔍 Independent Reviews — "We pay for memberships ourselves and report honestly"
  - 🚫 No Paid Placements — "Rankings are based on quality, not who pays us more"  
  - 🔄 Updated Monthly — "We revisit sites regularly to keep reviews current"
```

---

## PROMPT 3 — Top Sites Ranking Page

```
Build a /top-sites page for TwinkVault.

This is the main money page — the most important page on the site. It should feel authoritative like a "best of" list.

Page structure:

1. PAGE HEADER
- Title: "Best Twink Porn Sites — 2025 Rankings"
- Subtitle: "We tested and ranked the top twink content sites so you don't have to. Updated monthly."
- Last updated badge: "Last Updated: January 2025"

2. FILTER BAR
- Horizontal filter pills: All | Best Value | HD Quality | Amateur | Premium Studio | Free Trial
- Active filter pill uses gold accent color

3. RANKED LIST
Build 8 ranked site cards. Each card contains:
- Rank number (large, muted, left side — like #1, #2)
- "EDITOR'S CHOICE" badge on #1
- Site name (bold, large)
- Star rating with number (e.g. ⭐ 4.8/5)
- Short description (2-3 sentences)
- Tag pills: e.g. "HD Video", "Daily Updates", "Free Trial"
- Price: "From $9.99/mo"
- A prominent "Visit Site →" button (gold on #1, violet on others)
- Pros list (3 bullet points, green checkmarks)
- Cons list (1-2 bullet points, subtle)
- A thin divider between cards

Use these placeholder site names: HeliXStudios, TwinkInShorts, AthleticTwinks, DaddyOnTwink, SouthernStrokes, TouchThatBoy, BreedMeRaw, TwinksBareback

4. BOTTOM CTA
- "Looking for a specific type of content?"
- Link to category pages
```

---

## PROMPT 4 — Individual Review Page Template

```
Build a review page template at /reviews/[site-name] for TwinkVault. Build it using "HelixStudios" as the example.

Page structure:

1. REVIEW HEADER
- Breadcrumb: Home > Reviews > HelixStudios
- Site name as H1
- Star rating displayed prominently (large stars, number, and "X user ratings")
- Quick stats bar with 4 metrics: Content Quality | Update Frequency | Value for Money | Mobile Experience — each with a colored progress bar (0-100)
- Two buttons: "Visit HelixStudios →" (primary gold) and "See All Reviews" (secondary)
- An affiliate disclosure note in small text: "We may earn a commission if you sign up through our links."

2. REVIEW SUMMARY BOX
- Dark card with: Overall Score (large number like 4.7), a 2-sentence verdict, and a "Best For:" line

3. PROS AND CONS
- Two column layout
- Left: Pros with green checkmark icons
- Right: Cons with red X icons

4. FULL REVIEW BODY
- Section: "Content Quality" with placeholder paragraph text
- Section: "Site Design & Usability" with placeholder paragraph text  
- Section: "Pricing & Value" with a pricing table showing membership tiers (Monthly / Quarterly / Annual) with placeholder prices
- Section: "Who Is It Best For?" with placeholder text
- Section: "Our Verdict" with placeholder text and final score

5. SIMILAR SITES
- "You Might Also Like" section
- 3 horizontal cards linking to other review pages

6. STICKY SIDEBAR (desktop only)
- Floats on the right side as user scrolls
- Shows: site name, overall score, price, and big "Visit Site" CTA button
```

---

## PROMPT 5 — Category Pages

```
Build a category page template for TwinkVault. Use "Amateur Twinks" as the example at /category/amateur-twinks.

Structure:

1. CATEGORY HEADER
- Category icon and title: "🔥 Amateur Twinks"
- Description: "The best amateur twink content sites — real guys, authentic scenes, no scripts."
- Count badge: "12 Sites Reviewed"

2. SORT BAR
- Sort by: Top Rated | Newest | Best Value | Most Popular

3. SITE CARDS GRID
- 2 columns on desktop, 1 on mobile
- 6 placeholder site cards
- Each card: site name, rating, 1-line description, category tags, price, "Read Review" and "Visit Site" buttons

4. RELATED CATEGORIES
- "Browse Similar Categories" row linking to: Premium Studios, Free Trials, HD Quality, Best Value
```

---

## PROMPT 6 — Supabase Integration for Reviews

```
Integrate Supabase into TwinkVault so all site review data is pulled from a database instead of hardcoded.

Set up a Supabase client using environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Create a TypeScript interface for a "site" record:
{
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  overall_score: number
  content_quality: number
  value_score: number
  update_frequency: number
  mobile_score: number
  price_from: string
  affiliate_url: string
  categories: string[]
  pros: string[]
  cons: string[]
  rank: number
  badge: string | null
  is_featured: boolean
  created_at: string
}

Update the following to pull from Supabase instead of hardcoded data:
- Homepage top picks section
- /top-sites page ranked list
- /reviews/[slug] dynamic review pages
- Category pages

Add loading skeletons while data fetches — dark shimmer effect matching the site's color scheme.

Add error states with a friendly message if data fails to load.
```

---

## PROMPT 7 — Affiliate Link System

```
Add an affiliate link tracking and redirect system to TwinkVault.

1. Create a /go/[slug] redirect route
- When a user visits /go/helix-studios, it looks up the site in Supabase by slug
- It logs a click event to a Supabase "clicks" table: { site_id, timestamp, page_referrer }
- Then redirects the user to the affiliate_url stored in the database
- Show a brief "Taking you to [Site Name]..." loading screen for 1.5 seconds before redirect

2. Update ALL "Visit Site" buttons across the entire site to use /go/[slug] instead of direct URLs

3. Create a Supabase "clicks" table with columns:
- id, site_id, clicked_at, referrer_page

This way you can track which pages drive the most affiliate clicks.
```

---

## PROMPT 8 — SEO & Meta Tags

```
Add comprehensive SEO to every page of TwinkVault using React Helmet or the built-in Vite head management.

For each page type, add:

HOMEPAGE:
- Title: "TwinkVault — Best Twink Porn Sites Ranked & Reviewed"
- Description: "Independent reviews and rankings of the best gay twink content sites. Updated monthly with honest scores, pricing, and recommendations."
- OG tags for social sharing

TOP SITES PAGE:
- Title: "Best Twink Porn Sites 2025 — Ranked by Experts | TwinkVault"
- Description: "We ranked and reviewed the top twink sites of 2025. See scores, pricing, pros and cons before you subscribe."

REVIEW PAGES (dynamic):
- Title: "[Site Name] Review 2025 — Is It Worth It? | TwinkVault"
- Description: "Read our honest [Site Name] review. We tested the content, pricing, and usability so you know exactly what you're getting."

CATEGORY PAGES (dynamic):
- Title: "Best [Category] Sites 2025 — Ranked | TwinkVault"
- Description: "The best [category] twink content sites, ranked by quality and value."

Also add:
- A robots.txt file allowing all crawlers
- A sitemap.xml that includes all review and category pages
- Canonical tags on all pages
- Schema markup (Review schema) on individual review pages
```

---

## PROMPT 9 — Polish & Performance

```
Final polish pass on TwinkVault. Make these improvements:

1. ANIMATIONS
- Add a subtle fade-in + slide-up animation when page sections enter the viewport (use Intersection Observer)
- Add hover states on all cards: slight scale up (1.02) and border glow in violet
- Add a smooth loading bar at the top of the page on route changes

2. MOBILE FIXES
- Ensure the top-sites ranked list looks clean on mobile — stack the pros/cons vertically
- Make the sticky sidebar on review pages disappear on mobile and show as a bottom sticky bar instead with just the CTA button
- Test all tap targets are at least 44px

3. PERFORMANCE
- Lazy load images
- Add a simple skeleton loading state to all data-fetched sections

4. TRUST SIGNALS
- Add a small "18+ Adult Content" badge in the footer
- Add an affiliate disclosure banner that appears at the top of review pages: "Disclosure: We earn commissions from affiliate links. This doesn't affect our rankings."
- Add "Last Updated: [Month Year]" to all review pages

5. 404 PAGE
- Custom 404 page matching the site's dark aesthetic
- Message: "This page went somewhere private. Here's what you can explore instead:" 
- Links back to homepage and top-sites page
```

---

## AFTER ALL PROMPTS — Supabase Table to Create

Once the site is built, create this table in your Supabase dashboard before going live:

**Table: sites**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | e.g. "Helix Studios" |
| slug | text | e.g. "helix-studios" |
| short_description | text | 1-2 sentences |
| description | text | Full review body |
| overall_score | float | 0-5 |
| content_quality | int | 0-100 |
| value_score | int | 0-100 |
| update_frequency | int | 0-100 |
| mobile_score | int | 0-100 |
| price_from | text | e.g. "$9.99/mo" |
| affiliate_url | text | Your affiliate link |
| categories | text[] | Array of category slugs |
| pros | text[] | Array of pro points |
| cons | text[] | Array of con points |
| rank | int | For ordering |
| badge | text | "Top Rated", "Best Value" etc |
| is_featured | bool | Shows on homepage |

**Table: clicks**
| Column | Type |
|--------|------|
| id | uuid |
| site_id | uuid (FK) |
| clicked_at | timestamp |
| referrer_page | text |
