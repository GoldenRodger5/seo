import type { SiteData } from "../data/sites";
import { displayPillarScore } from "../lib/scoreFormatting";
import { parseMonthlyPrice } from "../lib/dealMath";

/**
 * Programmatic, data-driven comparison block for compare-pair pages that have
 * NO AI body (most featured pairs). Those pages skipped the comparison_categories
 * + verdict article and rendered ~590 words — just under target. This composes a
 * unique pillar-by-pillar breakdown from the four scores in sites.ts (content,
 * value, updates, mobile), a per-pillar winner, a price comparison, and each
 * site's "best for" — no AI generation, self-updating, scannable, snippet-ready.
 */
const PILLARS = [
  { label: "Content Quality", key: "content_quality" as const },
  { label: "Value for Money", key: "value_score" as const },
  { label: "Update Frequency", key: "update_frequency" as const },
  { label: "Mobile Experience", key: "mobile_score" as const },
];

interface CompareDataBlockProps {
  siteA: SiteData;
  siteB: SiteData;
}

const CompareDataBlock = ({ siteA, siteB }: CompareDataBlockProps) => {
  const aWins = PILLARS.filter((p) => (siteA[p.key] as number) > (siteB[p.key] as number)).map((p) => p.label);
  const bWins = PILLARS.filter((p) => (siteB[p.key] as number) > (siteA[p.key] as number)).map((p) => p.label);
  const pa = parseMonthlyPrice(siteA.price_monthly);
  const pb = parseMonthlyPrice(siteB.price_monthly);
  const cheaper = pa != null && pb != null && pa !== pb ? (pa < pb ? siteA : siteB) : null;

  return (
    <section className="mt-8 glass-card rounded-lg p-6">
      <h2 className="font-heading text-lg font-bold">How {siteA.name} and {siteB.name} compare on our scores</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        We've scored both after paying for a membership. {siteA.name} rates {siteA.overall_score}/5 overall and{" "}
        {aWins.length ? <>leads on {aWins.join(", ")}</> : <>trails across the board</>}
        {bWins.length ? <>, while {siteB.name} ({siteB.overall_score}/5) is stronger on {bWins.join(", ")}</> : <>, with {siteB.name} close behind at {siteB.overall_score}/5</>}.
        {cheaper && <> {cheaper.name} is the cheaper of the two at {cheaper === siteA ? `$${pa!.toFixed(2)}` : `$${pb!.toFixed(2)}`}/mo.</>}
        {siteA.has_free_trial !== siteB.has_free_trial && (
          <> Only {(siteA.has_free_trial ? siteA : siteB).name} currently offers a free trial.</>
        )}
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">{siteA.name} vs {siteB.name} scored across four pillars</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-semibold">Category</th>
              <th scope="col" className="py-2 px-3 font-semibold text-center">{siteA.name}</th>
              <th scope="col" className="py-2 px-3 font-semibold text-center">{siteB.name}</th>
              <th scope="col" className="py-2 pl-3 font-semibold">Winner</th>
            </tr>
          </thead>
          <tbody>
            {PILLARS.map((p) => {
              const av = siteA[p.key] as number;
              const bv = siteB[p.key] as number;
              const winner = av === bv ? "Tie" : av > bv ? siteA.name : siteB.name;
              return (
                <tr key={p.key} className="border-b border-border/40">
                  <td className="py-2 pr-4 font-medium">{p.label}</td>
                  <td className="py-2 px-3 text-center">{displayPillarScore(av)}</td>
                  <td className="py-2 px-3 text-center">{displayPillarScore(bv)}</td>
                  <td className="py-2 pl-3 text-muted-foreground">{winner}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(siteA.best_for || siteB.best_for) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
          {siteA.best_for && (
            <p className="text-muted-foreground"><strong className="text-foreground">{siteA.name} is best for:</strong> {siteA.best_for}</p>
          )}
          {siteB.best_for && (
            <p className="text-muted-foreground"><strong className="text-foreground">{siteB.name} is best for:</strong> {siteB.best_for}</p>
          )}
        </div>
      )}
    </section>
  );
};

export default CompareDataBlock;
