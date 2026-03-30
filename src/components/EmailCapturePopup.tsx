import { useState, useEffect } from "react";
import { X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function saveEmail(email: string, source: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ email, source, subscribed_at: new Date().toISOString() }),
  });
}

const EmailCapturePopup = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("tv_popup_shown")) return;
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("tv_popup_shown")) {
        sessionStorage.setItem("tv_popup_shown", "1");
        setShow(true);
      }
    }, 12000);
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("tv_popup_shown")) {
        sessionStorage.setItem("tv_popup_shown", "1");
        setShow(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await saveEmail(email, "popup");
    } catch { /* silent */ }
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => setShow(false), 2000);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card relative w-full max-w-md rounded-lg p-8 text-center">
        <button
          onClick={() => setShow(false)}
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
            <h3 className="mt-4 font-heading text-2xl font-bold">
              Get This Month's Best Deals
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll send you the top twink site discounts and new reviews once a month. No spam.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
              onClick={() => setShow(false)}
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
