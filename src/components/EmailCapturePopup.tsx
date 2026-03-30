import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { requestOverlay, releaseOverlay, useOverlaySlot } from "../hooks/useOverlayQueue";
import { supabase } from "@/integrations/supabase/client";

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
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("tv_popup_shown")) {
        sessionStorage.setItem("tv_popup_shown", "1");
        setNeeded(true);
        requestOverlay("email");
      }
    }, 12000);
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("tv_popup_shown")) {
        sessionStorage.setItem("tv_popup_shown", "1");
        setNeeded(true);
        requestOverlay("email");
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
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
    if (!email) return;
    setLoading(true);
    try {
      await saveEmail(email, "popup");
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
            <span className="text-4xl">✅</span>
            <p className="mt-4 font-heading text-xl font-bold">You're in!</p>
            <p className="mt-2 text-sm text-muted-foreground">Check your inbox.</p>
          </div>
        ) : (
          <>
            <span className="text-4xl">🔥</span>
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
