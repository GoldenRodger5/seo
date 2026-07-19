import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

/**
 * Price-drop alert capture, reusable across surfaces. Writes both the
 * legacy `source` column and `source_page` (what the admin dashboard's
 * per-source breakdown reads) so every placement is measurable.
 *
 * Placement philosophy: ask at moments of deal intent (discount pages,
 * the pricing index, the deals hub) with a specific promise — one email
 * when a price actually drops — never a generic "join our newsletter".
 */
const DealAlertSignup = ({
  source,
  title = "Price-drop alerts",
  blurb = "We track pricing across 60+ sites. Get one email when a deal genuinely drops — nothing else.",
  className = "",
}: {
  source: string;
  title?: string;
  blurb?: string;
  className?: string;
}) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "err">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "busy") return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus("err"); return; }
    setStatus("busy");
    try {
      const { error } = await supabase.from("subscribers").insert({
        email: email.trim().toLowerCase(),
        source,
        source_page: source,
      } as never);
      if (error && !error.message.includes("duplicate")) { setStatus("err"); return; }
      setStatus("ok");
      setEmail("");
      trackEvent("email_signup", { source });
    } catch {
      setStatus("err");
    }
  };

  return (
    <div className={`rounded-lg border border-border/50 bg-card/40 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 ${className}`}>
      <div className="max-w-md">
        <p className="font-heading text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{blurb}</p>
      </div>
      {status === "ok" ? (
        <p className="mt-3 sm:mt-0 text-sm font-medium text-emerald-400">You're on the list.</p>
      ) : (
        <form onSubmit={submit} className="mt-3 sm:mt-0 flex w-full max-w-sm gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "err") setStatus("idle"); }}
            placeholder="you@email.com"
            aria-label="Email for price-drop alerts"
            className="min-w-0 flex-1 rounded-button border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={status === "busy"}
            className="shrink-0 rounded-button gold-gradient px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
          >
            {status === "busy" ? "…" : "Alert me"}
          </button>
        </form>
      )}
      {status === "err" && <p className="mt-2 text-xs text-destructive sm:mt-0">Enter a valid email.</p>}
    </div>
  );
};

export default DealAlertSignup;
