import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { getSiteBySlug } from "../data/sites";
import { supabase } from "@/integrations/supabase/client";

async function logClick(siteSlug: string, referrer: string) {
  try {
    await supabase.from("clicks").insert({
      site_slug: siteSlug,
      referrer_page: referrer,
      clicked_at: new Date().toISOString(),
    });
  } catch {
    // Silently fail — never block the redirect for a tracking error
  }
}

const GoRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const site = getSiteBySlug(slug || "");
  const [siteName] = useState(site?.name || "the site");

  useEffect(() => {
    if (!site) return;

    const referrer = document.referrer || "direct";
    logClick(site.slug, referrer);
    const targetUrl = site.affiliate_url || site.homepage_url;
    const timer = setTimeout(() => {
      window.open(targetUrl, "_blank");
    }, 1200);
    return () => clearTimeout(timer);
  }, [site]);

  if (!site) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Site not found</h1>
          <p className="mt-2 text-muted-foreground">We couldn't find a site matching "{slug}".</p>
          <Link to="/top-sites" className="mt-4 inline-block text-secondary hover:underline">Browse All Sites →</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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
