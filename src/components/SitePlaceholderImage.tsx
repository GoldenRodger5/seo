import { SiteData } from "../data/sites";

const SitePlaceholderImage = ({ site, className = "" }: { site: SiteData; className?: string }) => {
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
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
};

export default SitePlaceholderImage;
