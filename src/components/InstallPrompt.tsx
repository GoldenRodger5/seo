import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { X, Download } from "lucide-react";
import { requestOverlay, releaseOverlay, useOverlaySlot } from "../hooks/useOverlayQueue";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "tv_pwa_dismissed";
const PAGE_COUNT_KEY = "tv_pwa_page_count";

const InstallPrompt = () => {
  const [needed, setNeeded] = useState(false);
  const canShow = useOverlaySlot("install");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;

      const count = parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) || "0", 10);
      if (count >= 2) {
        setNeeded(true);
        requestOverlay("install");
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => {
      setNeeded(false);
      releaseOverlay("install");
      deferredPrompt.current = null;
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const count = parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) || "0", 10) + 1;
    sessionStorage.setItem(PAGE_COUNT_KEY, String(count));

    if (count >= 2 && deferredPrompt.current) {
      setNeeded(true);
      requestOverlay("install");
    }
  }, [location.pathname]);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    deferredPrompt.current = null;
    setNeeded(false);
    releaseOverlay("install");
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setNeeded(false);
    releaseOverlay("install");
  };

  if (!needed || !canShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-[#0a0a0f]/95 backdrop-blur-md border-t border-white/10 px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3">
        <p className="text-sm text-white/80 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#f59e0b] shrink-0" />
          Add TwinkVault to your home screen
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 rounded-lg bg-[#f59e0b] text-black text-sm font-semibold hover:bg-[#f59e0b]/90 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
