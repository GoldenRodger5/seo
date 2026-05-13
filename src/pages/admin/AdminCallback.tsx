import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

/**
 * Magic-link landing page. Supabase Auth has already handled the token
 * exchange via the URL hash by the time this component mounts (the
 * supabase client auto-detects and exchanges). We just verify the
 * session lands and redirect to ?next (default /admin).
 */
const AdminCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // Small delay to let the supabase client process the hash params.
      await new Promise((r) => setTimeout(r, 100));
      const { data } = await supabase.auth.getSession();
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/admin";
      if (data.session) {
        navigate(next, { replace: true });
      } else {
        navigate("/admin/login", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Helmet>
        <title>Signing in… | TwinkVault Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

export default AdminCallback;
