import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SmartImage from "./SmartImage";
import { pickBanner, type FeaturedBanner } from "../../data/featured-banners";
import { getSiteBySlug, getVisitUrl, isAffiliated } from "../../data/sites";
import { logClick, logImpression } from "../../lib/tracking";

interface FeaturedDealBannerProps {
  placement: "homepage" | "reviews-index" | "best-deals" | "niche-category" | "compare" | "review-page";
  context?: {
    nicheSlug?: string;
    compareSlugs?: [string, string];
    siteSlug?: string;
  };
  className?: string;
}

/**
 * Above-the-banner FTC-compliance label. Linked to /affiliate-disclosure
 * so the disclosure relationship is one click away from every placement.
 */
const SponsoredLabel = () => (
  <Link
    to="/affiliate-disclosure"
    aria-label="Affiliate partner content — see disclosure"
    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
  >
    <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
    Sponsored · Affiliate partner
  </Link>
);

const FeaturedDealBanner = ({ placement, context, className = "" }: FeaturedDealBannerProps) => {
  const [banner, setBanner] = useState<FeaturedBanner | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setBanner(pickBanner({
      placement,
      nicheSlug: context?.nicheSlug,
      compareSlugs: context?.compareSlugs,
      siteSlug: context?.siteSlug,
    }));
  }, [placement, context?.nicheSlug, context?.compareSlugs, context?.siteSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!banner || typeof window === "undefined") return;
    logImpression({ sourcePage: window.location.pathname, destinationSlug: banner.siteSlug });
  }, [banner]);

  if (!banner) return null;

  // Auto-hide on mobile for very wide banners — they become illegible strips.
  if (isMobile && banner.aspect > 6) return null;

  const site = getSiteBySlug(banner.siteSlug);
  if (!site || !isAffiliated(site)) return null;
  const url = getVisitUrl(site);

  const handleClick = () => {
    logClick({
      sourcePage: typeof window !== "undefined" ? window.location.pathname : "/",
      destinationSlug: banner.siteSlug,
      destinationUrl: site.affiliate_url ?? site.homepage_url,
      ctaPosition: "featured-banner",
    });
  };

  return (
    <aside
      className={`mx-auto w-full max-w-[1280px] px-4 my-12 md:my-14 ${className}`}
      aria-label="Featured affiliate banner"
    >
      <div className="mb-2 flex items-center justify-between">
        <SponsoredLabel />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {banner.brandName}
        </span>
      </div>
      <Link
        to={url}
        onClick={handleClick}
        rel="sponsored noopener nofollow"
        className="block overflow-hidden rounded-lg border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        <SmartImage
          src={banner.src}
          alt={`${banner.brandName} — promotional banner`}
          aspectRatio="banner-wide"
          customAspect={`${banner.width} / ${banner.height}`}
          fit="contain"
          fallbackLabel={banner.brandName}
          className="w-full"
        />
      </Link>
    </aside>
  );
};

export default FeaturedDealBanner;
