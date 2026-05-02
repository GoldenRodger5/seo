#!/usr/bin/env bash
# Helper script to move all downloaded banners from ~/Downloads
# to this folder. Removes duplicate (1)/(2) versions.
#
# Run: bash _move-and-status.sh

set -e
DEST="$(cd "$(dirname "$0")" && pwd)"
SRC="$HOME/Downloads"

echo "Moving banners from $SRC to $DEST"

# All slugs we expect (across all 5 dashboards)
slugs=(
  twinks-in-shorts athletic-twinks southern-strokes daddy-on-twink
  touch-that-boy breed-me-raw bareback-that-hole hard-brit-lads
  bareback-cum-pigs bear-chubs bear-films hairy-and-raw
  rawhole peterfever gay-asian-network alternadudes dirty-boy-video
  japanboyz sexjapantv yoshi-kawasaki-xxx real-men-fuck swingin-balls
  squirt-studios twinktrade dad-creep brother-crush family-dick
  say-uncle boys-at-camp missionary-boys military-dick latin-leche
  yes-father bully-him young-perps nakedsword trailer-trash-boys
  boyfun jawked
)

moved=0
missing=()
for slug in "${slugs[@]}"; do
  found=""
  for ext in jpg png gif; do
    # Prefer the original (no (1) suffix) if it exists
    if [ -f "$SRC/${slug}-hero.${ext}" ]; then
      found="${slug}-hero.${ext}"
      break
    fi
  done
  if [ -n "$found" ]; then
    mv "$SRC/$found" "$DEST/$found"
    echo "  moved: $found"
    moved=$((moved + 1))
    # Clean up duplicates
    for ext in jpg png gif; do
      for n in 1 2 3 4 5; do
        rm -f "$SRC/${slug}-hero (${n}).${ext}"
      done
    done
  else
    missing+=("$slug")
  fi
done

echo
echo "Cleaning placeholder files..."
rm -f "$DEST/.placeholder" "$DEST/.test.b64"

echo
echo "=== Result ==="
echo "Moved: $moved files"
if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing (${#missing[@]}):"
  printf '  - %s\n' "${missing[@]}"
fi
echo
echo "Files in $DEST:"
ls -la "$DEST" | grep -v '^total' | grep -v 'STATUS\|move-and-status\|^\.'
