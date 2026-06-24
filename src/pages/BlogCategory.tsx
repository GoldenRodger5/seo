import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import {
  getPostsByCategory,
  readingTimeMinutes,
  BLOG_CATEGORIES,
  type BlogCategory as BCType,
} from "../data/blog-posts";

const BASE_URL = "https://twinkvault.com";
const VALID: BCType[] = ["guides", "comparisons", "industry", "money"];

const BlogCategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  if (!category || !(VALID as string[]).includes(category)) return <Navigate to="/blog" replace />;
  const cat = category as BCType;
  const meta = BLOG_CATEGORIES.find((c) => c.slug === cat)!;
  const posts = getPostsByCategory(cat);

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`${meta.label} — TwinkVault Blog`}</title>
          <meta name="description" content={`${meta.description} Browse all ${meta.label.toLowerCase()} articles from TwinkVault Editorial.`} />
          <link rel="canonical" href={`${BASE_URL}/blog/category/${cat}`} />
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${meta.label} — TwinkVault Blog`,
            description: meta.description,
            url: `${BASE_URL}/blog/category/${cat}`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: posts.length,
              itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${BASE_URL}/blog/${p.slug}`,
                name: p.title,
              })),
            },
          }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: meta.label, item: `${BASE_URL}/blog/category/${cat}` },
            ],
          }) }} />

        <section className="hero-mesh py-12">
          <div className="container max-w-4xl text-center">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground capitalize">{meta.label}</span>
            </nav>
            <h1 className="font-heading text-3xl md:text-4xl font-bold heading-gradient inline-block">{meta.label}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">{meta.description}</p>
            {posts.length > 0 && (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                We've published <strong>{posts.length}</strong> {meta.label.toLowerCase()} {posts.length === 1 ? "article" : "articles"} so far
                {posts.length > 0 && <>, including {posts.slice(0, 3).map((p) => p.title).join("; ")}</>}.
                Every piece is written after paying for and testing the sites involved, and we re-check pricing, trials, and
                deals monthly so the advice stays current. Browse the full list below, or head back to the{" "}
                <Link to="/blog" className="text-secondary hover:underline">main blog</Link> or our{" "}
                <Link to="/guides" className="text-secondary hover:underline">how-to guides</Link>.
              </p>
            )}
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-4xl">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground">No articles in this category yet. Check back soon.</p>
            ) : (
              <div className="grid gap-5">
                {posts.map((post) => {
                  const mins = readingTimeMinutes(post);
                  return (
                    <Link key={post.slug} to={`/blog/${post.slug}`} className="glass-card rounded-lg p-6 hover:border-primary/50 transition-colors block">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
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
            )}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default BlogCategoryPage;
