import React, { lazy, Suspense, Component, ReactNode } from "react";
import { trackPageView } from "./lib/analytics";
import { logPageView } from "./lib/tracking";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import AgeVerification from "./components/AgeVerification";
import CookieConsent from "./components/CookieConsent";
import ExitIntentDealPopup from "./components/ExitIntentDealPopup";
import ScrollProgressBar from "./components/ScrollProgressBar";

// Public pages — eager imports. Switched from lazy() so server-side
// renderToString produces full HTML for these routes (lazy + Suspense
// renders the fallback on the server, which defeats the SSR purpose).
import Index from "./pages/Index";
import TopSites from "./pages/TopSites";
import ReviewPage from "./pages/ReviewPage";
import ReviewsIndex from "./pages/ReviewsIndex";
import CategoryPage from "./pages/CategoryPage";
import BestDeals from "./pages/BestDeals";
import FindMySite from "./pages/FindMySite";
import AskAI from "./pages/AskAI";
import BestTwinkSites from "./pages/BestTwinkSites";
import FreeTrialSites from "./pages/FreeTrialSites";
import CheapestTwinkSites from "./pages/CheapestTwinkSites";
import GoRedirect from "./pages/GoRedirect";
import About from "./pages/About";
import Methodology from "./pages/Methodology";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AffiliateDisclosure from "./pages/AffiliateDisclosure";
import ComparePage from "./pages/ComparePage";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Compliance2257 from "./pages/Compliance2257";
import DiscountPage from "./pages/DiscountPage";
import SitemapPage from "./pages/SitemapPage";
import GayDatingSites from "./pages/GayDatingSites";
import NicheCategoryPage from "./pages/NicheCategoryPage";
import BestUnder10 from "./pages/seo/BestUnder10";
import BestBareback from "./pages/seo/BestBareback";
import BestAsian from "./pages/seo/BestAsian";
import BestAmateur from "./pages/seo/BestAmateur";
import BestPremium from "./pages/seo/BestPremium";
import HelixAlternatives from "./pages/seo/HelixAlternatives";
import SeanCodyAlternatives from "./pages/seo/SeanCodyAlternatives";
import NakedSwordAlternatives from "./pages/seo/NakedSwordAlternatives";
import BestForBeginners from "./pages/seo/BestForBeginners";
import BestTwink2026 from "./pages/seo/BestTwink2026";
import BestWithDownloads from "./pages/seo/BestWithDownloads";
import BestDaddy from "./pages/seo/BestDaddy";
import BestTwinkPornFreeTrials from "./pages/seo/BestTwinkPornFreeTrials";
import BestCheapGayPorn from "./pages/seo/BestCheapGayPorn";
import BestBarebackTwink from "./pages/seo/BestBarebackTwink";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import BlogCategory from "./pages/BlogCategory";
import GuidePage from "./pages/GuidePage";
import GuidesIndex from "./pages/GuidesIndex";
import GenericAlternatives from "./pages/seo/GenericAlternatives";
import BestGayPornSites from "./pages/seo/BestGayPornSites";
import BestSubscription from "./pages/seo/BestSubscription";
import BestTwinkPorn from "./pages/seo/BestTwinkPorn";
import SitesWithFreeTrial from "./pages/seo/SitesWithFreeTrial";
import BestValueGayPorn from "./pages/seo/BestValueGayPorn";
import PricingIndex from "./pages/seo/PricingIndex";
import GayPornReviews from "./pages/seo/GayPornReviews";
import SitesRanked from "./pages/seo/SitesRanked";
import {
  IsNakedSwordWorthIt,
  IsSeanCodyWorthIt,
  IsHelixWorthIt,
  IsMenWorthIt,
  IsTwinksInShortsWorthIt,
  IsSouthernStrokesWorthIt,
  IsPeterFeverWorthIt,
  IsSayUncleWorthIt,
  IsRawHoleWorthIt,
  IsAthleticTwinksWorthIt,
  dynamicWorthItSlugs,
  DynamicWorthIt,
} from "./pages/seo/WorthItRoutes";
import NotFound from "./pages/NotFound";

// Admin pages stay lazy — never crawled, never prerendered, gated client-side.
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminCallback = lazy(() => import("./pages/admin/AdminCallback"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPageDetail = lazy(() => import("./pages/admin/AdminPageDetail"));
const AdminDestinationDetail = lazy(() => import("./pages/admin/AdminDestinationDetail"));
const AdminJourneys = lazy(() => import("./pages/admin/AdminJourneys"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const RequireAdmin = lazy(() => import("./components/RequireAdmin"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

class ErrorBoundary extends Component<
  { children: ReactNode; locationKey: string },
  { hasError: boolean; errorMsg: string }
> {
  state = { hasError: false, errorMsg: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || "Unknown error" };
  }

  componentDidUpdate(prevProps: { locationKey: string }) {
    if (prevProps.locationKey !== this.props.locationKey && this.state.hasError) {
      this.setState({ hasError: false, errorMsg: "" });
    }
  }

  componentDidCatch(error: Error) {
    console.error("Page error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-heading text-3xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">An unexpected error occurred.</p>
          <a
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
          >
            Back to Home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

// Routes only — caller provides the Router. Used by both BrowserRouter
// (client) and StaticRouter (SSR).
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/top-sites" element={<TopSites />} />
    <Route path="/reviews" element={<ReviewsIndex />} />
    <Route path="/reviews/:slug" element={<ReviewPage />} />
    <Route path="/category/:slug" element={<CategoryPage />} />
    <Route path="/best-deals" element={<BestDeals />} />
    <Route path="/find-my-site" element={<FindMySite />} />
    <Route path="/ask-ai" element={<AskAI />} />
    <Route path="/best-twink-sites" element={<BestTwinkSites />} />
    <Route path="/free-trial-twink-sites" element={<FreeTrialSites />} />
    <Route path="/cheapest-twink-sites" element={<CheapestTwinkSites />} />
    <Route path="/discount/:slug" element={<DiscountPage />} />
    <Route path="/go/:slug" element={<GoRedirect />} />
    <Route path="/about" element={<About />} />
    <Route path="/methodology" element={<Methodology />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/compare/:slug" element={<ComparePage />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/2257" element={<Compliance2257 />} />
    <Route path="/sitemap" element={<SitemapPage />} />
    <Route path="/gay-dating-sites" element={<GayDatingSites />} />
    <Route path="/niche/:slug" element={<NicheCategoryPage />} />
    <Route path="/best-gay-sites-under-10" element={<BestUnder10 />} />
    <Route path="/best-bareback-gay-sites" element={<BestBareback />} />
    <Route path="/best-asian-gay-sites" element={<BestAsian />} />
    <Route path="/best-amateur-gay-sites" element={<BestAmateur />} />
    <Route path="/best-premium-gay-sites" element={<BestPremium />} />
    <Route path="/helix-studios-alternatives" element={<HelixAlternatives />} />
    <Route path="/sean-cody-alternatives" element={<SeanCodyAlternatives />} />
    <Route path="/nakedsword-alternatives" element={<NakedSwordAlternatives />} />
    <Route path="/alternatives/:slug" element={<GenericAlternatives />} />
    <Route path="/guides" element={<GuidesIndex />} />
    <Route path="/guide/:slug" element={<GuidePage />} />
    <Route path="/best-gay-sites-for-beginners" element={<BestForBeginners />} />
    <Route path="/best-gay-twink-sites-2026" element={<BestTwink2026 />} />
    <Route path="/best-gay-sites-with-downloads" element={<BestWithDownloads />} />
    <Route path="/best-daddy-twink-sites" element={<BestDaddy />} />
    <Route path="/best-twink-porn-sites-with-free-trials" element={<BestTwinkPornFreeTrials />} />
    <Route path="/best-cheap-gay-porn-sites" element={<BestCheapGayPorn />} />
    <Route path="/best-bareback-twink-sites" element={<BestBarebackTwink />} />
    <Route path="/blog" element={<BlogIndex />} />
    <Route path="/blog/category/:category" element={<BlogCategory />} />
    <Route path="/blog/:slug" element={<BlogPost />} />
    <Route path="/best-gay-porn-sites" element={<BestGayPornSites />} />
    <Route path="/best-gay-porn-subscription" element={<BestSubscription />} />
    <Route path="/best-twink-porn-sites" element={<BestTwinkPorn />} />
    <Route path="/gay-porn-sites-with-free-trial" element={<SitesWithFreeTrial />} />
    <Route path="/best-value-gay-porn-sites" element={<BestValueGayPorn />} />
    <Route path="/gay-porn-pricing-index" element={<PricingIndex />} />
    <Route path="/gay-porn-site-reviews" element={<GayPornReviews />} />
    <Route path="/gay-porn-sites-ranked" element={<SitesRanked />} />
    <Route path="/is-nakedsword-worth-it" element={<IsNakedSwordWorthIt />} />
    <Route path="/is-sean-cody-worth-it" element={<IsSeanCodyWorthIt />} />
    <Route path="/is-helix-studios-worth-it" element={<IsHelixWorthIt />} />
    <Route path="/is-men-worth-it" element={<IsMenWorthIt />} />
    <Route path="/is-twinks-in-shorts-worth-it" element={<IsTwinksInShortsWorthIt />} />
    <Route path="/is-southern-strokes-worth-it" element={<IsSouthernStrokesWorthIt />} />
    <Route path="/is-peterfever-worth-it" element={<IsPeterFeverWorthIt />} />
    <Route path="/is-sayuncle-worth-it" element={<IsSayUncleWorthIt />} />
    <Route path="/is-rawhole-worth-it" element={<IsRawHoleWorthIt />} />
    <Route path="/is-athletic-twinks-worth-it" element={<IsAthleticTwinksWorthIt />} />
    {/* Auto-routed worth-it pages: any ISWORTHIT_CONTENT key beyond the hand-routed set. */}
    {dynamicWorthItSlugs.map((slug) => (
      <Route key={slug} path={`/is-${slug}-worth-it`} element={<DynamicWorthIt slug={slug} />} />
    ))}
    <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
    <Route path="/admin/callback" element={<Suspense fallback={<PageLoader />}><AdminCallback /></Suspense>} />
    <Route path="/admin" element={<Suspense fallback={<PageLoader />}><RequireAdmin><AdminDashboard /></RequireAdmin></Suspense>} />
    <Route path="/admin/page/*" element={<Suspense fallback={<PageLoader />}><RequireAdmin><AdminPageDetail /></RequireAdmin></Suspense>} />
    <Route path="/admin/destination/:slug" element={<Suspense fallback={<PageLoader />}><RequireAdmin><AdminDestinationDetail /></RequireAdmin></Suspense>} />
    <Route path="/admin/journeys" element={<Suspense fallback={<PageLoader />}><RequireAdmin><AdminJourneys /></RequireAdmin></Suspense>} />
    <Route path="/admin/seo" element={<Suspense fallback={<PageLoader />}><RequireAdmin><AdminSEO /></RequireAdmin></Suspense>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppShell = () => {
  const location = useLocation();

  React.useEffect(() => {
    trackPageView(location.pathname);
    logPageView(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  return (
    <ErrorBoundary locationKey={location.pathname}>
      <AgeVerification />
      <CookieConsent />
      <ScrollProgressBar />
      <ExitIntentDealPopup />
      <AppRoutes />
    </ErrorBoundary>
  );
};

/**
 * Provider stack shared between client and server. Caller wraps in
 * BrowserRouter (client) or StaticRouter (server) + HelmetProvider.
 */
export const AppShellWithProviders = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppShell />
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <AppShellWithProviders />
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
