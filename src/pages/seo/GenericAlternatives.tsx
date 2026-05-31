import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import SeoLandingPage from "../../components/SeoLandingPage";
import { getSimilarSites } from "../../lib/similarSites";
import { getAlternativesBody } from "../../data/alternatives-content";
import { getSiteBySlug } from "../../data/sites";
import Layout from "../../components/Layout";

/**
 * Generic per-site alternatives page.
 *
 * URL: /alternatives/{site-slug}
 * Reads body from ALTERNATIVES_CONTENT keyed as "{site-slug}-alternatives".
 *
 * Existed previously only as hand-coded routes for Helix / Sean Cody /
 * NakedSword. This handles every site that's in the alternatives content
 * map — every queued alternatives page now has a destination.
 */
const GenericAlternatives = () => {
  const { slug } = useParams<{ slug: string }>();
  const site = slug ? getSiteBySlug(slug) : undefined;
  const aiBody = slug ? getAlternativesBody(`${slug}-alternatives`) : undefined;

  if (!site) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">Site not found</h1>
          <Link to="/reviews" className="mt-4 inline-block text-secondary hover:underline">
            Browse all reviews →
          </Link>
        </div>
      </Layout>
    );
  }

  const similarSites = getSimilarSites(site.slug, 5);

  return (
    <SeoLandingPage
      path={`/alternatives/${site.slug}`}
      title={`${site.name} Alternatives`}
      description={`The best alternatives to ${site.name} — ranked by overlap on content style, pricing, and library depth. Updated for 2026.`}
      h1={`Best Alternatives to ${site.name}`}
      badge="Alternatives"
      intro={`Looking for sites similar to ${site.name}? These five alternatives match different parts of what makes ${site.name} worth paying for — production quality, niche aesthetic, or library size. Ranked by how closely they overlap.`}
      sites={similarSites}
      related={[
        { to: `/reviews/${site.slug}`, label: `${site.name} review` },
        { to: "/reviews", label: "All reviews" },
      ]}
      aiBody={aiBody}
    />
  );
};

export default GenericAlternatives;
