import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Returns geolocation derived from Vercel's edge headers. The client
 * fetches this once per session and caches the result. Used by the
 * tracking module to attribute page views and clicks to a country.
 *
 * Vercel injects `x-vercel-ip-country` (ISO 3166 alpha-2) on every
 * request — no external geolocation API call required.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const country = (req.headers["x-vercel-ip-country"] as string | undefined) ?? null;
  const region = (req.headers["x-vercel-ip-country-region"] as string | undefined) ?? null;
  const city = (req.headers["x-vercel-ip-city"] as string | undefined) ?? null;

  res.setHeader("Cache-Control", "private, max-age=3600");
  res.status(200).json({ country, region, city });
}
