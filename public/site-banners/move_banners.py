#!/usr/bin/env python3
"""Move banner files from ~/Downloads to ./ (this script's folder)."""
import os, shutil, sys, glob

DEST = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.expanduser("~/Downloads")

slugs = [
    "twinks-in-shorts", "athletic-twinks", "southern-strokes", "daddy-on-twink",
    "touch-that-boy", "breed-me-raw", "bareback-that-hole", "hard-brit-lads",
    "bareback-cum-pigs", "bear-chubs", "bear-films", "hairy-and-raw",
    "rawhole", "peterfever", "gay-asian-network", "alternadudes", "dirty-boy-video",
    "japanboyz", "sexjapantv", "yoshi-kawasaki-xxx", "real-men-fuck", "swingin-balls",
    "squirt-studios", "twinktrade", "dad-creep", "brother-crush", "family-dick",
    "say-uncle", "boys-at-camp", "missionary-boys", "military-dick", "latin-leche",
    "yes-father", "bully-him", "young-perps", "nakedsword", "trailer-trash-boys",
    "boyfun", "jawked",
]

moved = 0
missing = []
for slug in slugs:
    found = None
    for ext in ("jpg", "png", "gif"):
        candidate = os.path.join(SRC, f"{slug}-hero.{ext}")
        if os.path.isfile(candidate):
            found = candidate
            break
    if found:
        target = os.path.join(DEST, os.path.basename(found))
        shutil.move(found, target)
        print(f"  moved: {os.path.basename(found)}")
        moved += 1
        # Clean up duplicates with (1), (2), etc.
        for ext in ("jpg", "png", "gif"):
            for n in range(1, 6):
                dup = os.path.join(SRC, f"{slug}-hero ({n}).{ext}")
                if os.path.isfile(dup):
                    os.remove(dup)
    else:
        missing.append(slug)

# Clean up placeholder files in destination
for fname in (".placeholder", ".test.b64"):
    p = os.path.join(DEST, fname)
    if os.path.isfile(p):
        os.remove(p)

print()
print(f"=== Moved {moved} files ===")
if missing:
    print(f"Missing ({len(missing)}):")
    for s in missing:
        print(f"  - {s}")
print()
print(f"Files in {DEST}:")
for f in sorted(os.listdir(DEST)):
    if not f.startswith(".") and f != "STATUS.md" and not f.startswith("_") and not f == "move_banners.py":
        path = os.path.join(DEST, f)
        size = os.path.getsize(path)
        print(f"  {f} ({size:,} bytes)")
