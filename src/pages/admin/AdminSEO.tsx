import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import {
  fetchGscDailyTotals,
  fetchGscQueries,
  aggregateTopQueries,
  aggregateOpportunityQueries,
  aggregateClosePage1,
} from "@/lib/gscQueries";

const AdminSEO = () => {
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<Awaited<ReturnType<typeof fetchGscDailyTotals>>>([]);
  const [queries, setQueries] = useState<Awaited<ReturnType<typeof fetchGscQueries>>>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [d, q] = await Promise.all([fetchGscDailyTotals(30), fetchGscQueries(7)]);
      if (cancelled) return;
      setDaily(d); setQueries(q);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const topQueries = useMemo(() => aggregateTopQueries(queries, 50), [queries]);
  const opportunities = useMemo(() => aggregateOpportunityQueries(queries), [queries]);
  const close = useMemo(() => aggregateClosePage1(queries), [queries]);
  const noData = !loading && daily.length === 0 && queries.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>SEO — Search Console | TwinkVault Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b border-border/40 bg-card/30">
        <div className="container max-w-7xl flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <span className="font-heading text-lg font-bold heading-gradient">SEO — Search Console</span>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl py-8 space-y-8">

        {noData && (
          <div className="glass-card rounded-lg p-6 border border-secondary/30">
            <h3 className="font-heading text-lg font-semibold">GSC sync not yet populated</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The daily Search Console sync hasn't yet populated data, or the
              service account / env vars aren't configured. See{" "}
              <code className="bg-muted/40 px-1.5 py-0.5 rounded text-xs">docs/gsc-setup.md</code>{" "}
              for the setup checklist. Once configured, the cron runs daily at
              04:00 UTC and data will appear here within 24 hours.
            </p>
          </div>
        )}

        {/* Daily totals chart */}
        <section>
          <div className="glass-card rounded-lg p-5">
            <h3 className="font-heading text-lg font-semibold mb-4">Clicks &amp; impressions — last 30 days</h3>
            {loading ? (
              <div className="h-72 animate-pulse rounded-lg bg-muted/30" />
            ) : daily.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data — set up GSC sync to populate.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Top queries */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Top queries (last 7 days)</h3>
            </div>
            {topQueries.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No queries — waiting on GSC sync.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Query</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-4 py-2 font-medium text-right">Impressions</th>
                      <th className="px-4 py-2 font-medium text-right">CTR</th>
                      <th className="px-6 py-2 font-medium text-right">Avg pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQueries.map((q) => (
                      <tr key={q.query} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 text-[12px] truncate max-w-[400px]">{q.query}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{q.clicks.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">{q.impressions.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">{q.avgCtr.toFixed(2)}%</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{q.avgPosition.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Opportunity queries */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Opportunity queries</h3>
              <p className="text-xs text-muted-foreground mt-0.5">High impressions, low CTR — usually a title/description mismatch</p>
            </div>
            {opportunities.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No opportunities surfaced yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Query</th>
                    <th className="px-4 py-2 font-medium text-right">Impressions</th>
                    <th className="px-6 py-2 font-medium text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((q) => (
                    <tr key={q.query} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-6 py-2.5 text-[12px] truncate max-w-[300px]">{q.query}</td>
                      <td className="px-4 py-2.5 text-right">{q.impressions.toLocaleString()}</td>
                      <td className="px-6 py-2.5 text-right text-destructive">{q.avgCtr.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Close-to-page-1</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Position 4-15 — achievable wins with content updates</p>
            </div>
            {close.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No close-to-page-1 queries surfaced yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Query</th>
                    <th className="px-4 py-2 font-medium text-right">Pos</th>
                    <th className="px-6 py-2 font-medium text-right">Impr</th>
                  </tr>
                </thead>
                <tbody>
                  {close.map((q) => (
                    <tr key={q.query} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-6 py-2.5 text-[12px] truncate max-w-[300px]">{q.query}</td>
                      <td className="px-4 py-2.5 text-right text-secondary">{q.avgPosition.toFixed(1)}</td>
                      <td className="px-6 py-2.5 text-right">{q.impressions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminSEO;
