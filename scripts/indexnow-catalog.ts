/**
 * Submit the ENTIRE current sitemap catalog to IndexNow via the shared relay
 * (api.indexnow.org), which forwards to every participating engine — Bing,
 * Yandex, Seznam, Naver — in one batch. Bing's index also feeds ChatGPT
 * Search, so this is AI-surface visibility too. Batch limit 10k; we're ~300.
 *
 * Run after structural changes: npx tsx scripts/indexnow-catalog.ts
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.BING_INDEXNOW_KEY ?? "c9fb37c4b6764e2eb72063958d054828";

async function main() {
  const urls = new Set<string>();
  for (const f of ["public/sitemap.xml", "public/blog-sitemap.xml"]) {
    const xml = readFileSync(resolve(ROOT, f), "utf-8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
  }
  const list = [...urls];
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "twinkvault.com",
      key: KEY,
      keyLocation: `https://twinkvault.com/${KEY}.txt`,
      urlList: list,
    }),
  });
  console.log(`IndexNow catalog submission: ${list.length} URLs → HTTP ${r.status} ${r.ok ? "✓" : "✗"}`);
}
main();
