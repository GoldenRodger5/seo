import WorthItPage from "../../components/WorthItPage";
import { getSiteBySlug } from "../../data/sites";
import { ISWORTHIT_CONTENT } from "../../data/isworthit-content";
import NotFound from "../NotFound";

const wrap = (slug: string) => () => {
  const site = getSiteBySlug(slug);
  if (!site) return <NotFound />;
  return <WorthItPage site={site} />;
};

/** Slugs with hand-declared routes below — kept for URL stability. */
const HAND_ROUTED = new Set([
  "nakedsword", "sean-cody", "helix-studios", "men", "twinks-in-shorts",
  "southern-strokes", "peterfever", "sayuncle", "rawhole", "athletic-twinks",
]);

/**
 * Every ISWORTHIT_CONTENT key beyond the hand-routed set gets a route
 * automatically (App.tsx maps these). Before this, the engine could publish
 * isworthit content for a site with no route — /is-next-door-twink-worth-it
 * was generated 2026-07-17, persisted, pinged to Google… and served the
 * homepage via the SPA fallback. Content is the routing source of truth now.
 */
export const dynamicWorthItSlugs = Object.keys(ISWORTHIT_CONTENT).filter((s) => !HAND_ROUTED.has(s));

export const DynamicWorthIt = ({ slug }: { slug: string }) => {
  const site = getSiteBySlug(slug);
  if (!site) return <NotFound />;
  return <WorthItPage site={site} />;
};

export const IsNakedSwordWorthIt = wrap("nakedsword");
export const IsSeanCodyWorthIt = wrap("sean-cody");
export const IsHelixWorthIt = wrap("helix-studios");
export const IsMenWorthIt = wrap("men");
export const IsTwinksInShortsWorthIt = wrap("twinks-in-shorts");
export const IsSouthernStrokesWorthIt = wrap("southern-strokes");
export const IsPeterFeverWorthIt = wrap("peterfever");
export const IsSayUncleWorthIt = wrap("sayuncle");
export const IsRawHoleWorthIt = wrap("rawhole");
export const IsAthleticTwinksWorthIt = wrap("athletic-twinks");
