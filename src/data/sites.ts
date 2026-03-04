export interface SiteData {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  overall_score: number;
  content_quality: number;
  value_score: number;
  update_frequency: number;
  mobile_score: number;
  price_from: string;
  affiliate_url: string;
  categories: string[];
  pros: string[];
  cons: string[];
  rank: number;
  badge: string | null;
  is_featured: boolean;
}

export const sites: SiteData[] = [
  {
    id: "1",
    name: "Helix Studios",
    slug: "helix-studios",
    short_description: "Premium twink studio with cinematic quality productions and exclusive models.",
    description: "Helix Studios has been a cornerstone of premium twink content for over a decade. Known for their cinematic approach to adult content, they feature some of the most attractive exclusive models in the industry. The production quality rivals mainstream entertainment, with professional lighting, sound, and editing throughout their extensive library.",
    overall_score: 4.8,
    content_quality: 95,
    value_score: 82,
    update_frequency: 88,
    mobile_score: 90,
    price_from: "$9.99/mo",
    affiliate_url: "#",
    categories: ["premium-studios", "hd-quality"],
    pros: ["Cinematic production quality", "Large exclusive model roster", "Regular weekly updates"],
    cons: ["Higher price point than competitors", "Limited amateur content"],
    rank: 1,
    badge: "Editor's Choice",
    is_featured: true,
  },
  {
    id: "2",
    name: "Twink In Shorts",
    slug: "twink-in-shorts",
    short_description: "Amateur-focused content with authentic, unscripted scenes and real chemistry.",
    description: "Twink In Shorts specializes in authentic, amateur-style content that feels genuine and unscripted. Their models have real chemistry and the scenes feel natural rather than produced. A great option for those who prefer a more realistic style.",
    overall_score: 4.5,
    content_quality: 85,
    value_score: 90,
    update_frequency: 80,
    mobile_score: 85,
    price_from: "$7.99/mo",
    affiliate_url: "#",
    categories: ["amateur-twinks", "best-value"],
    pros: ["Very affordable pricing", "Authentic amateur feel", "Great mobile experience"],
    cons: ["Lower production quality than studios"],
    rank: 2,
    badge: "Best Value",
    is_featured: true,
  },
  {
    id: "3",
    name: "Athletic Twinks",
    slug: "athletic-twinks",
    short_description: "Fit and athletic models in high-energy, sports-themed scenes.",
    description: "Athletic Twinks focuses on fit, sporty models in energetic scenes. Great production quality with a niche focus on athletic body types. Updated regularly with fresh content featuring new models.",
    overall_score: 4.4,
    content_quality: 88,
    value_score: 78,
    update_frequency: 82,
    mobile_score: 88,
    price_from: "$12.99/mo",
    affiliate_url: "#",
    categories: ["premium-studios", "hd-quality"],
    pros: ["Unique athletic niche", "High energy content", "HD streaming"],
    cons: ["Narrow niche focus", "Smaller library"],
    rank: 3,
    badge: "Top Rated",
    is_featured: true,
  },
  {
    id: "4",
    name: "Daddy On Twink",
    slug: "daddy-on-twink",
    short_description: "Intergenerational scenes with experienced and younger performers.",
    description: "Daddy On Twink explores intergenerational dynamics with experienced and younger performers. Well-produced scenes with good chemistry between models. A solid option for fans of this particular niche.",
    overall_score: 4.2,
    content_quality: 82,
    value_score: 80,
    update_frequency: 75,
    mobile_score: 82,
    price_from: "$11.99/mo",
    affiliate_url: "#",
    categories: ["premium-studios"],
    pros: ["Unique niche content", "Good model chemistry", "Regular updates"],
    cons: ["Niche may not suit everyone", "Average mobile experience"],
    rank: 4,
    badge: null,
    is_featured: true,
  },
  {
    id: "5",
    name: "Southern Strokes",
    slug: "southern-strokes",
    short_description: "All-American twink content with a Southern charm and great value.",
    description: "Southern Strokes delivers all-American twink content with a distinct Southern flavor. Known for their friendly, approachable models and good value pricing. The site offers a solid library with consistent updates.",
    overall_score: 4.1,
    content_quality: 80,
    value_score: 85,
    update_frequency: 78,
    mobile_score: 80,
    price_from: "$8.99/mo",
    affiliate_url: "#",
    categories: ["amateur-twinks", "best-value"],
    pros: ["Great value for money", "Friendly approachable models", "Good variety"],
    cons: ["Production quality varies"],
    rank: 5,
    badge: "Most Popular",
    is_featured: true,
  },
  {
    id: "6",
    name: "Touch That Boy",
    slug: "touch-that-boy",
    short_description: "Sensual, slow-paced content focusing on intimacy and connection.",
    description: "Touch That Boy stands out with its focus on sensual, intimate content. Scenes are slower-paced and emphasize genuine connection between performers. High production values and tasteful presentation.",
    overall_score: 4.0,
    content_quality: 84,
    value_score: 76,
    update_frequency: 70,
    mobile_score: 85,
    price_from: "$10.99/mo",
    affiliate_url: "#",
    categories: ["premium-studios", "hd-quality"],
    pros: ["Tasteful, intimate content", "High production quality", "Good streaming"],
    cons: ["Slower update schedule", "Smaller library"],
    rank: 6,
    badge: null,
    is_featured: false,
  },
  {
    id: "7",
    name: "Breed Me Raw",
    slug: "breed-me-raw",
    short_description: "Raw, intense scenes with passionate performers and HD quality.",
    description: "Breed Me Raw delivers intense, passionate content with enthusiastic performers. The site features HD quality throughout and maintains a large, regularly updated library. Good value for the amount of content available.",
    overall_score: 3.9,
    content_quality: 78,
    value_score: 82,
    update_frequency: 85,
    mobile_score: 78,
    price_from: "$9.99/mo",
    affiliate_url: "#",
    categories: ["amateur-twinks", "hd-quality"],
    pros: ["Large content library", "Frequent updates", "Good pricing"],
    cons: ["Variable production quality", "Older site design"],
    rank: 7,
    badge: null,
    is_featured: false,
  },
  {
    id: "8",
    name: "Twinks Bareback",
    slug: "twinks-bareback",
    short_description: "Bareback-focused twink content with free trial available.",
    description: "Twinks Bareback offers a focused library of bareback twink content. They stand out by offering a free trial period, letting new members explore before committing. Decent production quality with regular updates.",
    overall_score: 3.8,
    content_quality: 75,
    value_score: 88,
    update_frequency: 72,
    mobile_score: 80,
    price_from: "$7.99/mo",
    affiliate_url: "#",
    categories: ["free-trials", "best-value", "amateur-twinks"],
    pros: ["Free trial available", "Very affordable", "Good niche focus"],
    cons: ["Smaller content library", "Basic site design"],
    rank: 8,
    badge: "Free Trial",
    is_featured: false,
  },
];

export const categories = [
  { slug: "amateur-twinks", name: "Amateur Twinks", icon: "🔥", description: "The best amateur twink content sites — real guys, authentic scenes, no scripts." },
  { slug: "premium-studios", name: "Premium Studios", icon: "⭐", description: "Top-tier production quality from the industry's leading studios." },
  { slug: "best-value", name: "Best Value", icon: "💰", description: "The most content for your money — great sites at affordable prices." },
  { slug: "hd-quality", name: "HD Quality", icon: "🎬", description: "Crystal clear HD and 4K streaming for the best viewing experience." },
  { slug: "free-trials", name: "Free Trials", icon: "🆓", description: "Try before you buy — sites offering free trial memberships." },
  { slug: "mobile-friendly", name: "Mobile Friendly", icon: "📱", description: "Optimized for phones and tablets with responsive streaming." },
];

export function getSiteBySlug(slug: string): SiteData | undefined {
  return sites.find(s => s.slug === slug);
}

export function getSitesByCategory(categorySlug: string): SiteData[] {
  return sites.filter(s => s.categories.includes(categorySlug));
}

export function getFeaturedSites(): SiteData[] {
  return sites.filter(s => s.is_featured).sort((a, b) => a.rank - b.rank);
}
