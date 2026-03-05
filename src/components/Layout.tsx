import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import StickyDealBar from "./StickyDealBar";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <StickyDealBar />
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default Layout;
