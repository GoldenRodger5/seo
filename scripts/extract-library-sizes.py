#!/usr/bin/env python3
"""Extract library_size values from our own editorial prose in sites.ts.

Self-consistent by construction: the QuickFacts number always matches what
the review text already claims. Idempotent — skips sites that have a value.
For sites whose prose has no count, scripts/fill-library-sizes.ts researches
via the Anthropic API (conservative: omits rather than guesses).

Run: python3 scripts/extract-library-sizes.py
"""
import re

p = "src/data/sites.ts"
s = open(p).read()

PAT = re.compile(r"([\d][\d,]{2,})\s*\+?\s*(scenes|videos|movies|episodes)", re.I)
blocks = [m.start() for m in re.finditer(r'\bslug: "', s)]
inserts = []
for i, start in enumerate(blocks):
    end = blocks[i + 1] if i + 1 < len(blocks) else len(s)
    block = s[start:end]
    slug = re.search(r'slug: "([^"]+)"', block).group(1)
    if "library_size:" in block:
        continue
    m = PAT.search(block)
    if not m:
        continue
    if int(m.group(1).replace(",", "")) < 100:
        continue
    val = f"{m.group(1)}+ {m.group(2).lower()}"
    hd = block.find("has_hd:")
    if hd == -1:
        continue
    line_end = block.find("\n", hd)
    inserts.append((start + line_end + 1, f'    library_size: "{val}",\n', slug, val))

for pos, text, slug, val in sorted(inserts, reverse=True):
    s = s[:pos] + text + s[pos:]
open(p, "w").write(s)
print(f"extracted {len(inserts)}:")
for _, _, slug, val in sorted(inserts, key=lambda x: x[2]):
    print(f"  {slug}: {val}")
