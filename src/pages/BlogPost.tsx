import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Calendar, ArrowRight, Twitter } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import RelatedReading from "../components/RelatedReading";
import {
  getBlogPost,
  readingTimeMinutes,
  type BlogPost,
  type BlogBlock,
} from "../data/blog-posts";
import { sites, getSiteBySlug, isAffiliated } from "../data/sites";
import StarRating from "../components/StarRating";
import OutboundLink from "../components/OutboundLink";
import { getVerdict } from "../data/site-verdicts";
import { ArrowRight } from "lucide-react";

const BASE_URL = "https://twinkvault.com";

// ---------------------------------------------------------------------------
// Inline link parser: converts [anchor](url) sequences into <Link> components.
// External URLs (http://...) get rel="noopener noreferrer" and open new tabs.
// Internal paths (starting with /) use react-router <Link>.
// ---------------------------------------------------------------------------
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    if (m[1] !== undefined && m[2] !== undefined) {
      const anchor = m[1];
      const url = m[2];
      if (url.startsWith("/")) {
        parts.push(<Link key={i++} to={url} className="text-primary hover:underline">{anchor}</Link>);
      } else {
        parts.push(
          <a key={i++} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {anchor}
          </a>,
        );
      }
    } else if (m[3] !== undefined) {
      parts.push(<strong key={i++} className="text-foreground font-semibold">{m[3]}</strong>);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function SiteCtaBlock({ siteSlug, note }: { siteSlug: string; note?: string }) {
  const site = getSiteBySlug(siteSlug);
  if (!site) return null;
  const verdict = note ?? getVerdict(siteSlug) ?? `${site.overall_score}/5-rated · ${site.short_description}`;
  const oneLineVerdict = verdict.match(/^[^.!?]+[.!?]/)?.[0]?.trim() ?? verdict.trim();
  return (
    <div className="my-8 rounded-lg border border-secondary/30 bg-gradient-to-br from-secondary/[0.08] to-card/40 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">💡 Our pick</p>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <h3 className="font-heading text-lg font-bold text-foreground">{site.name}</h3>
        <span className="text-xs text-secondary font-semibold">{site.overall_score}/5</span>
        {site.deal_discount > 0 && (
          <span className="rounded-button bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            {site.deal_discount}% off
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{oneLineVerdict}</p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row">
        {isAffiliated(site) ? (
          <OutboundLink
            site={site}
            sourceTypeOverride="blog_inline_cta"
            ctaPosition="inline-blog"
            className="cta-btn gold-gradient inline-flex items-center justify-center gap-1.5 rounded-button px-5 py-2 text-sm font-semibold text-secondary-foreground"
          >
            Visit Site <ArrowRight size={13} />
          </OutboundLink>
        ) : (
          <a
            href={site.homepage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn gold-gradient inline-flex items-center justify-center gap-1.5 rounded-button px-5 py-2 text-sm font-semibold text-secondary-foreground"
          >
            Visit Site <ArrowRight size={13} />
          </a>
        )}
        <Link
          to={`/reviews/${site.slug}`}
          className="inline-flex items-center justify-center rounded-button border border-primary/40 px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          Read Full Review
        </Link>
      </div>
    </div>
  );
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 id={block.id} className="font-heading text-2xl font-bold text-foreground mt-10 mb-3 scroll-mt-24">{block.text}</h2>;
    case "h3":
      return <h3 id={block.id} className="font-heading text-xl font-bold text-foreground mt-6 mb-2 scroll-mt-24">{block.text}</h3>;
    case "p":
      return <p className="text-base text-muted-foreground leading-relaxed mb-4">{renderInline(block.text)}</p>;
    case "ul":
      return (
        <ul className="space-y-2 mb-4 ml-5">
          {block.items.map((item, i) => (
            <li key={i} className="list-disc text-base text-muted-foreground leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="my-6 rounded-lg border-l-4 border-l-secondary bg-card/60 p-5 text-sm leading-relaxed text-foreground/90">
          {renderInline(block.text)}
        </div>
      );
    case "site-cta":
      return <SiteCtaBlock siteSlug={block.siteSlug} note={block.note} />;
  }
}

function TableOfContents({ post }: { post: BlogPost }) {
  const items = post.body.filter((b): b is Extract<BlogBlock, { type: "h2" } | { type: "h3" }> => b.type === "h2" || b.type === "h3");
  if (items.length < 3) return null;
  return (
    <nav aria-label="Table of contents" className="mb-8 glass-card rounded-lg p-5">
      <h2 className="font-heading text-sm font-semibold mb-3 uppercase tracking-wider text-secondary">Contents</h2>
      <ol className="space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.id} className={it.type === "h3" ? "ml-4" : ""}>
            <a href={`#${it.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function RelatedSiteCards({ slugs }: { slugs: string[] }) {
  const found = slugs.map(getSiteBySlug).filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (found.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="font-heading text-2xl font-bold heading-gradient inline-block mb-6">Sites Mentioned</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {found.slice(0, 6).map((s) => (
          <Link key={s.slug} to={`/reviews/${s.slug}`} className="glass-card rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <p className="font-heading font-semibold truncate">{s.name}</p>
              <p className="text-sm text-secondary shrink-0 ml-2">{s.overall_score}/5</p>
            </div>
            <StarRating score={s.overall_score} size={11} />
            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{s.short_description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ShareButtons({ post }: { post: BlogPost }) {
  const url = `${BASE_URL}/blog/${post.slug}`;
  const title = post.title;
  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const reddit = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border/40 pt-6">
      <span className="text-xs font-medium text-muted-foreground">Share:</span>
      <a href={twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-button bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Twitter size={12} /> Twitter
      </a>
      <a href={reddit} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-button bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        Reddit
      </a>
    </div>
  );
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;
  if (!post) return <Navigate to="/blog" replace />;

  const url = `${BASE_URL}/blog/${post.slug}`;
  const fullTitle = `${post.title} | TwinkVault`;
  const readingMin = readingTimeMinutes(post);

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{fullTitle}</title>
          <meta name="description" content={post.meta_description} />
          <link rel="canonical" href={url} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={post.meta_description} />
          <meta property="og:url" content={url} />
          <meta property="og:image" content={`${BASE_URL}${post.featured_image}`} />
          <meta property="article:published_time" content={post.published_date} />
          <meta property="article:modified_time" content={post.updated_date} />
          <meta property="article:author" content={post.author} />
          <meta property="article:section" content={post.category} />
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.meta_description,
            image: `${BASE_URL}${post.featured_image}`,
            datePublished: post.published_date,
            dateModified: post.updated_date,
            author: { "@type": "Organization", name: post.author, url: BASE_URL },
            publisher: {
              "@type": "Organization",
              name: "TwinkVault",
              url: BASE_URL,
              logo: { "@type": "ImageObject", url: `${BASE_URL}/pwa-512.png` },
            },
            mainEntityOfPage: url,
            articleSection: post.category,
          }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL + "/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: BASE_URL + "/blog" },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          }) }} />

        <article className="py-12">
          <div className="container max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <span className="mx-2">/</span>
              <Link to={`/blog/category/${post.category}`} className="hover:text-foreground transition-colors capitalize">{post.category}</Link>
            </nav>

            <header className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-button bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary uppercase tracking-wider">
                {post.category}
              </span>
              <h1 className="mt-4 font-heading text-3xl md:text-4xl font-bold heading-gradient inline-block leading-tight">
                {post.h1}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {/* Byline always reads "By Isaac" — TwinkVault is a single-
                    reviewer site per /methodology byline section. If the
                    author roster ever expands beyond Isaac, render
                    post.author here instead. */}
                <span className="font-medium text-foreground/80">By Isaac</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(post.published_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  {readingMin} min read
                </span>
              </div>
              <p className="mt-4 text-lg text-foreground/85 leading-relaxed">{post.excerpt}</p>
            </header>

            <TableOfContents post={post} />

            <div className="article-body">
              {post.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            {/* Single closing CTA — directs readers to /reviews rather
                than to a specific affiliate. The inline BlogBlockSiteCta
                blocks within the body already handle per-mention CTAs;
                this is the catch-all for readers who reach the end. */}
            <div className="mt-10 border-t border-border/40 pt-8">
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 text-secondary hover:underline underline-offset-4 font-medium"
              >
                Browse all reviews →
              </Link>
            </div>

            <ShareButtons post={post} />
            <RelatedSiteCards slugs={post.related_sites} />
          </div>
        </article>

        <RelatedReading sourceType="blog" currentSlug={post.slug} relatedSiteSlugs={post.related_sites} relatedLandingPages={post.related_landing_pages} />
      </PageTransition>
    </Layout>
  );
};

export default BlogPostPage;
