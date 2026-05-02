import SiteCard from "./SiteCard";
import { getSimilarSites } from "@/lib/similarSites";
import type { SiteData } from "@/data/sites";

interface SimilarSitesProps {
  site: SiteData;
  count?: number;
  /** Heading override; defaults to "If You Like {site.name}, Try These" */
  heading?: string;
  className?: string;
}

const SimilarSites = ({
  site,
  count = 3,
  heading,
  className = "",
}: SimilarSitesProps) => {
  const similar = getSimilarSites(site.slug, count);
  if (similar.length === 0) return null;

  const title = heading ?? `If You Like ${site.name}, Try These`;

  return (
    <section className={className}>
      <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
        {title}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {similar.map((s) => (
          <SiteCard key={s.id} site={s} variant="compact" />
        ))}
      </div>
    </section>
  );
};

export default SimilarSites;
