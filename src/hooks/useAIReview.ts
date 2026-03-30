import { useState, useEffect } from "react";
import { SiteData } from "../data/sites";

const CACHE_KEY = (slug: string) => `tv_ai_review_${slug}`;

// Pre-written reviews to avoid exposing API keys client-side.
// To update: regenerate offline and paste here.
const reviews: Record<string, string> = {
  "helix-studios":
    `Helix Studios earns its reputation as the gold standard of the niche. With a content quality score of 95/100, the production values here rival mainstream studios — think professional lighting, multi-camera setups, and performers who genuinely seem to enjoy what they're doing. The back catalog is massive, and every scene has that cinematic polish you won't find on amateur sites. If you care about how content looks and feels, Helix is tough to beat.\n\nThe site itself is clean, fast, and responsive. Mobile streaming works well at 88/100 — no janky players or forced downloads. Updates arrive weekly, which keeps the library feeling fresh even after months of membership. Navigation is intuitive, and the search filters actually work, which is more than you can say for a lot of sites in this space.\n\nAt $34.95/month, Helix isn't cheap — and the value score of 78/100 reflects that. But if you go annual at $11.99/mo, the math changes completely. You're getting cinema-quality content, exclusive performers you won't see elsewhere, and a library that keeps growing. For fans of polished premium content, this is worth every dollar. Budget hunters should look elsewhere, but if quality is your top priority, Helix is the obvious pick.`,

  "next-door-twink":
    `Next Door Twink nails the sweet spot between quality and value. At 88/100 for content quality, you're getting well-produced scenes with natural all-American performers who look like actual people you might meet — not over-produced models reading off scripts. The scenes feel genuine, the chemistry is usually solid, and the variety keeps things interesting across solo, duo, and group content.\n\nThe mobile experience scores 90/100, making it one of the best-optimized sites we tested. Pages load fast, the video player is smooth, and you won't be fighting with pop-ups or clunky interfaces. Updates come weekly at 85/100, and the killer feature is that your membership unlocks the entire Next Door network — that's 15 sites and 3,000+ videos for one price.\n\nAt $29.99/month it's a fair deal, but the real value play is the $2.95 three-day trial. That's enough time to explore the full network and decide if it's worth the subscription. Annual members pay just $12/mo, which at 92/100 for value, makes this the best bang-for-buck option for fans of authentic American content. Highly recommended for anyone who wants quantity and quality without breaking the bank.`,

  "next-door-world":
    `Next Door World is the network play — 15 sites under one login, over 3,000 videos, and new content every day. The content quality sits at 87/100 because while nothing here is bad, the sheer volume means production values vary across different partner sites. The flagship Next Door Twink content is polished, while some of the smaller network sites feel more amateur. That range is part of the appeal if you like variety.\n\nThe platform is solid — mobile scores 86/100 with a clean player and fast loading. Updates at 88/100 are essentially daily across the network, so there's always something new. The site design won't win awards but it works, search is decent, and you can filter by site, performer, and category without hassle.\n\nValue is where Next Door World destroys the competition at 98/100. At $12/month annually for 15 sites, that's under $1 per site per month. Even the $29.99 monthly price is reasonable given the volume. If you're the type who gets bored with one site quickly, or just wants maximum content for minimum spend, this is the no-brainer choice. The only downside: not all content is twink-focused, so purists might prefer a dedicated site.`,

  "twinks-in-shorts":
    `Twinks in Shorts delivers exactly what the name suggests — authentic amateur-style content with real chemistry between performers. At 82/100 for content quality, you're not getting Helix-level production, but that's the point. The unscripted feel gives scenes a genuine energy that overproduced studios can't replicate. Performers look natural and comfortable, and the casual all-American vibe runs through everything.\n\nMobile works well at 85/100 — the player is responsive and streams without buffering on decent connections. Updates come at a solid 80/100 pace, keeping the library growing steadily. The site layout is straightforward, nothing fancy, but you can find what you want without digging through layers of menus.\n\nAt $29.95/month it's mid-range pricing, but the annual plan drops to $9.95/month which is genuinely cheap for the content quality. Value scores 88/100 because you're getting authentic content at a price that won't make you regret the subscription. Best suited for fans who prefer natural performers and real chemistry over polished studio productions. If that's your preference, this punches well above its price point.`,

  "athletic-twinks":
    `Athletic Twinks carves out a specific niche — toned, gym-fit performers in high-energy scenes. Content quality at 84/100 is solid. If you're into the athletic physique, the casting is on point. Scenes are well-produced with good lighting and camera work, though they don't quite reach the cinematic level of top-tier studios. The specificity of the niche is both its strength and its limitation.\n\nMobile scores 82/100 — it works without issues but doesn't feel as optimized as the larger network sites. Updates at 78/100 come regularly but not quite weekly. The library is smaller given the niche focus, which means you'll cycle through the catalog faster than on a general-purpose site.\n\nValue sits at 80/100 — the $29.95 monthly price is standard, and the $9.95 annual rate is competitive. If athletic performers are your thing, you won't find a more focused collection elsewhere. For broader tastes, a network membership like Next Door World might be better value. But for the specific audience this serves, Athletic Twinks delivers exactly what it promises without filler.`,

  "southern-strokes":
    `Southern Strokes brings a distinct all-American charm with a Southern flavor. Content quality at 78/100 is decent — performers are friendly, approachable, and feel genuinely natural on camera. The scenes prioritize authenticity over production polish, which works for the brand. You won't find dramatic lighting or multi-angle cinematography, but you will find real performers who seem to actually enjoy what they're doing.\n\nThe mobile experience at 80/100 is functional. Streaming works, navigation is simple, and the player doesn't fight you. Update frequency at 75/100 means new content arrives regularly but not as fast as the bigger studios. The library is respectable for a niche site.\n\nAt $29.95 monthly or $9.95 annually, Southern Strokes offers strong value at 90/100. That annual price makes it one of the cheapest quality options available. It's best suited for budget-conscious fans who prioritize natural performers and authentic content over high production values. If you're testing the waters or want a solid secondary subscription that won't strain your wallet, this is a smart pick.`,

  "daddy-on-twink":
    `Daddy on Twink explores intergenerational dynamics with surprisingly strong performer chemistry. Content quality at 80/100 delivers well-produced scenes that handle the age-gap dynamic tastefully. The casting does a good job of pairing performers who have genuine on-screen rapport, which elevates scenes beyond what you'd expect from a niche site.\n\nMobile comes in at 78/100 — adequate but not exceptional. The player works fine, pages load reasonably fast. Updates at 75/100 keep things moving. The site design is functional without being remarkable. You'll find what you need through basic search and category filters.\n\nPriced at $29.95 monthly or $9.95 annually, the value score of 78/100 is fair. It's not the cheapest option, but the niche is underserved enough that there aren't many alternatives. If intergenerational content is specifically what you're looking for, this is the most focused option in our rankings. Broader-taste viewers should look at network memberships instead.`,

  "touch-that-boy":
    `Touch That Boy takes a different approach — slower-paced, intimate content where the focus is on genuine connection between performers. Content quality at 79/100 reflects higher production values than typical amateur sites, with attention to mood, lighting, and pacing. If your preference leans toward sensual over intense, this hits a sweet spot that most sites in the niche completely ignore.\n\nMobile experience scores 80/100 — clean, functional, no complaints. The update frequency at 72/100 is the main weakness; new content arrives less frequently than competitors, which means the library grows slowly. If you consume content quickly, you may find yourself waiting between updates.\n\nAt $29.95 monthly or $9.95 annually, value sits at 77/100. The price is fair for what you get, but the slower updates drag the score down. Best for viewers who want quality over quantity and appreciate content where performers seem genuinely attracted to each other. It's a niche within a niche, and if it matches your taste, nothing else in our rankings comes close.`,

  "breed-me-raw":
    `Breed Me Raw doesn't sugarcoat what it offers — raw, unfiltered content with passionate performers bringing genuine intensity. Content quality at 76/100 is honest; this isn't polished cinema, it's authentic energy captured on camera. The performers are into it, and that enthusiasm translates. If you prefer real heat over glossy production, this delivers.\n\nMobile at 75/100 works but feels dated compared to the larger sites. The player streams fine, but the interface could use a refresh. Updates at 70/100 come at a steady but not rapid pace. The library is focused and specific, which keeps it from feeling bloated with filler content.\n\nAt $29.95 monthly or $9.95 annually with a free 2-day trial, the value at 80/100 is solid. That trial lets you see exactly what you're getting before committing. The content is very niche — if raw is your thing, this is purpose-built for you. If you're unsure, start with the trial. For a broader content mix, the network memberships offer more variety at similar prices.`,

  "bareback-that-hole":
    `Bareback That Hole serves a specific audience with high-intensity raw content. Content quality at 75/100 is straightforward — the scenes are authentic and energetic, production is clean but not cinematic. The performers bring genuine enthusiasm, and the content stays consistent with what the site promises. No misleading previews here.\n\nMobile at 74/100 is functional but basic. The streaming works, but the interface feels a generation behind the more polished competitors. Updates at 70/100 are steady. The library is focused, which means less browsing and more finding what you actually came for.\n\nAt $29.95 monthly or $9.95 annually, value at 82/100 is good for the niche. The annual price is affordable enough to justify as a secondary subscription alongside a larger network membership. Best suited for fans who know exactly what they want and appreciate a site that delivers it without filler. If you're exploring the category, start with a network site first and add this later if the niche appeals.`,

  "hard-brit-lads":
    `Hard Brit Lads is the go-to for British content — exclusively UK performers with that distinctive British energy. Content quality at 78/100 mixes amateur and semi-professional production. Some scenes have that polished feel while others lean into the raw charm of authentic British lads. The casting is the real draw; you won't find these performers on American sites.\n\nMobile at 76/100 is decent but not exceptional. The player works across devices, updates at 72/100 keep the catalog growing. The European audience is loyal for good reason — this is genuinely the best dedicated British option in the space.\n\nAt $29.95 monthly or $9.95 annually, value at 80/100 is fair. The annual plan makes it affordable as a niche subscription. If British performers are your preference, there's simply nothing better available. If geography doesn't matter to your preferences, the network sites offer more content for similar money. But for fans of UK content, this is essential.`,

  "prideflame":
    `Prideflame fills an important gap in the market with diverse, inclusive content celebrating Latino and mixed performers. Content quality at 74/100 is honest — production values are adequate, and the casting brings representation you won't find on most competitor sites. The authentic diversity makes it stand out in a niche that's often homogeneous.\n\nMobile at 74/100 is functional. Updates at 68/100 are the weakest point — new content arrives less frequently than competitors, which limits the library size. The site design is clean enough to navigate without frustration.\n\nAt $29.95 monthly or $9.95 annually, value at 80/100 is reasonable for the specialization. The annual price is cheap enough that it works as a supplementary subscription. Best for viewers who want representation and diversity in their content. If that matters to you — and it should — Prideflame is the only real option in the twink niche doing it consistently. The lower update frequency is a trade-off worth accepting for content you literally can't get elsewhere.`,
};

export function useAIReview(site: SiteData) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(CACHE_KEY(site.slug));
    if (cached) {
      setContent(cached);
      return;
    }

    // Use pre-written review
    const review = reviews[site.slug];
    if (review) {
      setLoading(true);
      // Small delay to avoid layout flash
      const timer = setTimeout(() => {
        sessionStorage.setItem(CACHE_KEY(site.slug), review);
        setContent(review);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Fallback to site description
    setContent(site.description);
  }, [site.slug, site.description]);

  return { content, loading };
}
