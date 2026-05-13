import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fetchClicks, fetchPageViews, aggregateDaily, type ClickRow, type PageViewRow } from "@/lib/adminQueries";
import { getSiteBySlug } from "@/data/sites";

interface SourceStats { path: string; clicks: number; views: number; ctr: number }

const AdminDestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [views, setViews] = useState<PageViewRow[]>([]);
  const site = slug ? getSiteBySlug(slug) : undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [c, v] = await Promise.all([fetchClicks("90d"), fetchPageViews("90d")]);
      if (cancelled) return;
      setClicks(c.filter((row) => row.destination_slug === slug));
      setViews(v);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const daily = useMemo(() => aggregateDaily([], clicks, 30), [clicks]);
  const bySource = useMemo<SourceStats[]>(() => {
    const map = new Map<string, { clicks: number; views: number }>();
    for (const c of clicks) {
      const path = c.source_page ?? "(unknown)";
      if (!map.has(path)) map.set(path, { clicks: 0, views: 0 });
      map.get(path)!.clicks++;
    }
    for (const v of views) {
      const path = v.path;
      const entry = map.get(path);
      if (entry) entry.views++;
    }
    return [...map.entries()]
      .map(([path, d]) => ({ path, clicks: d.clicks, views: d.views, ctr: d.views > 0 ? (d.clicks / d.views) * 100 : 0 }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [clicks, views]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{slug} clicks | TwinkVault Admin</title>
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
        <div>
          <h1 className="font-heading text-2xl font-bold">{site?.name ?? slug}</h1>
          <p className="text-sm text-muted-foreground">Destination drill-down · last 90 days</p>
          {site && (
            <Link to={`/reviews/${slug}`} className="mt-1 inline-block text-xs text-secondary hover:underline">View public review →</Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total clicks (90d)</p>
            <p className="mt-2 font-heading text-2xl font-bold">{clicks.length}</p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Distinct source pages</p>
            <p className="mt-2 font-heading text-2xl font-bold">{bySource.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h3 className="font-heading text-lg font-semibold mb-4">Click volume over time (30d)</h3>
          {loading ? <div className="h-64 animate-pulse rounded-lg bg-muted/30" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-lg overflow-hidden">
          <div className="px-6 pt-5 pb-2"><h3 className="font-heading text-lg font-semibold">Source pages driving clicks</h3></div>
          {bySource.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No clicks to this destination yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-2 font-medium">Source page</th>
                  <th className="px-4 py-2 font-medium text-right">Views</th>
                  <th className="px-4 py-2 font-medium text-right">Clicks</th>
                  <th className="px-6 py-2 font-medium text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {bySource.slice(0, 20).map((s) => (
                  <tr key={s.path} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="px-6 py-2.5 font-mono text-[12px] truncate max-w-[300px]">
                      <Link to={`/admin/page${s.path}`} className="hover:text-secondary">{s.path}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">{s.views}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{s.clicks}</td>
                    <td className="px-6 py-2.5 text-right text-secondary">{s.ctr.toFixed(1)}%</td>
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

export default AdminDestinationDetail;
