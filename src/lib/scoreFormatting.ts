/**
 * Display-only smoothing for pillar scores. The underlying scores in
 * sites.ts are precise integers (e.g. 84, 78, 92). Rendering them as-is
 * implies measurement accuracy that doesn't exist — editorial scoring
 * is a judgment, not a lab reading. Rounding to the nearest 5 at the
 * display layer keeps the bar widths readable and removes the
 * fake-precision tell.
 *
 * The overall 0-5 star score keeps decimal precision (4.3, 4.6) since
 * that's already at a reasonable granularity.
 */
export function displayPillarScore(raw: number): number {
  return Math.round(raw / 5) * 5;
}
