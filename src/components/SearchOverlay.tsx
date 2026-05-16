import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { sites, categories } from "../data/sites";
import LocalisedPrice from "./LocalisedPrice";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase();
  const matchedSites = q
    ? sites.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.short_description.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.categories.some((c) => c.replace(/-/g, " ").includes(q))
      )
    : [];

  const matchedCategories = q
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-background/90 backdrop-blur-sm pt-20" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Search size={20} className="text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites, categories, reviews..."
              aria-label="Search sites and categories"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 -mr-2"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>

          {query && (
            <div className="mt-3 max-h-96 overflow-y-auto space-y-1">
              {matchedSites.map((site) => (
                <Link
                  key={site.id}
                  to={`/reviews/${site.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-button p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-semibold">{site.name}</p>
                    <p className="text-xs text-muted-foreground">{site.overall_score}/5 · <LocalisedPrice usd={site.price_monthly} /></p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-secondary">
                    View Review <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
              {matchedCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-button p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">Category</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                </Link>
              ))}
              {matchedSites.length === 0 && matchedCategories.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No results found for "{query}"</p>
              )}
            </div>
          )}

          {!query && (
            <div className="py-4">
              <p className="mb-3 text-xs text-muted-foreground px-2">Popular searches</p>
              <div className="flex flex-wrap gap-2 px-2">
                {["helix studios review", "next door twink trial", "cheapest twink sites", "free trial", "bareback", "british twinks", "athletic twinks"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="rounded-button bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
