import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Home", to: "/", gold: false },
  { label: "Top Sites", to: "/top-sites", gold: false },
  { label: "Reviews", to: "/reviews", gold: false },
  { label: "Methodology", to: "/methodology", gold: false },
  { label: "Compare", to: "/compare", gold: false },
  { label: "Blog", to: "/blog", gold: false },
  { label: "Ask TwinkAI", to: "/ask-ai", gold: false },
  { label: "Best Deals", to: "/best-deals", gold: true },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location]);

  // Lock body scroll when the mobile menu is open so the underlying
  // page doesn't scroll behind the panel. Cleanup restores on close
  // and on unmount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev;
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border glass-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight">
            Twink<span className="gold-shimmer">Vault</span>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to + link.label}
                to={link.to}
                className={`nav-link hover:text-secondary ${
                  link.gold ? "gold-gradient-text" : 
                  location.pathname === link.to ? "text-secondary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
          </div>

          {/* Mobile toggle — 44×44 tap targets meet WCAG 2.5.5 minimum */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-button text-foreground active:bg-muted/50"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-button text-foreground active:bg-muted/50"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — panel + tap-outside-to-close backdrop */}
        {open && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 top-16 z-30 bg-background/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="relative z-40 border-t border-border bg-background">
              <div className="container flex flex-col gap-1 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`nav-link rounded-button px-4 py-3 hover:bg-muted ${
                      link.gold ? "gold-gradient-text" :
                      location.pathname === link.to ? "text-secondary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
