import { SiteData } from "../data/sites";
import { getSiteImagery } from "../data/site-imagery";

const SitePlaceholderImage = ({ site, className = "" }: { site: SiteData; className?: string }) => {
  const imagery = getSiteImagery(site.slug);
  const heroImg = imagery.hero_image_url ?? imagery.thumbnail_url;

  if (heroImg) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden bg-muted/40 ${className}`}
        style={{ aspectRatio: "3 / 2" }}
      >
        <img
          src={heroImg}
          alt={imagery.banner_alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 20%" }}
        />
      </div>
    );
  }

  const initials = site.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    "from-primary/30 to-primary/10",
    "from-secondary/30 to-secondary/10",
    "from-primary/20 to-secondary/20",
  ];
  const colorIndex = parseInt(site.id) % colors.length;

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[colorIndex]} bg-card`} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-4xl font-bold text-foreground/15">{initials}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
};

export default SitePlaceholderImage;
