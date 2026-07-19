import { SiteData } from "../data/sites";
import { getSiteImagery, getCardImage } from "../data/site-imagery";
import SmartImage from "./common/SmartImage";

const SitePlaceholderImage = ({ site, className = "" }: { site: SiteData; className?: string }) => {
  const imagery = getSiteImagery(site.slug);
  // Strip-guarded: a leaderboard hero center-cropped to 3:2 renders as a
  // random zoomed body part. No art beats bad art — SmartImage's branded
  // fallbackLabel takes over when nothing card-safe exists.
  const heroImg = getCardImage(site.slug);

  return (
    <SmartImage
      src={heroImg}
      alt={imagery.banner_alt || `${site.name} preview`}
      aspectRatio="3:2"
      fallbackLabel={site.name}
      className={`rounded-lg ${className}`}
    />
  );
};

export default SitePlaceholderImage;
