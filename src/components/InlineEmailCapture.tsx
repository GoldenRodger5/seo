import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";
import { supabase } from "@/integrations/supabase/client";

async function saveEmail(email: string, source: string) {
  await supabase.from("subscribers").insert({
    email,
    source,
    subscribed_at: new Date().toISOString(),
  });
}

const InlineEmailCapture = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await saveEmail(email, "homepage");
    } catch {
      // Still show success — don't punish user for backend issues
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AnimateOnScroll>
      <section className="py-16">
        <div className="container">
          <div className="relative overflow-hidden rounded-lg border border-primary/30 p-8 md:p-12" style={{
            background: "linear-gradient(135deg, hsl(263 30% 12%) 0%, hsl(240 40% 10%) 50%, hsl(240 30% 8%) 100%)"
          }}>
            {/* Decorative sparkle */}
            <div className="pointer-events-none absolute right-6 top-6">
              <Sparkles size={32} className="text-primary/30" />
            </div>

            {/* Subtle glow */}
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/15 blur-[100px]" />

            <div className="relative text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <Mail size={28} className="text-primary" />
                <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">
                  Never Miss a Deal
                </h2>
              </div>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Monthly roundup of the best twink site discounts. One email. No spam. Unsubscribe anytime.
              </p>

              {submitted ? (
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-400 justify-center md:justify-start">
                  ✅ You're in! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-button border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:max-w-xs"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="cta-btn gold-gradient rounded-button px-8 py-3 text-sm font-semibold text-secondary-foreground whitespace-nowrap disabled:opacity-70"
                  >
                    {loading ? "Saving..." : "Send Me The Deals"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
};

export default InlineEmailCapture;
