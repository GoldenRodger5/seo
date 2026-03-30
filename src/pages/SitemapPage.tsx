import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { sites, categories } from "../data/sites";
import { PageTransition } from "../components/MotionWrappers";

// Auto-generate all pairs from real sites
const comparePairs = sites.flatMap((siteA, i) =>
  sites.slice(i + 1).map((siteB) => ({ a: siteA.slug, b: siteB.slug, nameA: siteA.name, nameB: siteB.name }))
);

const SitemapPage = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>Sitemap — TwinkVault</title>
        <meta name="description" content="Browse everything on TwinkVault. All reviews, categories, comparisons, and info pages." />
      </Helmet>
      <section className="py-16">
        <div className="container max-w-3xl">
          <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Everything on TwinkVault</h1>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Top Ranked Sites</h2>
              <ul className="space-y-2">
                {sites.map((site) => (
                  <li key={site.id}>
                    <Link to={`/reviews/${site.slug}`} className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                      {site.name} Review
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Categories</h2>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link to={`/category/${cat.slug}`} className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Comparisons</h2>
              <ul className="space-y-2">
                {comparePairs.map(({ a, b, nameA, nameB }) => (
                  <li key={`${a}-${b}`}>
                    <Link to={`/compare/${a}-vs-${b}`} className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                      {nameA} vs {nameB}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Discounts & Deals</h2>
              <ul className="space-y-2">
                {sites.map((site) => (
                  <li key={`discount-${site.id}`}>
                    <Link to={`/discount/${site.slug}`} className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                      {site.name} Discount
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold mb-4">About & Info</h2>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-muted-foreground hover:text-secondary transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Contact</Link></li>
                <li><Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Terms of Service</Link></li>
                <li><Link to="/affiliate-disclosure" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Affiliate Disclosure</Link></li>
                <li><Link to="/2257" className="text-sm text-muted-foreground hover:text-secondary transition-colors">2257 Statement</Link></li>
                <li><Link to="/best-deals" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Best Deals</Link></li>
                <li><Link to="/top-sites" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Top Sites</Link></li>
                <li><Link to="/reviews" className="text-sm text-muted-foreground hover:text-secondary transition-colors">All Reviews</Link></li>
                <li><Link to="/best-twink-sites" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Best Twink Sites</Link></li>
                <li><Link to="/free-trial-twink-sites" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Free Trial Sites</Link></li>
                <li><Link to="/cheapest-twink-sites" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Cheapest Sites</Link></li>
                <li><Link to="/ask-ai" className="text-sm text-muted-foreground hover:text-secondary transition-colors">AI Recommender</Link></li>
                <li><Link to="/find-my-site" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Site Finder Quiz</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default SitemapPage;
