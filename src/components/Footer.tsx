import { Link } from "react-router-dom";
import { sites } from "../data/sites";
import { CRAK_URL, trackCrakClick, MANFINDER_URL, trackManfinderClick } from "@/lib/crak";
import { getNiche } from "@/data/niches";

const footerLink = "text-sm text-muted-foreground hover:text-foreground transition-colors";

// Top 8 niches for footer hub-linking
const FOOTER_NICHES = ["twink", "bareback", "daddy", "bear", "asian", "latin", "amateur", "muscle"] as const;

const Footer = () => (
  <footer className="border-t border-border bg-card/50">
    <div className="container py-12">
      {/* Logo */}
      <Link to="/" className="font-heading text-xl font-bold inline-block mb-8">
        Twink<span className="gold-shimmer">Vault</span>
      </Link>

      {/* Column grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {/* Browse */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Browse</h3>
          <ul className="space-y-2">
            <li><Link to="/top-sites" className={footerLink}>Top Sites</Link></li>
            <li><Link to="/reviews" className={footerLink}>All Reviews</Link></li>
            <li><Link to="/best-deals" className={`${footerLink} gold-gradient-text`}>Best Deals</Link></li>
            <li><Link to="/compare" className={footerLink}>Compare Sites</Link></li>
            <li><Link to="/best-twink-sites" className={footerLink}>Best Twink Sites</Link></li>
            <li><Link to="/free-trial-twink-sites" className={footerLink}>Free Trial Sites</Link></li>
            <li><Link to="/cheapest-twink-sites" className={footerLink}>Cheapest Sites</Link></li>
          </ul>
        </div>

        {/* Niches (hubs) */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Browse Niches</h3>
          <ul className="space-y-2">
            {FOOTER_NICHES.map((slug) => {
              const niche = getNiche(slug);
              if (!niche) return null;
              return (
                <li key={slug}>
                  <Link to={`/niche/${slug}`} className={footerLink}>
                    {niche.displayName} Sites
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Discounts */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Discounts</h3>
          <ul className="space-y-2">
            {sites.slice(0, 8).map((site) => (
              <li key={site.id}>
                <Link to={`/discount/${site.slug}`} className={footerLink}>
                  {site.name} Discount
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Tools / Company */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Tools</h3>
          <ul className="space-y-2">
            <li><Link to="/ask-ai" className={footerLink}>AI Recommender</Link></li>
            <li><Link to="/find-my-site" className={footerLink}>Site Finder Quiz</Link></li>
          </ul>

          <h3 className="font-heading text-sm font-semibold mb-3 mt-6">Company</h3>
          <ul className="space-y-2">
            <li><Link to="/about" className={footerLink}>About</Link></li>
            <li><Link to="/methodology" className={footerLink}>Methodology</Link></li>
            <li><Link to="/contact" className={footerLink}>Contact</Link></li>
          </ul>

          <h3 className="font-heading text-sm font-semibold mb-3 mt-6">Gay Dating</h3>
          <ul className="space-y-2">
            <li>
              <a
                href={MANFINDER_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackManfinderClick(typeof window !== "undefined" ? window.location.pathname : "/")}
                className={footerLink}
              >
                Manfinder (Free)
              </a>
            </li>
            <li>
              <a
                href={CRAK_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackCrakClick(typeof window !== "undefined" ? window.location.pathname : "/")}
                className={footerLink}
              >
                Gay Hookup Sites
              </a>
            </li>
            <li>
              <Link to="/gay-dating-sites" className={footerLink}>Dating Sites Guide</Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Legal</h3>
          <ul className="space-y-2">
            <li><Link to="/privacy-policy" className={footerLink}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={footerLink}>Terms of Service</Link></li>
            <li><Link to="/affiliate-disclosure" className={footerLink}>Affiliate Disclosure</Link></li>
            <li><Link to="/2257" className={footerLink}>2257 Statement</Link></li>
            <li><Link to="/sitemap" className={footerLink}>Sitemap</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-2">
        <span className="rounded-button border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">18+</span>
        <span className="text-xs text-muted-foreground">Adult Content</span>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/70">
        TwinkVault.com is an adult content review site. All sites reviewed contain content intended for adults 18+. We earn commissions from affiliate links.
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground/50">
        &copy; {new Date().getFullYear()} TwinkVault. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
