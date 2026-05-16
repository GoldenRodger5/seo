import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import {
  getAllPostsSorted,
  readingTimeMinutes,
} from "../data/blog-posts";

const POSTS_PER_PAGE = 12;
const BASE_URL = "https://twinkvault.com";

const BlogIndex = () => {
  const [page, setPage] = useState(1);
  const posts = getAllPostsSorted();
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const visible = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>Notes &amp; explainers — TwinkVault</title>
          <meta name="description" content="Longer-form pieces on the industry, individual sites, and how to think about the catalog." />
          <link rel="canonical" href={`${BASE_URL}/blog`} />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "TwinkVault Blog",
            url: `${BASE_URL}/blog`,
            description: "Editorial coverage of gay porn sites — guides, comparisons, pricing analysis, and industry trends.",
            publisher: {
              "@type": "Organization",
              name: "TwinkVault",
              url: BASE_URL,
              logo: { "@type": "ImageObject", url: `${BASE_URL}/pwa-512.png` },
            },
            blogPost: posts.slice(0, 12).map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `${BASE_URL}/blog/${p.slug}`,
              datePublished: p.published_date,
              author: { "@type": "Organization", name: p.author },
            })),
          })}</script>
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
            ],
          })}</script>
        </Helmet>

        <section className="py-16">
          <div className="container max-w-4xl">
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
              Notes &amp; explainers
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Longer-form pieces on the industry, individual sites, and how to think about the catalog. {posts.length} articles.
            </p>
            {/* Category nav removed — with under 12 articles the simple grid
                below is already scannable. Re-add if the catalog grows past
                a dozen and visitors start filtering. */}
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-4xl">
            <div className="grid gap-5">
              {visible.map((post) => {
                const mins = readingTimeMinutes(post);
                return (
                  <Link key={post.slug} to={`/blog/${post.slug}`} className="glass-card rounded-lg p-6 hover:border-primary/50 transition-colors block">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="rounded-button bg-secondary/15 px-2.5 py-0.5 text-[10px] font-medium text-secondary uppercase tracking-wider">{post.category}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar size={10} />
                        {new Date(post.published_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock size={10} />
                        {mins} min read
                      </span>
                    </div>
                    <h2 className="font-heading text-xl font-bold mb-2 leading-tight">{post.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary">
                      Read article <ArrowRight size={11} />
                    </span>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3 text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-button border border-border px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-button border border-border px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default BlogIndex;
