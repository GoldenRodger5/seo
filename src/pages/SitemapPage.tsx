import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { sites, categories } from "../data/sites";
import { PageTransition } from "../components/MotionWrappers";

const comparePairs = [
  { a: "helix-studios", b: "twink-in-shorts" },
  { a: "helix-studios", b: "athletic-twinks" },
  { a: "twink-in-shorts", b: "southern-strokes" },
  { a: "athletic-twinks", b: "daddy-on-twink" },
  { a: "southern-strokes", b: "twinks-bareback" },
  { a: "touch-that-boy", b: "breed-me-raw" },
];

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
                {comparePairs.map(({ a, b }) => (
                  <li key={`${a}-${b}`}>
                    <Link to={`/compare/${a}-vs-${b}`} className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                      {a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} vs {b.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold mb-4">About & Info</h2>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-muted-foreground hover:text-secondary transition-colors">About</Link></li>
                <li><Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/affiliate-disclosure" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Affiliate Disclosure</Link></li>
                <li><Link to="/best-deals" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Best Deals</Link></li>
                <li><Link to="/top-sites" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Top Sites</Link></li>
                <li><Link to="/reviews" className="text-sm text-muted-foreground hover:text-secondary transition-colors">All Reviews</Link></li>
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
