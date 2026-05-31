import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowUpDown, Check, X as XIcon } from "lucide-react";
import Layout from "../../components/Layout";
import { PageTransition } from "../../components/MotionWrappers";
import VisitSiteButton from "../../components/VisitSiteButton";
import { sites, isAffiliated, SiteData } from "../../data/sites";
import { TOTAL_SITES } from "../../lib/siteStats";
import { currentYear } from "../../lib/dates";

type SortKey =
  | "name"
  | "overall_score"
  | "content_quality"
  | "value_score"
  | "update_frequency"
  | "mobile_score"
  | "price_annual";

const path = "/gay-porn-sites-ranked";
const url = `https://twinkvault.com${path}`;
const fullTitle = `Gay Porn Sites Ranked — ${TOTAL_SITES} Sites Scored on 4 Criteria (${currentYear}) | TwinkVault`;
const description = `All ${TOTAL_SITES} gay porn sites in our database in one sortable table — content quality, value, updates, mobile, and price. Click any column header to re-sort.`;

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
    { "@type": "ListItem", position: 2, name: "Gay Porn Sites Ranked", item: url },
  ],
};

const parsePrice = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ""));

const SitesRanked = () => {
  const [sortKey, setSortKey] = useState<SortKey>("overall_score");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    const compare = (a: SiteData, b: SiteData): number => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "price_annual":
          cmp = parsePrice(a.price_annual) - parsePrice(b.price_annual);
          break;
        default:
          cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return asc ? cmp : -cmp;
    };
    return [...sites].filter((s) => s.editorial_status !== "pending-review").sort(compare);
  }, [sortKey, asc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "name" || key === "price_annual");
    }
  };

  const TH = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-secondary transition-colors ${sortKey === k ? "text-secondary" : ""}`}
      >
        {label} <ArrowUpDown size={11} />
      </button>
    </th>
  );

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{fullTitle}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={url} />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

        <section className="hero-mesh py-12">
          <div className="container max-w-5xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-button bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary">
                {TOTAL_SITES} Sites · 4 Criteria · Sortable
              </span>
              <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
                Gay Porn Sites Ranked — {TOTAL_SITES} Sites Scored on 4 Criteria
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Every site in our database in one sortable table. Click any column header to re-sort. Affiliated sites have a Visit button — non-affiliated sites are listed but link only to the review.
              </p>
              <nav aria-label="Breadcrumb" className="mt-4 text-xs text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">Gay Porn Sites Ranked</span>
              </nav>
            </motion.div>
          </div>
        </section>

        <section className="py-10">
          <div className="container max-w-6xl">
            <div className="overflow-x-auto rounded-lg glass-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card/40">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold">#</th>
                    <TH k="name" label="Site" />
                    <TH k="overall_score" label="Overall" />
                    <TH k="content_quality" label="Content" />
                    <TH k="value_score" label="Value" />
                    <TH k="update_frequency" label="Updates" />
                    <TH k="mobile_score" label="Mobile" />
                    <TH k="price_annual" label="Annual" />
                    <th className="px-3 py-3 text-center font-semibold">HD</th>
                    <th className="px-3 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, i) => (
                    <tr key={s.id} className={`border-b border-border/30 transition-colors hover:bg-primary/5 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="px-3 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-3 font-semibold whitespace-nowrap">
                        <Link to={`/reviews/${s.slug}`} className="hover:text-secondary transition-colors">
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 font-semibold text-secondary">{s.overall_score}</td>
                      <td className="px-3 py-3 text-muted-foreground">{s.content_quality}</td>
                      <td className="px-3 py-3 text-muted-foreground">{s.value_score}</td>
                      <td className="px-3 py-3 text-muted-foreground">{s.update_frequency}</td>
                      <td className="px-3 py-3 text-muted-foreground">{s.mobile_score}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{s.price_annual}</td>
                      <td className="px-3 py-3 text-center">
                        {s.has_hd ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isAffiliated(s) ? (
                          <VisitSiteButton site={s} label="Visit" showDisclosure={false} className="inline-block" />
                        ) : (
                          <Link to={`/reviews/${s.slug}`} className="text-xs text-muted-foreground hover:text-foreground">
                            Review →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              All scores reflect the current month's verification. Source data: {sites.length} sites in our review database. Sortable on any column.
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border/50 pt-6 text-sm">
              <Link to="/methodology" className="inline-flex items-center gap-1 font-medium text-secondary hover:underline">
                How we score sites →
              </Link>
              <Link to="/top-sites" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                Card view ranked list →
              </Link>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default SitesRanked;
