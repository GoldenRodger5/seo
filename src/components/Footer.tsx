import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card/50">
    <div className="container py-12">
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <Link to="/" className="font-heading text-xl font-bold">
          Twink<span className="gold-shimmer">Vault</span>
        </Link>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/top-sites" className="nav-link hover:text-foreground">Top Sites</Link>
          <Link to="/reviews" className="nav-link hover:text-foreground">Reviews</Link>
          <Link to="/best-deals" className="nav-link hover:text-foreground gold-gradient-text">Best Deals 🔥</Link>
          <Link to="/find-my-site" className="nav-link hover:text-foreground">Quiz</Link>
          <Link to="/about" className="nav-link hover:text-foreground">About</Link>
          <Link to="/privacy-policy" className="nav-link hover:text-foreground">Privacy Policy</Link>
          <Link to="/affiliate-disclosure" className="nav-link hover:text-foreground">Affiliate Disclosure</Link>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="rounded-button border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
          18+
        </span>
        <span className="text-xs text-muted-foreground">Adult Content</span>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
        TwinkVault.com is an adult content review site. All sites reviewed contain content intended for adults 18+. We earn commissions from affiliate links.
      </p>

      <p className="mt-2 text-center text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} TwinkVault. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
