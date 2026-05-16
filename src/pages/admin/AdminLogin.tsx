import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/admin";
    const redirectTo = `${window.location.origin}/admin/callback?next=${encodeURIComponent(next)}`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (err) {
      setError(err.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Helmet>
        <title>Admin Login | TwinkVault</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl font-bold heading-gradient inline-block">TwinkVault Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your admin email — we'll send a magic link.</p>
        </div>
        {status === "sent" ? (
          <div className="glass-card rounded-lg p-6 text-center">
            <Mail size={28} className="mx-auto text-emerald-400 mb-3" />
            <p className="font-heading font-semibold">Check your email</p>
            <p className="mt-2 text-sm text-muted-foreground">A login link is on the way to <strong className="text-foreground">{email}</strong>. Open it on this device to sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-lg p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Admin email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-button bg-muted/30 border border-border px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-primary/50"
              />
            </label>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending" || !email}
              className="cta-btn w-full rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-[10px] text-muted-foreground/70">
          Access restricted to allowlisted admin emails only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
