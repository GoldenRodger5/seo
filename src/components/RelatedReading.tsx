import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { sites, type SiteData } from "../data/sites";
import { siteNicheMap } from "../data/site-niches";
import { getNiche } from "../data/niches";
import { getFeaturedComparePairs } from "../data/featured-compare-pairs";
import { rankComparePairs } from "../lib/compareRanking";
import { getAnchor } from "../lib/anchorVariations";

/**
 * Reusable "Related Reading" block rendered above the footer on content
 * pages. Surfaces internal links to:
 *   - Other relevant SEO landing pages (varied anchors via anchorVariations)
 *   - Featured compare pages relevant to the current entity
 *   - The /ask-ai recommender
 *
 * The anchor for a given destination is picked deterministically from the
 * pool based on the current page's slug, so each source page consistently
 * shows the same anchor (avoids anchor flux between crawls) while the
 * sitewide distribution still gets the variety Google looks for.
 */

interface ReviewProps {
  sourceType: "review";
  site: SiteData;
}

interface CompareProps {
  sourceType: "compare";
  siteA: SiteData;
  siteB: SiteData;
  slug: string;
}

interface LandingProps {
  sourceType: "landing";
  /** The current landing page's URL path (e.g. "/best-bareback-twink-sites"). */
  currentPath: string;
  /** Optional pre-filtered site slugs on this landing page — used to derive
   *  4 relevant featured compare pairs. If absent, falls back to top featured
   *  pairs overall by score. */
  filteredSiteSlugs?: string[];
}

interface BlogProps {
  sourceType: "blog";
  currentSlug: string;
  relatedSiteSlugs: string[];
  relatedLandingPages: string[];
}

type RelatedReadingProps = ReviewProps | CompareProps | LandingProps | BlogProps;

interface LinkOut {
  to: string;
  label: string;
}

const ASK_AI_LINKS = (sourceSlug: string): LinkOut[] => [
  { to: "/ask-ai", label: getAnchor("/ask-ai", sourceSlug, "Site Recommender") },
  { to: "/find-my-site", label: getAnchor("/find-my-site", sourceSlug, "Site finder quiz") },
];

/** Maps a niche slug to the most relevant SEO landing page. */
function landingPageForNiche(niche: string): string | null {
  const m: Record<string, string> = {
    bareback: "/best-bareback-gay-sites",
    twink: "/best-twink-porn-sites",
    asian: "/best-asian-gay-sites",
    amateur: "/best-amateur-gay-sites",
    daddy: "/best-daddy-twink-sites",
  };
  return m[niche] ?? null;
}

/** Map of a site slug → 2-3 most-relevant landing pages based on its niches. */
function landingsForSite(site: SiteData, sourceSlug: string): LinkOut[] {
  const niches = siteNicheMap[site.slug] ?? [];
  const candidates = niches
    .map(landingPageForNiche)
    .filter((p): p is string => !!p);
  // Always include the broad ranking page as a relevant link too.
  const dedup = Array.from(new Set([...candidates, "/best-gay-porn-sites", "/best-cheap-gay-porn-sites"]));
  return dedup.slice(0, 3).map((path) => ({
    to: path,
    label: getAnchor(path, sourceSlug, path),
  }));
}

/** Featured compare pairs that include the given site slug. */
function featuredPairsForSite(siteSlug: string, excludeSlug?: string, limit = 3): LinkOut[] {
  const pairs = [...getFeaturedComparePairs()];
  return pairs
    .filter((p) => {
      const [a, b] = p.split("-vs-");
      return (a === siteSlug || b === siteSlug) && p !== excludeSlug;
    })
    .slice(0, limit)
    .map((p) => {
      const [a, b] = p.split("-vs-");
      const aSite = sites.find((s) => s.slug === a);
      const bSite = sites.find((s) => s.slug === b);
      return {
        to: `/compare/${p}`,
        label: aSite && bSite ? `${aSite.name} vs ${bSite.name}` : `Compare ${a} vs ${b}`,
      };
    });
}

/** Featured compare pairs sharing a site with the current pair (siteA OR siteB). */
function relatedCompareToPair(siteA: SiteData, siteB: SiteData, currentSlug: string, limit = 3): LinkOut[] {
  const aPairs = featuredPairsForSite(siteA.slug, currentSlug, limit);
  const bPairs = featuredPairsForSite(siteB.slug, currentSlug, limit);
  // Interleave to get a mix from both sides, dedupe by target URL.
  const merged: LinkOut[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < Math.max(aPairs.length, bPairs.length); i++) {
    for (const list of [aPairs, bPairs]) {
      const item = list[i];
      if (item && !seen.has(item.to)) {
        seen.add(item.to);
        merged.push(item);
        if (merged.length >= limit) return merged;
      }
    }
  }
  return merged;
}

/** Primary niche → niche hub page URL. */
function nichePageForSite(site: SiteData, sourceSlug: string): LinkOut | null {
  const primary = (siteNicheMap[site.slug] ?? [])[0];
  if (!primary) return null;
  const niche = getNiche(primary);
  if (!niche) return null;
  return {
    to: `/niche/${niche.slug}`,
    label: `All ${niche.displayName.toLowerCase()} sites`,
  };
}

function Section({ title, links }: { title: string; links: LinkOut[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="font-heading text-sm font-semibold mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
              {l.label}
              <ArrowRight size={11} className="opacity-60" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RelatedReading = (props: RelatedReadingProps) => {
  if (props.sourceType === "review") {
    const { site } = props;
    const sourceSlug = `review-${site.slug}`;
    const niche = nichePageForSite(site, sourceSlug);
    return (
      <section className="border-t border-border/40 mt-12 py-10 bg-card/30">
        <div className="container max-w-4xl">
          <h2 className="font-heading text-xl font-bold mb-6 heading-gradient inline-block">Related Reading</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Section title="Compare to others" links={featuredPairsForSite(site.slug)} />
            <Section title="Browse by category" links={[
              ...landingsForSite(site, sourceSlug),
              ...(niche ? [niche] : []),
            ]} />
            <Section title="Need help deciding?" links={ASK_AI_LINKS(sourceSlug)} />
          </div>
        </div>
      </section>
    );
  }

  if (props.sourceType === "compare") {
    const { siteA, siteB, slug } = props;
    const sourceSlug = `compare-${slug}`;
    return (
      <section className="border-t border-border/40 mt-12 py-10 bg-card/30">
        <div className="container max-w-4xl">
          <h2 className="font-heading text-xl font-bold mb-6 heading-gradient inline-block">Related Reading</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Section title="Related comparisons" links={relatedCompareToPair(siteA, siteB, slug)} />
            <Section title="Browse by category" links={[
              ...landingsForSite(siteA, sourceSlug).slice(0, 2),
            ]} />
            <Section title="Need help deciding?" links={ASK_AI_LINKS(sourceSlug)} />
          </div>
        </div>
      </section>
    );
  }

  if (props.sourceType === "landing") {
    const { currentPath, filteredSiteSlugs } = props;
    const sourceSlug = `landing-${currentPath}`;
    const allLandings = [
      "/best-gay-porn-sites", "/best-twink-porn-sites", "/best-bareback-twink-sites",
      "/best-cheap-gay-porn-sites", "/best-bareback-gay-sites", "/best-amateur-gay-sites",
      "/best-premium-gay-sites", "/best-asian-gay-sites", "/best-twink-porn-sites-with-free-trials",
      "/best-gay-porn-subscription", "/best-value-gay-porn-sites", "/best-daddy-twink-sites",
      "/gay-porn-sites-ranked",
    ];
    let hash = 0;
    for (let i = 0; i < currentPath.length; i++) hash = (hash * 31 + currentPath.charCodeAt(i)) >>> 0;
    const filteredLandings = allLandings.filter((p) => p !== currentPath);
    const offset = hash % filteredLandings.length;
    const picks: LinkOut[] = [];
    for (let i = 0; i < 4; i++) {
      const path = filteredLandings[(offset + i) % filteredLandings.length];
      picks.push({ to: path, label: getAnchor(path, sourceSlug, path) });
    }

    // 4 featured compare pairs relevant to this landing. If filteredSiteSlugs
    // is provided (the landing page's filtered site list), pick pairs where
    // BOTH sites are in that list — those are pairs most likely to interest
    // a reader of this landing page. Otherwise fall back to top featured
    // pairs overall by score.
    const compareLinks: LinkOut[] = (() => {
      const featured = getFeaturedComparePairs();
      const filterSet = new Set(filteredSiteSlugs ?? []);
      const candidates: { slug: string; score: number; siteA: string; siteB: string }[] = [];
      for (const ranked of rankComparePairs()) {
        if (!featured.has(ranked.slug)) continue;
        if (filterSet.size > 0) {
          if (!filterSet.has(ranked.siteA) || !filterSet.has(ranked.siteB)) continue;
        }
        candidates.push(ranked);
        if (candidates.length >= 4) break;
      }
      return candidates.map((c) => {
        const a = sites.find((s) => s.slug === c.siteA);
        const b = sites.find((s) => s.slug === c.siteB);
        return {
          to: `/compare/${c.slug}`,
          label: a && b ? `${a.name} vs ${b.name}` : `Compare ${c.siteA} vs ${c.siteB}`,
        };
      });
    })();

    return (
      <section className="border-t border-border/40 mt-8 py-10 bg-card/30">
        <div className="container max-w-4xl">
          <h2 className="font-heading text-xl font-bold mb-6 heading-gradient inline-block">Related Reading</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Section title="More lists worth reading" links={picks} />
            <Section title="Compare top picks" links={compareLinks} />
            <Section title="Need help deciding?" links={ASK_AI_LINKS(sourceSlug)} />
          </div>
        </div>
      </section>
    );
  }

  // Blog post
  const { currentSlug, relatedSiteSlugs, relatedLandingPages } = props;
  const sourceSlug = `blog-${currentSlug}`;
  const landingLinks: LinkOut[] = relatedLandingPages.map((p) => ({
    to: p,
    label: getAnchor(p, sourceSlug, p),
  }));
  const reviewLinks: LinkOut[] = relatedSiteSlugs.slice(0, 4).map((slug) => {
    const s = sites.find((x) => x.slug === slug);
    return { to: `/reviews/${slug}`, label: s?.name ?? slug };
  });
  return (
    <section className="border-t border-border/40 mt-8 py-10 bg-card/30">
      <div className="container max-w-4xl">
        <h2 className="font-heading text-xl font-bold mb-6 heading-gradient inline-block">Related Reading</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Section title="More from the blog" links={[
            { to: "/blog", label: "All articles" },
            { to: `/blog/category/guides`, label: "Guides" },
            { to: `/blog/category/comparisons`, label: "Comparisons" },
          ]} />
          <Section title="Related lists" links={landingLinks} />
          <Section title="Sites mentioned" links={reviewLinks} />
        </div>
      </div>
    </section>
  );
};

export default RelatedReading;
