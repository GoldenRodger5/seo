import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import StickyDealBar from "./StickyDealBar";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-button focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
    >
      Skip to main content
    </a>
    <StickyDealBar />
    <Navbar />
    <main id="main-content" className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default Layout;
