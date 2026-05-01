/**
 * Brand color hints per site. Used as a header bar / accent color on visual
 * site cards. Pure CSS, no images — keeps us copyright-safe for adult content.
 *
 * Format: tailwind-compatible from/to gradient stops.
 */

interface BrandPalette {
  /** Tailwind gradient class for the card header bar (e.g. "from-amber-500 to-yellow-400") */
  gradient: string;
  /** Tailwind text color for the watermark letter behind the card (low opacity) */
  watermark: string;
  /** Tailwind border accent on hover */
  accent: string;
}

const DEFAULT_PALETTE: BrandPalette = {
  gradient: "from-primary to-primary/70",
  watermark: "text-primary/[0.08]",
  accent: "hover:border-primary/40",
};

const palettes: Record<string, BrandPalette> = {
  // Premium twink — warm gold/amber
  "helix-studios": { gradient: "from-amber-500 to-yellow-400", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },
  "next-door-twink": { gradient: "from-orange-500 to-amber-400", watermark: "text-orange-400/[0.08]", accent: "hover:border-orange-400/40" },
  "next-door-world": { gradient: "from-orange-600 to-red-400", watermark: "text-orange-400/[0.08]", accent: "hover:border-orange-400/40" },

  // Twink amateur — bright pinks/oranges
  "twinks-in-shorts": { gradient: "from-pink-500 to-rose-400", watermark: "text-pink-400/[0.08]", accent: "hover:border-pink-400/40" },
  "athletic-twinks": { gradient: "from-emerald-500 to-teal-400", watermark: "text-emerald-400/[0.08]", accent: "hover:border-emerald-400/40" },
  "southern-strokes": { gradient: "from-amber-600 to-orange-400", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },
  "touch-that-boy": { gradient: "from-rose-500 to-pink-400", watermark: "text-rose-400/[0.08]", accent: "hover:border-rose-400/40" },
  "boyfun": { gradient: "from-sky-500 to-cyan-400", watermark: "text-sky-400/[0.08]", accent: "hover:border-sky-400/40" },
  "jawked": { gradient: "from-blue-500 to-cyan-400", watermark: "text-blue-400/[0.08]", accent: "hover:border-blue-400/40" },

  // Daddy/family taboo — deep reds / browns
  "daddy-on-twink": { gradient: "from-red-700 to-rose-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "dadcreep": { gradient: "from-red-800 to-rose-600", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "familydick": { gradient: "from-stone-700 to-amber-700", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },
  "sayuncle": { gradient: "from-amber-800 to-yellow-700", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },
  "yesfather": { gradient: "from-rose-800 to-pink-600", watermark: "text-rose-400/[0.08]", accent: "hover:border-rose-400/40" },
  "brothercrush": { gradient: "from-orange-700 to-red-500", watermark: "text-orange-400/[0.08]", accent: "hover:border-orange-400/40" },

  // Bareback — bold reds
  "breed-me-raw": { gradient: "from-red-600 to-rose-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "bareback-that-hole": { gradient: "from-red-700 to-orange-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "rawhole": { gradient: "from-red-800 to-rose-600", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "barebackrtxxx": { gradient: "from-red-700 to-pink-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "barebackcumpigs": { gradient: "from-red-900 to-rose-700", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },

  // British/European — rich purples / royal blues
  "hard-brit-lads": { gradient: "from-blue-700 to-indigo-500", watermark: "text-blue-400/[0.08]", accent: "hover:border-blue-400/40" },
  "prideflame": { gradient: "from-fuchsia-500 to-pink-400", watermark: "text-fuchsia-400/[0.08]", accent: "hover:border-fuchsia-400/40" },

  // Asian — sakura/red lanterns
  "peterfever": { gradient: "from-rose-500 to-red-500", watermark: "text-rose-400/[0.08]", accent: "hover:border-rose-400/40" },
  "gayasiannetwork": { gradient: "from-red-600 to-pink-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "japanboyz": { gradient: "from-pink-600 to-rose-400", watermark: "text-pink-400/[0.08]", accent: "hover:border-pink-400/40" },
  "sexjapantv": { gradient: "from-red-500 to-pink-400", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "hiroyaxxx": { gradient: "from-rose-600 to-orange-400", watermark: "text-rose-400/[0.08]", accent: "hover:border-rose-400/40" },
  "yoshikawasakixxx": { gradient: "from-purple-600 to-pink-500", watermark: "text-purple-400/[0.08]", accent: "hover:border-purple-400/40" },
  "wuboyz": { gradient: "from-rose-500 to-amber-400", watermark: "text-rose-400/[0.08]", accent: "hover:border-rose-400/40" },

  // Latin — sunset oranges/yellows
  "latinleche": { gradient: "from-orange-500 to-yellow-400", watermark: "text-orange-400/[0.08]", accent: "hover:border-orange-400/40" },

  // Bears — earth tones
  "bearchubs": { gradient: "from-amber-700 to-orange-600", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },
  "bearfilms": { gradient: "from-stone-700 to-amber-600", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },
  "hairyandraw": { gradient: "from-amber-800 to-stone-600", watermark: "text-amber-400/[0.08]", accent: "hover:border-amber-400/40" },

  // Crossover/network — deep purples / blues
  "alternadudes": { gradient: "from-violet-600 to-purple-500", watermark: "text-violet-400/[0.08]", accent: "hover:border-violet-400/40" },
  "dirtyboyvideo": { gradient: "from-purple-700 to-fuchsia-500", watermark: "text-purple-400/[0.08]", accent: "hover:border-purple-400/40" },
  "dudesraw": { gradient: "from-indigo-700 to-blue-500", watermark: "text-indigo-400/[0.08]", accent: "hover:border-indigo-400/40" },
  "nakedsword": { gradient: "from-red-700 to-rose-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "trailertrashboys": { gradient: "from-yellow-600 to-amber-500", watermark: "text-yellow-400/[0.08]", accent: "hover:border-yellow-400/40" },

  // Group/fetish
  "cumpigmen": { gradient: "from-rose-700 to-red-500", watermark: "text-rose-400/[0.08]", accent: "hover:border-rose-400/40" },
  "realmenfuck": { gradient: "from-orange-700 to-amber-500", watermark: "text-orange-400/[0.08]", accent: "hover:border-orange-400/40" },
  "swinginballs": { gradient: "from-blue-600 to-indigo-500", watermark: "text-blue-400/[0.08]", accent: "hover:border-blue-400/40" },
  "squirtstudios": { gradient: "from-cyan-500 to-blue-400", watermark: "text-cyan-400/[0.08]", accent: "hover:border-cyan-400/40" },
  "aussiesdoit": { gradient: "from-yellow-500 to-amber-400", watermark: "text-yellow-400/[0.08]", accent: "hover:border-yellow-400/40" },

  // Authority/military
  "missionaryboys": { gradient: "from-blue-700 to-cyan-500", watermark: "text-blue-400/[0.08]", accent: "hover:border-blue-400/40" },
  "militarydick": { gradient: "from-emerald-700 to-stone-600", watermark: "text-emerald-400/[0.08]", accent: "hover:border-emerald-400/40" },
  "boysatcamp": { gradient: "from-emerald-600 to-lime-500", watermark: "text-emerald-400/[0.08]", accent: "hover:border-emerald-400/40" },
  "bullyhim": { gradient: "from-red-600 to-orange-500", watermark: "text-red-400/[0.08]", accent: "hover:border-red-400/40" },
  "youngperps": { gradient: "from-blue-800 to-indigo-600", watermark: "text-blue-400/[0.08]", accent: "hover:border-blue-400/40" },
  "twinktrade": { gradient: "from-emerald-500 to-cyan-400", watermark: "text-emerald-400/[0.08]", accent: "hover:border-emerald-400/40" },
};

export const getBrandPalette = (slug: string): BrandPalette =>
  palettes[slug] ?? DEFAULT_PALETTE;
