import { Link } from "react-router-dom";
import { Check, X as XIcon, Tag } from "lucide-react";
import { SiteData } from "../data/sites";
import LocalisedPrice from "./LocalisedPrice";

/**
 * At-a-glance facts box — the data panel every established review
 * directory (RabbitsReviews, GayDemon) leads with. Buyers scan this
 * before reading prose; keeping it structured near the top shortens
 * time-to-decision. Only fields we actually track are shown — no
 * invented specs.
 */

const cadenceLabel = (score: number) => {
  if (score >= 88) return "Very active";
  if (score >= 75) return "Active";
  if (score >= 60) return "Moderate";
  return "Slow";
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium text-right">{children}</dd>
  </div>
);

const QuickFacts = ({ site }: { site: SiteData }) => {
  const hasDeal = site.deal_discount > 0;
  return (
    <div className="glass-card rounded-lg p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        At a glance
      </h3>
      <dl className="mt-2">
        <Row label="Monthly price">
          {hasDeal ? (
            <span>
              <s className="text-muted-foreground/70 font-normal mr-1.5">{site.price_monthly}</s>
              <LocalisedPrice usd={site.price_annual} />
              <span className="text-muted-foreground font-normal">/mo annual</span>
            </span>
          ) : (
            <LocalisedPrice usd={site.price_monthly} />
          )}
        </Row>
        {hasDeal && (
          <Row label="Best deal">
            <Link to={`/discount/${site.slug}`} className="inline-flex items-center gap-1 text-emerald-400 hover:underline">
              <Tag size={12} /> {site.deal_discount}% off
            </Link>
          </Row>
        )}
        <Row label="Free trial">
          {site.has_free_trial ? (
            <span className="inline-flex items-center gap-1 text-emerald-400"><Check size={13} /> Yes</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground"><XIcon size={13} /> No</span>
          )}
        </Row>
        <Row label="HD video">
          {site.has_hd ? (
            <span className="inline-flex items-center gap-1 text-emerald-400"><Check size={13} /> Yes</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground"><XIcon size={13} /> Limited</span>
          )}
        </Row>
        <Row label="Update pace">{cadenceLabel(site.update_frequency)}</Row>
        <Row label="Our score">{site.overall_score}/5</Row>
      </dl>
    </div>
  );
};

export default QuickFacts;
