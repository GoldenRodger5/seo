import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "not-admin"; email: string }
  | { status: "admin"; email: string };

/**
 * Gates /admin/* routes. Three-phase check:
 *   1. Fetch the active Supabase session — no session → redirect to login
 *   2. Pull the user's admin_users row by email — no row → render 403
 *   3. Admin confirmed → render children
 *
 * The admin_users table has an RLS policy that lets authenticated users
 * read only their own row, so the lookup is both the allowlist check
 * AND a row-level access verification in a single query.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user?.email) {
        if (!cancelled) setState({ status: "unauthenticated" });
        return;
      }
      const email = session.user.email;
      // Look up by email (case-insensitive match via the policy's lower() compare).
      const { data, error } = await supabase
        .from("admin_users")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setState({ status: "not-admin", email });
      } else {
        setState({ status: "admin", email });
      }
    })();

    // Re-check on auth state changes (e.g. user signs in via magic link)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setState({ status: "loading" });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [location.pathname]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (state.status === "not-admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="font-heading text-3xl font-bold">403 — Not authorized</h1>
        <p className="mt-2 text-muted-foreground">{state.email} isn't on the admin allowlist for this site.</p>
        <button
          onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/admin/login"))}
          className="mt-6 rounded-button border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
