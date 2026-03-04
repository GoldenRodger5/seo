import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <Link to="/" className="font-heading text-xl font-bold">
          Twink<span className="gold-gradient-text">Vault</span>
        </Link>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/affiliate-disclosure" className="hover:text-foreground transition-colors">Affiliate Disclosure</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
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
