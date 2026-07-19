/**
 * Library-size research filler.
 *
 * The one data point every established review directory shows that we
 * didn't: hard library counts ("4,000+ scenes"). This script researches
 * sites via the Anthropic API + web_search and fills SiteData.library_size
 * progressively — top-ranked sites first, skipping any that already have a
 * value. Values are only written when the model found a real figure; "no
 * confident number" writes nothing (omit rather than guess).
 *
 * Run: ANTHROPIC_API_KEY=... npx tsx scripts/fill-library-sizes.ts --limit 10
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import { sites } from "../src/data/sites.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITES_FILE = resolve(ROOT, "src/data/sites.ts");
const MODEL = "claude-sonnet-4-6";

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1] || "5", 10) : 5;

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("ANTHROPIC_API_KEY required");
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey: key });

const VALID = /^[\d,]+\+? (scenes|videos|movies|episodes)$/i;

async function research(name: string, homepage: string): Promise<string | null> {
  const tools = [{ type: "web_search_20250305" as const, name: "web_search" }];
  const system = `You research adult membership sites' library sizes. Use web_search to find how many scenes/videos the site "${name}" (${homepage}) currently advertises or is credibly reported to have. Respond ONLY with JSON: {"library_size": "4,000+ scenes"} using the format "<number>+ scenes" or "<number>+ videos" (round DOWN to a defensible floor, include thousands separators). If you cannot find a credible figure, respond {"library_size": null}. No prose.`;
  const messages: { role: "user" | "assistant"; content: unknown }[] = [
    { role: "user", content: `Find the current library size for ${name}.` },
  ];
  let resp = await anthropic.messages.create({
    model: MODEL, max_tokens: 1500, system, tools, messages: messages as never,
  });
  let continues = 0;
  while (resp.stop_reason === "pause_turn" && continues < 4) {
    messages.push({ role: "assistant", content: resp.content });
    resp = await anthropic.messages.create({
      model: MODEL, max_tokens: 1500, system, tools, messages: messages as never,
    });
    continues++;
  }
  const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  const m = text.match(/\{[^{}]*"library_size"[^{}]*\}/);
  if (!m) return null;
  try {
    const v = JSON.parse(m[0]).library_size;
    if (typeof v === "string" && VALID.test(v.trim())) return v.trim();
  } catch { /* fall through */ }
  return null;
}

async function main() {
  const targets = [...sites]
    .filter((s) => !s.library_size && (s.editorial_status ?? "reviewed") === "reviewed")
    .sort((a, b) => a.rank - b.rank)
    .slice(0, LIMIT);
  console.log(`Researching ${targets.length} sites (limit ${LIMIT})…`);

  let src = readFileSync(SITES_FILE, "utf-8");
  let filled = 0;
  for (const site of targets) {
    process.stdout.write(`  ${site.slug} … `);
    try {
      const size = await research(site.name, site.homepage_url);
      if (!size) { console.log("no confident figure — skipped"); continue; }
      // Surgical insert: after this site's has_hd line, inside its object.
      const slugIdx = src.indexOf(`slug: "${site.slug}"`);
      if (slugIdx === -1) { console.log("slug not found?!"); continue; }
      const hasHdIdx = src.indexOf("has_hd:", slugIdx);
      const nextSlugIdx = src.indexOf("slug: \"", slugIdx + 10);
      if (hasHdIdx === -1 || (nextSlugIdx !== -1 && hasHdIdx > nextSlugIdx)) {
        console.log("has_hd anchor not in object — skipped"); continue;
      }
      const lineEnd = src.indexOf("\n", hasHdIdx);
      src = src.slice(0, lineEnd + 1) + `    library_size: "${size}",\n` + src.slice(lineEnd + 1);
      filled++;
      console.log(size);
    } catch (e) {
      console.log("error:", (e as Error).message.slice(0, 60));
    }
  }
  if (filled > 0) writeFileSync(SITES_FILE, src);
  console.log(`\nFilled ${filled}/${targets.length}. Re-run to continue down the rankings.`);
}

main();
