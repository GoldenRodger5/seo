import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  to?: string; // omit for current page
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.to ? { item: `https://twinkvault.com${item.to}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-xs text-muted-foreground ${className}`}>
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {item.to ? (
                <Link to={item.to} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
              {i < items.length - 1 && <ChevronRight size={12} className="text-muted-foreground/50" />}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
};

export default Breadcrumbs;
