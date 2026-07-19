import type { SiteData } from "@/data/sites";
import { sites } from "@/data/sites";
import { siteNicheMap } from "@/data/site-niches";
import { getNiche } from "@/data/niches";
import { stripMonthlyUnit } from "@/lib/dealMath";

export interface FaqItem {
  q: string;
  a: string;
}

const findTopCompetitor = (site: SiteData): SiteData | null => {
  const myNiches = siteNicheMap[site.slug] ?? [];
  if (myNiches.length === 0) return null;
  const primary = myNiches[0];
  const candidates = sites
    .filter(
      (s) =>
        s.slug !== site.slug &&
        (siteNicheMap[s.slug] ?? []).includes(primary)
    )
    .sort((a, b) => b.overall_score - a.overall_score);
  return candidates[0] ?? null;
};

/**
 * Five purchase-intent questions tailored to this specific site:
 *  1. What's included in the $X/mo subscription
 *  2. How does it compare to the top competitor in the same niche
 *  3. Free trial / money-back guarantee
 *  4. What kind of {primary niche} content it produces
 *  5. Is the discount worth it vs. regular price
 */
export const generateSiteFaqs = (site: SiteData): FaqItem[] => {
  const competitor = findTopCompetitor(site);
  const myNiches = siteNicheMap[site.slug] ?? [];
  const primaryNiche = myNiches[0] ? getNiche(myNiches[0]) : null;
  const annualPerMo = stripMonthlyUnit(site.price_annual);

  const items: FaqItem[] = [];

  // 1. What's included
  items.push({
    q: `What's included in ${site.name}'s ${site.price_monthly} subscription?`,
    a: `A ${site.name} membership unlocks the full content library: streaming and downloads on desktop and mobile${site.has_hd ? ", with HD video quality" : ""}. ${site.short_description} ${site.update_frequency >= 80 ? "Updates land regularly, so the catalogue grows during your subscription." : "Update cadence is moderate; check our review for the latest pace."} The ${annualPerMo}/mo annual plan is the better value if you're committing.`,
  });

  // 2. Competitor comparison
  if (competitor) {
    items.push({
      q: `How does ${site.name} compare to ${competitor.name}?`,
      a: `Both compete in the ${primaryNiche?.displayName.toLowerCase() ?? "same"} space. ${site.name} scores ${site.overall_score}/5 vs ${competitor.name}'s ${competitor.overall_score}/5. ${site.overall_score >= competitor.overall_score ? `${site.name} edges ahead` : `${competitor.name} edges ahead`} on overall quality, but pricing differs: ${site.name} runs ${site.price_monthly} monthly while ${competitor.name} is ${competitor.price_monthly}. Read the full side-by-side comparison for the breakdown across content depth, value, updates, and mobile UX.`,
    });
  } else {
    items.push({
      q: `Is ${site.name} worth subscribing to?`,
      a: `At ${site.overall_score}/5, ${site.name} ${site.value_score >= 85 ? "is a strong value pick" : site.value_score >= 75 ? "earns its price tag if the niche fits you" : "is a niche-specific bet; value depends on whether the content matches your taste"}. The annual plan at ${annualPerMo}/mo is the way to subscribe; monthly at ${site.price_monthly} is a steep premium for the same library.`,
    });
  }

  // 3. Free trial / cancellation
  items.push({
    q: `Does ${site.name} have a free trial or money-back guarantee?`,
    a: site.has_free_trial
      ? `Yes. ${site.name} offers a trial period so you can browse the actual member area before committing. Use it to verify library depth, streaming quality, and whether the content matches what you saw in the trailer pages. Cancellations are processed through the standard billing portal.`
      : `Not currently. There's no free trial on ${site.name} as of this update. The cheapest entry point is the ${annualPerMo}/mo annual plan. Cancellations are processed through the standard billing portal; check the site's terms for refund policy specifics. The ${site.deal_discount > 0 ? `${site.deal_discount}% discount` : "low monthly price"} reduces the risk of trying it.`,
  });

  // 4. Niche content
  if (primaryNiche) {
    items.push({
      q: `What kind of ${primaryNiche.displayName.toLowerCase()} content does ${site.name} produce?`,
      a: `${site.name} focuses on ${myNiches.slice(0, 3).map((n) => getNiche(n)?.displayName.toLowerCase()).filter(Boolean).join(", ")} content. ${site.description.split(".").slice(0, 2).join(".")}. If you're specifically into ${primaryNiche.displayName.toLowerCase()}, this lineup will feel curated rather than incidental. For broader ${primaryNiche.displayName.toLowerCase()} options, browse our full ${primaryNiche.displayName.toLowerCase()} category.`,
    });
  } else {
    items.push({
      q: `Who is ${site.name} best for?`,
      a: `${site.best_for}. ${site.description.split(".").slice(0, 2).join(".")}.`,
    });
  }

  // 5. Discount worth it?
  if (site.deal_discount > 0) {
    items.push({
      q: `Is the ${site.name} ${site.deal_discount}% discount worth it vs. the regular price?`,
      a: `Yes: ${site.deal_text}. That brings the effective rate down to ${annualPerMo}/mo on the annual plan vs. ${site.price_monthly} at the monthly rate. The discount auto-applies through our affiliate link — no promo code needed. ${site.deal_type === "limited" ? "This deal is currently flagged as limited time, so pricing may change." : site.deal_type === "flash" ? "This is a flash deal, so pricing changes faster than usual." : "It's a standing discount, but the studio sets pricing and can change it without notice."}`,
    });
  } else {
    items.push({
      q: `What's the cheapest way to subscribe to ${site.name}?`,
      a: `The annual plan at ${annualPerMo}/mo is the lowest published rate. Monthly at ${site.price_monthly} is the most flexible but the most expensive per-month option. Quarterly at ${site.price_quarterly} sits in between. There's no active discount code beyond the built-in annual savings as of this update.`,
    });
  }

  return items;
};
