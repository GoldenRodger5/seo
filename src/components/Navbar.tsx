import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", to: "/", gold: false },
  { label: "Top Sites", to: "/top-sites", gold: false },
  { label: "Reviews", to: "/top-sites", gold: false },
  { label: "Best Deals 🔥", to: "/best-deals", gold: true },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
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
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-button text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
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
      )}
    </nav>
  );
};

export default Navbar;
