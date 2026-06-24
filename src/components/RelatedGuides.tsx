import { Link } from "react-router-dom";
import SmartImage from "./common/SmartImage";
import { GUIDE_CONTENT } from "../data/guide-content";
import { selectGuideHero } from "../lib/guideImagery";

/**
 * "Related guides" block. Surfaces guide articles as human-navigable
 * inbound links so guides aren't orphaned (reachable only via sitemap).
 * Reused on GuidePage, discount pages, and /best-deals.
 */
interface RelatedGuidesProps {
  /** Guide slug to exclude (the page you're already on). */
  excludeSlug?: string;
  /** Explicit subset of guide slugs to show (in order). Defaults to all. */
  slugs?: string[];
  title?: string;
  max?: number;
  className?: string;
}

const RelatedGuides = ({
  excludeSlug,
  slugs,
  title = "Related guides",
  max = 3,
  className = "",
}: RelatedGuidesProps) => {
  const pool = (slugs ?? Object.keys(GUIDE_CONTENT))
    .filter((s) => s !== excludeSlug && GUIDE_CONTENT[s])
    .slice(0, max);

  if (pool.length === 0) return null;

  return (
    <section className={`border-t border-border/40 pt-8 ${className}`}>
      <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">{title}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pool.map((slug) => {
          const g = GUIDE_CONTENT[slug];
          const hero = selectGuideHero(g.related_sites ?? [], slug);
          return (
            <Link
              key={slug}
              to={`/guide/${slug}`}
              className="group block rounded-lg border border-border/40 overflow-hidden hover:border-secondary/60 transition-colors"
            >
              <SmartImage
                src={hero?.hero_image ?? g.hero_image}
                alt={hero?.hero_alt || g.hero_alt || g.h1}
                aspectRatio="16:10"
                fallbackLabel={g.h1}
                className="w-full"
              />
              <div className="p-4">
                <h3 className="font-heading font-semibold leading-snug group-hover:text-secondary transition-colors">
                  {g.h1}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{g.meta_description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedGuides;
