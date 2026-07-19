/**
 * Generates 4-6 contextual FAQ entries for a /compare/{A}-vs-{B} page,
 * picking from a pool based on the pair's characteristics (price gap,
 * trial availability, shared/different niches, deal status).
 *
 * Replaces the previous always-identical 4-question template, which
 * caused Google to potentially classify 1,891 compare pages as near-
 * duplicates. Featured pairs get more variety per pair.
 */

import { type SiteData } from "../data/sites";
import { siteNicheMap } from "../data/site-niches";
import { getNiche } from "../data/niches";
import { currentYear } from "./dates";

export interface CompareFaq {
  q: string;
  a: string;
}

const parsePrice = (s: string): number => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;

function nicheLabel(slug: string): string {
  return getNiche(slug)?.displayName.toLowerCase() ?? slug.replace(/-/g, " ");
}

function primaryNiche(site: SiteData): string | undefined {
  return (siteNicheMap[site.slug] ?? [])[0];
}

export function generateCompareFaqs(a: SiteData, b: SiteData): CompareFaq[] {
  const winner = a.overall_score >= b.overall_score ? a : b;
  const loser = winner === a ? b : a;
  const aPrice = parsePrice(a.price_monthly);
  const bPrice = parsePrice(b.price_monthly);
  const cheaper = aPrice <= bPrice ? a : b;
  const pricier = cheaper === a ? b : a;
  const priceGap = Math.abs(aPrice - bPrice);

  const aNiches = new Set(siteNicheMap[a.slug] ?? []);
  const bNiches = new Set(siteNicheMap[b.slug] ?? []);
  const shared = [...aNiches].filter((n) => bNiches.has(n));
  const aPrimary = primaryNiche(a);
  const bPrimary = primaryNiche(b);

  const faqs: CompareFaq[] = [];

  // ── ALWAYS-INCLUDED: which is better overall ────────────────────────────
  faqs.push({
    q: `Which is better in ${currentYear}, ${a.name} or ${b.name}?`,
    a: `${winner.name} scored higher overall (${winner.overall_score}/5 vs ${loser.overall_score}/5). It edges ahead on ${winner.content_quality >= winner.value_score ? "content quality" : "value"}, though both sites have been independently tested and scored on the same methodology.`,
  });

  // ── PRICE GAP > $10: price-tier comparison intent ──────────────────────
  if (priceGap > 10) {
    faqs.push({
      q: `Is ${cheaper.name} worth choosing over ${pricier.name} just for the price?`,
      a: `${cheaper.name} is ${priceGap.toFixed(0)} cheaper per month at ${cheaper.price_monthly} vs ${pricier.price_monthly}. ${cheaper.overall_score >= pricier.overall_score ? `It also scores higher (${cheaper.overall_score}/5 vs ${pricier.overall_score}/5), so the savings come with no quality trade-off. Easy pick.` : `${pricier.name} scores higher (${pricier.overall_score}/5 vs ${cheaper.overall_score}/5), so the savings come with a real quality gap. Choose ${cheaper.name} if budget is the primary constraint.`}`,
    });
  }

  // ── TRIAL ASYMMETRY: one has, other doesn't ────────────────────────────
  if (a.has_free_trial !== b.has_free_trial) {
    const trialSite = a.has_free_trial ? a : b;
    const noTrialSite = trialSite === a ? b : a;
    faqs.push({
      q: `Does ${a.name} or ${b.name} let you try before buying?`,
      a: `Only ${trialSite.name} currently offers a trial; ${noTrialSite.name} doesn't have one listed. If you want to test the content before committing, start with ${trialSite.name}, then decide whether to add ${noTrialSite.name} later.`,
    });
  }

  // ── SHARED PRIMARY NICHE: which does the niche better ──────────────────
  if (shared.length > 0 && aPrimary && bPrimary && aPrimary === bPrimary) {
    const niche = nicheLabel(aPrimary);
    faqs.push({
      q: `Both ${a.name} and ${b.name} focus on ${niche} content. Which does it better?`,
      a: `${winner.name} edges ahead with a ${winner.overall_score}/5 overall score, but the gap is narrower in the ${niche} niche specifically. ${winner.name} wins on ${winner.content_quality >= winner.value_score ? "production polish" : "value-per-scene"}, while ${loser.name} ${loser.content_quality >= loser.value_score ? "delivers tighter casting" : "has the better annual price"}.`,
    });
  }

  // ── DIFFERENT PRIMARY NICHES: which fits what you want ─────────────────
  if (aPrimary && bPrimary && aPrimary !== bPrimary && !shared.includes(aPrimary) && !shared.includes(bPrimary)) {
    faqs.push({
      q: `${a.name} focuses on ${nicheLabel(aPrimary)}, ${b.name} on ${nicheLabel(bPrimary)}. Which fits what I'm looking for?`,
      a: `These two sites serve genuinely different audiences. Pick ${a.name} if ${nicheLabel(aPrimary)} content is your primary interest; pick ${b.name} if you specifically want ${nicheLabel(bPrimary)} content. There's limited overlap between the catalogs.`,
    });
  }

  // ── DEAL ASYMMETRY: one has discount, other doesn't ────────────────────
  if (a.deal_discount > 0 !== b.deal_discount > 0) {
    const dealSite = a.deal_discount > 0 ? a : b;
    const otherSite = dealSite === a ? b : a;
    faqs.push({
      q: `Is the ${dealSite.name} discount worth it vs paying full price for ${otherSite.name}?`,
      a: `${dealSite.name}'s ${dealSite.deal_discount}% discount drops the annual rate to ${dealSite.price_annual}, meaningful savings versus ${otherSite.name}'s standard pricing. If both sites would otherwise fit your taste, the discount tips the value math toward ${dealSite.name} for the first year.`,
    });
  }

  // ── ALWAYS-INCLUDED: can I subscribe to both ───────────────────────────
  faqs.push({
    q: `Can I subscribe to both ${a.name} and ${b.name}?`,
    a: `Yes, and many subscribers do. Both bill discreetly and let you cancel anytime. If you're undecided, start with the higher-scored option (${winner.name}) on the annual plan and add the other later if you want broader coverage.`,
  });

  // Cap at 6 to keep page weight reasonable.
  return faqs.slice(0, 6);
}
