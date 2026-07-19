import { Link } from "react-router-dom";
import DealAlertSignup from "./DealAlertSignup";
import { CRAK_URL, trackCrakClick, MANFINDER_URL, trackManfinderClick } from "@/lib/crak";
import { getNiche } from "@/data/niches";
import { getPopularComparisons } from "@/data/comparisons";
import { getSiteBySlug } from "@/data/sites";

const footerLink = "text-sm text-muted-foreground hover:text-foreground transition-colors";

// Top 8 niches for footer hub-linking
const FOOTER_NICHES = ["twink", "bareback", "daddy", "bear", "asian", "latin", "amateur", "muscle"] as const;

const POPULAR_COMPARISONS = getPopularComparisons(5);

const Footer = () => (
  <footer className="border-t border-border bg-card/50">
    <div className="container py-12">
      {/* Logo */}
      <Link to="/" className="font-heading text-xl font-bold inline-block mb-8">
        Twink<span className="gold-shimmer">Vault</span>
      </Link>

      {/* 4-column primary navigation backbone (Top Sites / Browse Niches / Compare / About) */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Top Sites */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Top Sites</h3>
          <ul className="space-y-2">
            <li><Link to="/top-sites" className={footerLink}>Top Sites</Link></li>
            <li><Link to="/reviews" className={footerLink}>All Reviews</Link></li>
            <li><Link to="/best-deals" className={`${footerLink} gold-gradient-text`}>Best Deals</Link></li>
            <li><Link to="/best-twink-sites" className={footerLink}>Best Twink Sites</Link></li>
            <li><Link to="/free-trial-twink-sites" className={footerLink}>Free Trial Sites</Link></li>
            <li><Link to="/cheapest-twink-sites" className={footerLink}>Cheapest Sites</Link></li>
          </ul>
        </div>

        {/* Browse Niches — dynamic top 8 from siteStats */}
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

        {/* Compare — multi-site builder + 5 most popular static comparisons */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Compare</h3>
          <ul className="space-y-2">
            <li><Link to="/compare" className={footerLink}>Build a Comparison</Link></li>
            {POPULAR_COMPARISONS.map((pair) => {
              const a = getSiteBySlug(pair.siteA);
              const b = getSiteBySlug(pair.siteB);
              if (!a || !b) return null;
              return (
                <li key={pair.slug}>
                  <Link to={`/compare/${pair.slug}`} className={footerLink}>
                    {a.name} vs {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* About */}
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">About</h3>
          <ul className="space-y-2">
            <li><Link to="/about" className={footerLink}>About</Link></li>
            <li><Link to="/methodology" className={footerLink}>Methodology</Link></li>
            <li><Link to="/contact" className={footerLink}>Contact</Link></li>
            <li><Link to="/privacy-policy" className={footerLink}>Privacy Policy</Link></li>
            <li><Link to="/2257" className={footerLink}>2257 Statement</Link></li>
            <li><Link to="/affiliate-disclosure" className={footerLink}>Affiliate Disclosure</Link></li>
            <li><Link to="/terms" className={footerLink}>Terms of Service</Link></li>
            <li><Link to="/sitemap" className={footerLink}>Sitemap</Link></li>
          </ul>
        </div>
      </div>

      {/* Popular Lists */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2 border-t border-border/40 pt-8">
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Popular Lists</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li><Link to="/discount/twinktrade" className={`${footerLink} gold-gradient-text`}>Featured Deal: TwinkTrade · 67% Off</Link></li>
            <li><Link to="/best-gay-sites-under-10" className={footerLink}>Best Sites Under $10</Link></li>
            <li><Link to="/best-cheap-gay-porn-sites" className={footerLink}>Best Cheap Gay Porn Sites</Link></li>
            <li><Link to="/best-bareback-gay-sites" className={footerLink}>Best Bareback Sites</Link></li>
            <li><Link to="/best-bareback-twink-sites" className={footerLink}>Best Bareback Twink Sites</Link></li>
            <li><Link to="/best-twink-porn-sites-with-free-trials" className={footerLink}>Twink Sites with Free Trials</Link></li>
            <li><Link to="/best-amateur-gay-sites" className={footerLink}>Best Amateur Sites</Link></li>
            <li><Link to="/best-premium-gay-sites" className={footerLink}>Best Premium Sites</Link></li>
            <li><Link to="/best-asian-gay-sites" className={footerLink}>Best Asian Sites</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Gay Porn Site Reviews</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li><Link to="/best-gay-porn-sites" className={footerLink}>Best Gay Porn Sites</Link></li>
            <li><Link to="/best-gay-porn-subscription" className={footerLink}>Best Subscription</Link></li>
            <li><Link to="/gay-porn-site-reviews" className={footerLink}>Review Directory</Link></li>
            <li><Link to="/best-value-gay-porn-sites" className={footerLink}>Best Value</Link></li>
            <li><Link to="/gay-porn-sites-ranked" className={footerLink}>Sortable Rankings</Link></li>
          </ul>
        </div>
      </div>

      {/* Secondary row — Tools / Gay Dating */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2 border-t border-border/40 pt-8">
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Tools</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li><Link to="/ask-ai" className={footerLink}>Site Recommender</Link></li>
            <li><Link to="/find-my-site" className={footerLink}>Site Finder Quiz</Link></li>
            <li><Link to="/gay-porn-pricing-index" className={footerLink}>Gay Porn Pricing Index</Link></li>
            <li><Link to="/guides" className={footerLink}>Guides</Link></li>
            <li><Link to="/blog" className={footerLink}>Blog</Link></li>
            <li><Link to="/gay-dating-sites" className={footerLink}>Dating Sites Guide</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold mb-3">Gay Dating</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
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
          </ul>
        </div>
      </div>

      <DealAlertSignup source="footer" className="mt-10" />

      <div className="mt-10 flex items-center justify-center gap-2">
        <span className="rounded-button border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">18+</span>
        <span className="text-xs text-muted-foreground">Adult Content</span>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/70">
        <Link to="/" className="hover:text-foreground underline-offset-2 hover:underline">TwinkVault ranks the best twink sites</Link> from paid memberships. TwinkVault.com is an adult content review site. All sites reviewed contain content intended for adults 18+. TwinkVault uses partner links — commissions never influence our rankings.
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground/50">
        &copy; {new Date().getFullYear()} TwinkVault. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
