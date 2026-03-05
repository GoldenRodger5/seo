import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getSiteBySlug } from "../data/sites";

const GoRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [siteName, setSiteName] = useState("the site");

  useEffect(() => {
    const site = getSiteBySlug(slug || "");
    if (site) {
      setSiteName(site.name);
      // Only redirect via /go/ if the site has an affiliate URL
      const targetUrl = site.affiliate_url || site.homepage_url;
      const timer = setTimeout(() => {
        window.open(targetUrl, "_blank");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  const site = getSiteBySlug(slug || "");

  if (!site) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Site not found</h1>
          <Link to="/top-sites" className="mt-4 inline-block text-secondary">Browse Sites →</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        <p className="mt-6 font-heading text-xl font-semibold">Taking you to {siteName}...</p>
        <p className="mt-2 text-sm text-muted-foreground">You'll be redirected shortly.</p>
        <Link to="/top-sites" className="mt-6 text-xs text-muted-foreground hover:text-foreground">
          ← Back to rankings
        </Link>
      </div>
    </Layout>
  );
};

export default GoRedirect;
