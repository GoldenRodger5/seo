import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { requestOverlay, releaseOverlay, useOverlaySlot } from "../hooks/useOverlayQueue";
import { supabase } from "@/integrations/supabase/client";
import { isValidEmail } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

async function saveEmail(email: string, source: string) {
  await supabase.from("subscribers").insert({
    email,
    source,
    subscribed_at: new Date().toISOString(),
  });
}

const EmailCapturePopup = () => {
  const [needed, setNeeded] = useState(false);
  const canShow = useOverlaySlot("email");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("tv_popup_shown")) return;

    const fire = () => {
      if (sessionStorage.getItem("tv_popup_shown")) return;
      sessionStorage.setItem("tv_popup_shown", "1");
      setNeeded(true);
      requestOverlay("email");
    };

    const timer = setTimeout(fire, 12000);

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) fire();
    };

    // Scroll trigger: fire once user has scrolled past 50% of the page.
    // Especially relevant on long review/listicle pages where 12s timer
    // may fire before the user is engaged enough to convert.
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= 0.5) fire();
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!needed || !canShow) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [needed, canShow]);

  const close = () => {
    setNeeded(false);
    releaseOverlay("email");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) return;
    setLoading(true);
    try {
      await saveEmail(email.trim(), "popup");
      trackEvent("email_signup", { source: "popup" });
    } catch { /* silent */ }
    setLoading(false);
    setSubmitted(true);
    setTimeout(close, 2000);
  };

  if (!needed || !canShow) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-popup-title"
    >
      <div className="glass-card relative w-full max-w-md rounded-lg p-8 text-center">
        <button
          onClick={close}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-6">
            <p className="mt-4 font-heading text-xl font-bold">You're in</p>
            <p className="mt-2 text-sm text-muted-foreground">Check your inbox.</p>
          </div>
        ) : (
          <>
            <h3 id="email-popup-title" className="mt-4 font-heading text-2xl font-bold">
              One Email a Month. Just Deals.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The best discounts and new reviews, once a month. No fluff, no spam, unsubscribe anytime.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                className="w-full rounded-button border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="cta-btn gold-gradient w-full rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground disabled:opacity-70"
              >
                {loading ? "Saving..." : "Send Me The Deals"}
              </button>
            </form>
            <button
              onClick={close}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailCapturePopup;
