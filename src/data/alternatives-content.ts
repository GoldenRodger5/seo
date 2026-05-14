/**
 * AI-generated alternatives body content, keyed by the alternatives page
 * slug (e.g. "helix-studios-alternatives"). Written by the daily content
 * engine; read by the alternatives route components.
 *
 * Schema mirrors the JSON returned by alternativesPrompt() in
 * generate-daily-content.ts.
 */

export interface AlternativeEntry {
  slug: string;
  reason: string;
}

export interface AlternativesBody {
  h1: string;
  intro: string;
  alternatives: AlternativeEntry[];
  verdict: string;
  meta_description: string;
  faq: { q: string; a: string }[];
}

export const ALTERNATIVES_CONTENT: Record<string, AlternativesBody> = {
  "helix-studios-alternatives": {
    "h1": "Best Alternatives to Helix Studios in 2026",
    "intro": "Helix Studios has been the default answer to 'where do I find great twink content?' since 2002, and with over 4,000 scenes in the vault it earns that reputation. But it isn't perfect. The annual membership pricing is steep, the performer roster leans heavily into one very specific aesthetic — slim, hairless, American — and members who've exhausted the catalog of fan-favourite exclusives often find themselves wanting something fresher. Others simply want more variety in body types, kinks, or production styles without committing to a site whose best years may be behind it. Whatever your reason for looking around, the good news is the twink and young-guys niche is genuinely competitive right now. Look for a site that matches your preferred vibe on performer type, shoots condom-free or covered based on your preference, and has an update schedule that justifies the monthly outlay.",
    "alternatives": [
      {
        "slug": "next-door-twink",
        "reason": "Next Door Twink is the most obvious lateral move for any Helix defector. The performer archetype overlaps almost perfectly — lean, college-aged, conventionally attractive guys — but Next Door's production values feel a touch more polished and the scene count grows reliably. Where Helix leans into narrative-heavy features that can pad runtime with non-sexual filler, Next Door Twink keeps the pacing tight. It scores highest on our list for a reason: strong catalog depth, consistent updates, and a membership that cross-accesses other Next Door World properties, which immediately multiplies your available content. If Helix is your benchmark, this is the safest bet for a like-for-like upgrade."
      },
      {
        "slug": "next-door-world",
        "reason": "If what you're quietly missing about Helix is the occasional beefier scene partner stepping in alongside a twink, Next Door World delivers that with more regularity. The network umbrella covers a wider age and body-type range than Helix's tightly curated aesthetic, so you get the fresh-faced guys you came for plus actual variety in physicality. Pricing is comparable, and the sheer volume of content accessible under one login makes the value proposition noticeably better than Helix's standalone subscription. The flip side: if you want exclusively slim-and-hairless, some scenes here will miss the mark. Know what you're shopping for."
      },
      {
        "slug": "southern-strokes",
        "reason": "Southern Strokes scratches a very specific itch that Helix never quite managed: that sun-drenched, boy-next-door Southern aesthetic with a genuine amateur energy rather than a produced-in-a-studio feel. Performers tend to be lean, often uncut, and carry the kind of spontaneous chemistry that Helix's scripted narrative approach occasionally works against. It's a smaller, more focused site — don't come expecting thousands of scenes — but the quality-to-quantity ratio is solid and the monthly cost is easier on the wallet. A good supplementary pick if Helix's glossy studio sheen was starting to feel a bit factory-line."
      },
      {
        "slug": "athletic-twinks",
        "reason": "Helix's models run slim-to-slender; Athletic Twinks targets the guy who wants the same youth demographic but with more visible muscle definition and a sportier frame. Think swimmer's build rather than waif. If you found Helix's performers occasionally looked too young or slight for your taste but still want men in their early 20s, this fills that gap cleanly. Production quality is respectable, scenes are direct without a lot of narrative padding, and updates are regular enough to keep the membership feeling active. Scored well in our testing for exactly the kind of viewer who ages out of the softest Helix aesthetic."
      },
      {
        "slug": "hard-brit-lads",
        "reason": "For viewers who bounced off Helix because every performer sounds like they're from the same zip code, Hard Brit Lads is a genuinely different experience. The UK accent alone changes the energy of a scene considerably, and the performer type — often a bit rougher around the edges, naturally built rather than gym-sculpted, with uncut cocks as the rule rather than the exception — is a solid counterpoint to Helix's very American polish. Production has improved markedly in recent years. If international variety and a grittier aesthetic are what you're missing, this is the most distinct departure on this list."
      }
    ],
    "verdict": "Helix Studios is a legitimate institution in gay adult entertainment and its 4,000-plus scene library isn't going anywhere. But 'largest catalog' and 'best value' stopped being the same thing a while ago, and the site's devotion to one narrow performer type means diminishing returns hit faster than on more varied networks. Next Door Twink and Next Door World are the cleanest replacements for most members — higher scores, comparable content, better network value. Southern Strokes and Athletic Twinks serve more specific moods rather than full substitutions. Hard Brit Lads is the strongest pick if you want to genuinely break the Helix pattern. No single site does everything, but any one of these five justifies the switch.",
    "meta_description": "Looking beyond Helix Studios in 2026? We picked the 5 best alternatives for gay men who want great twink content without the compromises.",
    "faq": [
      {
        "question": "Is there a site like Helix Studios but with more performer diversity?",
        "answer": "Next Door World is your best bet — it spans a wider range of ages, body types, and scene dynamics under one membership while still including the lean, younger performers Helix is known for. Hard Brit Lads adds genuine international diversity if American-produced content feels repetitive."
      },
      {
        "question": "Which Helix Studios alternative offers the best value for money?",
        "answer": "Next Door Twink and Next Door World both benefit from network access that multiplies available content under a single subscription, making the per-scene cost significantly lower than a standalone Helix membership — especially compared to Helix's annual plan, which is priced at a notable premium over many competitors."
      }
    ]
  },
};

export const getAlternativesBody = (slug: string): AlternativesBody | undefined =>
  ALTERNATIVES_CONTENT[slug];
