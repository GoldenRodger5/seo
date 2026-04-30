import { supabase } from "@/integrations/supabase/client";

export const CRAK_URL =
  "https://t.mbjms.com/412371/4080/0?aff_sub5=SF_006OG000004lmDN";

export const MANFINDER_URL =
  "https://t.crdtg2.com/412371/6488?aff_sub5=SF_006OG000004lmDN";

function logClick(siteSlug: string, referrerPage: string): void {
  supabase
    .from("clicks")
    .insert({ site_slug: siteSlug, referrer_page: referrerPage, clicked_at: new Date().toISOString() })
    .catch(() => {});
}

/** Fire-and-forget: logs a CrakRevenue Gay Smartlink click. */
export function trackCrakClick(referrerPage: string): void {
  logClick("crakrevenue-gay-smartlink", referrerPage);
}

/** Fire-and-forget: logs a Manfinder click. */
export function trackManfinderClick(referrerPage: string): void {
  logClick("manfinder", referrerPage);
}
