/**
 * Edge middleware: copies Vercel's geolocation headers onto a `tv_country`
 * cookie the client can read synchronously on every page load. More
 * reliable than the `/api/geo` round-trip because:
 *   • Runs on every matched request — no extra fetch from the client
 *   • Cookie is available before tracking.ts fires its first event
 *   • Survives across navigation within a session
 *
 * Vercel injects `x-vercel-ip-country` (ISO 3166 alpha-2) on every
 * request at the edge — no external geolocation API call required.
 */
export const config = {
  // Skip static assets and the /api routes. Everything else (incl. the
  // SPA index.html) gets the cookie set.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|site-banners/|api/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|xml|txt|json)$).*)",
  ],
};

export default function middleware(request: Request): Response {
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  const response = new Response(null, { status: 200 });
  // Pass-through: signal Vercel to continue to the underlying route by
  // returning a response with the `x-middleware-next` header.
  response.headers.set("x-middleware-next", "1");
  if (country) {
    response.headers.append(
      "Set-Cookie",
      `tv_country=${country}; Path=/; Max-Age=86400; SameSite=Lax`,
    );
  }
  return response;
}
