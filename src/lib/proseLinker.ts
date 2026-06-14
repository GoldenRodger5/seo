/**
 * Pure (no-JSX) core for auto-linking site/niche mentions in generated
 * prose. Used by:
 *   - src/components/LinkedProse.tsx  (render-time linking → real <a> tags
 *     in the prerendered HTML, which is what Google + the strict audit see)
 *   - scripts/generate-daily-content.ts (counts prospective links for the
 *     [content][quality] log line)
 *
 * Rules (per the SEO spec):
 *   - link only the FIRST mention of each site/niche across the whole
 *     article (caller shares one `linked` Set across paragraphs)
 *   - later mentions stay plain text (no over-linking)
 *   - longer names win ("Twinks in Shorts" before "Twink")
 *   - word-boundary, case-insensitive; anchor text = the matched substring
 *   - never invoked on headings (caller only passes body prose)
 */
import { sites } from "../data/sites";
import { niches } from "../data/niches";

export interface ProseMatch {
  /** Start index of the match within the input text. */
  index: number;
  /** Length of the matched substring (anchor text length). */
  length: number;
  /** Destination route, e.g. "/reviews/helix-studios" or "/niche/bareback". */
  href: string;
  /** Dedup key so each site/niche links at most once per article. */
  key: string;
}

interface Candidate {
  name: string;
  href: string;
  key: string;
}

let CANDIDATES: Candidate[] | null = null;

function getCandidates(): Candidate[] {
  if (CANDIDATES) return CANDIDATES;
  const list: Candidate[] = [];
  for (const s of sites) {
    if (s.name && s.name.length >= 4) {
      list.push({ name: s.name, href: `/reviews/${s.slug}`, key: `site:${s.slug}` });
    }
  }
  for (const n of niches) {
    if (n.displayName && n.displayName.length >= 4) {
      list.push({ name: n.displayName, href: `/niche/${n.slug}`, key: `niche:${n.slug}` });
    }
  }
  // Longest names first so specific brands ("Twinks in Shorts") match before
  // generic niche words ("Twink") that are substrings of them.
  list.sort((a, b) => b.name.length - a.name.length);
  CANDIDATES = list;
  return list;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** First word-boundary index of `name` in `text` at/after `from`, or -1. */
function indexOfWord(text: string, name: string, from: number): number {
  // Custom boundaries (not \b) so names with punctuation like "Men.com"
  // still match cleanly. Case-insensitive.
  const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(name)}(?![A-Za-z0-9])`, "i");
  const m = re.exec(text.slice(from));
  return m ? from + m.index : -1;
}

export interface LinkOptions {
  /** Candidate keys to skip (e.g. the page's own site, to avoid self-links). */
  skipKeys?: Set<string>;
  /** Hard cap on links produced from this single text chunk. */
  max?: number;
}

/**
 * Find non-overlapping first-mention matches in one text chunk. `linked`
 * accumulates across chunks so a name linked in the intro won't relink in a
 * later section.
 */
export function findProseLinks(
  text: string,
  linked: Set<string>,
  opts: LinkOptions = {},
): ProseMatch[] {
  const cands = getCandidates();
  const skip = opts.skipKeys;
  const max = opts.max ?? Infinity;
  const matches: ProseMatch[] = [];
  let pos = 0;

  while (pos < text.length && matches.length < max) {
    let best: { idx: number; cand: Candidate } | null = null;
    for (const c of cands) {
      if (linked.has(c.key) || skip?.has(c.key)) continue;
      const idx = indexOfWord(text, c.name, pos);
      if (idx === -1) continue;
      if (!best || idx < best.idx || (idx === best.idx && c.name.length > best.cand.name.length)) {
        best = { idx, cand: c };
      }
    }
    if (!best) break;
    matches.push({ index: best.idx, length: best.cand.name.length, href: best.cand.href, key: best.cand.key });
    linked.add(best.cand.key);
    pos = best.idx + best.cand.name.length;
  }

  return matches;
}

/**
 * Count how many contextual internal links a set of prose chunks would yield
 * (first-mention, deduped across all chunks). Used for the quality log line.
 */
export function countProseLinks(chunks: string[], opts: LinkOptions = {}): number {
  const linked = new Set<string>();
  let total = 0;
  for (const chunk of chunks) {
    total += findProseLinks(chunk, linked, opts).length;
  }
  return total;
}
