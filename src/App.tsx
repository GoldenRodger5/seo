import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";
import AgeVerification from "./components/AgeVerification";
import EmailCapturePopup from "./components/EmailCapturePopup";
import CustomCursor from "./components/CustomCursor";
import ScrollProgressBar from "./components/ScrollProgressBar";
import Index from "./pages/Index";
import TopSites from "./pages/TopSites";
import ReviewPage from "./pages/ReviewPage";
import ReviewsIndex from "./pages/ReviewsIndex";
import CategoryPage from "./pages/CategoryPage";
import BestDeals from "./pages/BestDeals";
import FindMySite from "./pages/FindMySite";
import GoRedirect from "./pages/GoRedirect";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AffiliateDisclosure from "./pages/AffiliateDisclosure";
import ComparePage from "./pages/ComparePage";
import SitemapPage from "./pages/SitemapPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
        <Route path="/go/:slug" element={<GoRedirect />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/compare/:slug" element={<ComparePage />} />
        <Route path="/sitemap" element={<SitemapPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CustomCursor />
        <AgeVerification />
        <EmailCapturePopup />
        <BrowserRouter>
          <ScrollProgressBar />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
