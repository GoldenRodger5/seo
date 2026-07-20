import { Link } from "react-router-dom";
import type { SiteData } from "../data/sites";
import { parseMonthlyPrice } from "../lib/dealMath";

/**
 * Programmatic, data-driven content block for niche/category landing pages.
 *
 * These pages were thin (just a short niche.description + a card grid +
 * boilerplate FAQ shared verbatim across 27 pages). Rather than hand-write or
 * LLM-generate prose per page, this composes UNIQUE content from the scores +
 * pricing already in sites.ts: a stats summary sentence and a scannable
 * comparison table. Every page differs because its sites/numbers differ, it
 * self-updates with the data, it's featured-snippet-friendly, and it adds a
 * dense set of contextual /reviews/{slug} internal links.
 */
interface LandingDataBlockProps {
  sites: SiteData[];
  /** Lowercased descriptor used in the prose, e.g. "twink" or "best-value". */
  label: string;
}

const fmtPrice = (s: SiteData): string => {
  const p = parseMonthlyPrice(s.price_monthly);
  return p != null ? `$${p.toFixed(2)}/mo` : s.price_monthly || "—";
};

const LandingDataBlock = ({ sites, label }: LandingDataBlockProps) => {
  // Need at least a couple of sites for a comparison to be meaningful.
  if (sites.length < 2) return null;

  const byScore = [...sites].sort((a, b) => b.overall_score - a.overall_score);
  const top = byScore[0];
  const bestValue = [...sites].sort((a, b) => b.value_score - a.value_score)[0];
  const priced = sites
    .map((s) => ({ s, p: parseMonthlyPrice(s.price_monthly) }))
    .filter((x): x is { s: SiteData; p: number } => x.p != null);
  const cheapest = priced.length ? priced.reduce((a, b) => (b.p < a.p ? b : a)).s : null;
  const trials = sites.filter((s) => s.has_free_trial).length;
  const hd = sites.filter((s) => s.has_hd).length;
  const scores = sites.map((s) => s.overall_score);
  const lo = Math.min(...scores).toFixed(1);
  const hi = Math.max(...scores).toFixed(1);

  return (
    <section className="py-8 border-b border-border">
      <div className="container max-w-4xl">
        <p className="text-muted-foreground leading-relaxed">
          We've paid for and scored <strong>{sites.length}</strong> {label} sites, rated {lo}–{hi} out of 5.
          The highest-scored is{" "}
          <Link to={`/reviews/${top.slug}`} className="text-secondary hover:underline">{top.name}</Link>{" "}
          ({top.overall_score.toFixed(1)}/5)
          {bestValue.slug !== top.slug && (
            <>
              , while the best value for money is{" "}
              <Link to={`/reviews/${bestValue.slug}`} className="text-secondary hover:underline">{bestValue.name}</Link>
            </>
          )}
          .{cheapest && <> Monthly pricing starts at <strong>{fmtPrice(cheapest)}</strong> with {cheapest.name}.</>}
          {trials > 0 && <> {trials} of them offer a free or discounted trial</>}
          {hd > 0 && <>{trials > 0 ? ", and " : " "}{hd} stream in full HD</>}
          {(trials > 0 || hd > 0) && <>.</>} Every score below comes from hands-on review — paid memberships and close research — re-checked monthly.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">{label} gay porn sites compared by score, value, price, and free trial</caption>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-semibold">Site</th>
                <th scope="col" className="py-2 px-3 font-semibold text-center">Score</th>
                <th scope="col" className="py-2 px-3 font-semibold text-center">Value</th>
                <th scope="col" className="py-2 px-3 font-semibold text-center">From</th>
                <th scope="col" className="py-2 px-3 font-semibold text-center">Free trial</th>
                <th scope="col" className="py-2 pl-3 font-semibold">Best for</th>
              </tr>
            </thead>
            <tbody>
              {byScore.map((s) => (
                <tr key={s.slug} className="border-b border-border/40">
                  <td className="py-2 pr-4 font-semibold">
                    <Link to={`/reviews/${s.slug}`} className="hover:text-secondary">{s.name}</Link>
                  </td>
                  <td className="py-2 px-3 text-center">{s.overall_score.toFixed(1)}</td>
                  <td className="py-2 px-3 text-center">{s.value_score.toFixed(1)}</td>
                  <td className="py-2 px-3 text-center whitespace-nowrap">{fmtPrice(s)}</td>
                  <td className="py-2 px-3 text-center">{s.has_free_trial ? "Yes" : "—"}</td>
                  <td className="py-2 pl-3 text-muted-foreground">{s.best_for || s.short_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default LandingDataBlock;
