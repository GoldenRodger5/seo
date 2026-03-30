import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "../components/Layout";
import { sites, categories } from "../data/sites";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container py-24 text-center">
        <h1 className="font-heading text-6xl font-bold text-muted-foreground/30">404</h1>
        <h2 className="mt-4 font-heading text-2xl font-bold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page <code className="rounded bg-muted px-2 py-0.5 text-sm">{location.pathname}</code> doesn't exist.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
          >
            Go Home
          </Link>
          <Link
            to="/top-sites"
            className="inline-flex items-center gap-2 rounded-button border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            View Rankings
          </Link>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <h3 className="font-heading text-lg font-semibold">Top Rated Sites</h3>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {sites.slice(0, 5).map((site) => (
              <Link
                key={site.id}
                to={`/reviews/${site.slug}`}
                className="rounded-button bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                {site.name}
              </Link>
            ))}
          </div>

          <h3 className="mt-8 font-heading text-lg font-semibold">Browse Categories</h3>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="rounded-button border border-primary/30 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
