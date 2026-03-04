import { useState } from "react";
import AnimateOnScroll from "./AnimateOnScroll";

const InlineEmailCapture = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    console.log("Inline email captured:", email);
    setSubmitted(true);
  };

  return (
    <AnimateOnScroll>
      <section className="py-16">
        <div className="container">
          <div className="relative overflow-hidden rounded-lg p-8 md:p-12" style={{
            background: "linear-gradient(135deg, hsl(240 20% 7%) 0%, hsl(263 30% 15%) 50%, hsl(240 20% 7%) 100%)"
          }}>
            {/* Subtle glow */}
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

            <div className="relative text-center md:text-left">
              <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">
                Never Miss a Deal
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Monthly roundup of the best twink site discounts. One email. No spam. Unsubscribe anytime.
              </p>

              {submitted ? (
                <div className="mt-6 flex items-center gap-2 text-sm font-medium" style={{ color: "hsl(142, 71%, 45%)" }}>
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
                    className="cta-btn gold-gradient rounded-button px-8 py-3 text-sm font-semibold text-secondary-foreground whitespace-nowrap"
                  >
                    Send Me The Deals
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
