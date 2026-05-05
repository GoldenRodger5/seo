import WorthItPage from "../../components/WorthItPage";
import { getSiteBySlug } from "../../data/sites";
import NotFound from "../NotFound";

const wrap = (slug: string) => () => {
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
