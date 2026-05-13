import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import {
  fetchPageViews,
  fetchClicks,
  aggregateDaily,
  aggregateByDestination,
} from "@/lib/adminQueries";

const AdminPageDetail = () => {
  const params = useParams();
  // URL is /admin/page/* — the path comes through as a wildcard
  const path = "/" + (params["*"] ?? "").split("/").filter(Boolean).join("/");
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<Awaited<ReturnType<typeof fetchPageViews>>>([]);
  const [clicks, setClicks] = useState<Awaited<ReturnType<typeof fetchClicks>>>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [v, c] = await Promise.all([fetchPageViews("90d"), fetchClicks("90d")]);
      if (cancelled) return;
      setViews(v.filter((row) => row.path === path));
      setClicks(c.filter((row) => row.source_page === path));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [path]);

  const daily = useMemo(() => aggregateDaily(views, clicks, 30), [views, clicks]);
  const dests = useMemo(() => aggregateByDestination(clicks), [clicks]);
  const ctr = views.length > 0 ? (clicks.length / views.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{path} | TwinkVault Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="border-b border-border/40 bg-card/30">
        <div className="container max-w-7xl py-4 flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </div>
      </header>
      <main className="container max-w-5xl py-8 space-y-6">
        <h1 className="font-heading text-2xl font-bold">Page detail</h1>
        <p className="font-mono text-sm text-muted-foreground break-all">{path}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Views (90d)</p>
            <p className="mt-2 font-heading text-2xl font-bold">{views.length}</p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Clicks (90d)</p>
            <p className="mt-2 font-heading text-2xl font-bold">{clicks.length}</p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">CTR</p>
            <p className="mt-2 font-heading text-2xl font-bold">{ctr.toFixed(2)}%</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h3 className="font-heading text-lg font-semibold mb-4">Daily activity (30d)</h3>
          {loading ? <div className="h-72 animate-pulse rounded-lg bg-muted/30" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-lg overflow-hidden">
          <div className="px-6 pt-5 pb-2"><h3 className="font-heading text-lg font-semibold">Destinations clicked from this page</h3></div>
          {dests.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No clicks recorded from this page yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-2 font-medium">Destination</th>
                  <th className="px-6 py-2 font-medium text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {dests.map((d) => (
                  <tr key={d.slug} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="px-6 py-2.5 font-semibold">
                      <Link to={`/admin/destination/${d.slug}`} className="hover:text-secondary">{d.slug}</Link>
                    </td>
                    <td className="px-6 py-2.5 text-right">{d.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPageDetail;
