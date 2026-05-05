import React, { lazy, Suspense, Component, ReactNode } from "react";
import { trackPageView } from "./lib/analytics";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";
import AgeVerification from "./components/AgeVerification";
import EmailCapturePopup from "./components/EmailCapturePopup";
import CookieConsent from "./components/CookieConsent";
import ExitIntentDealPopup from "./components/ExitIntentDealPopup";
import InstallPrompt from "./components/InstallPrompt";
import ScrollProgressBar from "./components/ScrollProgressBar";

// Lazy-loaded pages — reduces initial bundle by ~40%
const Index = lazy(() => import("./pages/Index"));
const TopSites = lazy(() => import("./pages/TopSites"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const ReviewsIndex = lazy(() => import("./pages/ReviewsIndex"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const BestDeals = lazy(() => import("./pages/BestDeals"));
const FindMySite = lazy(() => import("./pages/FindMySite"));
const AskAI = lazy(() => import("./pages/AskAI"));
const BestTwinkSites = lazy(() => import("./pages/BestTwinkSites"));
const FreeTrialSites = lazy(() => import("./pages/FreeTrialSites"));
const CheapestTwinkSites = lazy(() => import("./pages/CheapestTwinkSites"));
const GoRedirect = lazy(() => import("./pages/GoRedirect"));
const About = lazy(() => import("./pages/About"));
const Methodology = lazy(() => import("./pages/Methodology"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Compliance2257 = lazy(() => import("./pages/Compliance2257"));
const DiscountPage = lazy(() => import("./pages/DiscountPage"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const GayDatingSites = lazy(() => import("./pages/GayDatingSites"));
const NicheCategoryPage = lazy(() => import("./pages/NicheCategoryPage"));
const BestUnder10 = lazy(() => import("./pages/seo/BestUnder10"));
const BestBareback = lazy(() => import("./pages/seo/BestBareback"));
const BestAsian = lazy(() => import("./pages/seo/BestAsian"));
const BestAmateur = lazy(() => import("./pages/seo/BestAmateur"));
const BestPremium = lazy(() => import("./pages/seo/BestPremium"));
const HelixAlternatives = lazy(() => import("./pages/seo/HelixAlternatives"));
const SeanCodyAlternatives = lazy(() => import("./pages/seo/SeanCodyAlternatives"));
const NakedSwordAlternatives = lazy(() => import("./pages/seo/NakedSwordAlternatives"));
const BestForBeginners = lazy(() => import("./pages/seo/BestForBeginners"));
const BestTwink2026 = lazy(() => import("./pages/seo/BestTwink2026"));
const BestWithDownloads = lazy(() => import("./pages/seo/BestWithDownloads"));
const BestDaddy = lazy(() => import("./pages/seo/BestDaddy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

// Error boundary that resets on route changes
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

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
        <Route path="/best-gay-sites-for-beginners" element={<BestForBeginners />} />
        <Route path="/best-gay-twink-sites-2026" element={<BestTwink2026 />} />
        <Route path="/best-gay-sites-with-downloads" element={<BestWithDownloads />} />
        <Route path="/best-daddy-twink-sites" element={<BestDaddy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppShell = () => {
  const location = useLocation();

  // GA4 page-view tracking — fires on route change. Only sends data if the
  // user accepted cookies AND VITE_GA4_ID is configured (otherwise no-op).
  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Scroll restoration on navigation. Hash links scroll to anchor; otherwise top.
  React.useEffect(() => {
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
      <EmailCapturePopup />
      <CookieConsent />
      <ScrollProgressBar />
      <InstallPrompt />
      <ExitIntentDealPopup />
      <Suspense fallback={<PageLoader />}>
        <AnimatedRoutes />
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
