import { SiteData } from "../data/sites";
import { getSiteImagery } from "../data/site-imagery";
import SmartImage from "./common/SmartImage";

const SitePlaceholderImage = ({ site, className = "" }: { site: SiteData; className?: string }) => {
  const imagery = getSiteImagery(site.slug);
  const heroImg = imagery.hero_image_url ?? imagery.thumbnail_url;

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
