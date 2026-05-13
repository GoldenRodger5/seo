import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowUp, ArrowDown, Download, LogOut } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPageViews,
  fetchClicks,
  fetchSubscribers,
  fetchSubscriberCount,
  aggregateDaily,
  aggregateByPage,
  aggregateByDestination,
  dateRangeStart,
  pctChange,
  type DateRange,
  type PageStats,
} from "@/lib/adminQueries";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function KpiCard({ label, value, prev, suffix }: { label: string; value: number; prev?: number; suffix?: string }) {
  const change = prev !== undefined ? pctChange(value, prev) : null;
  return (
    <div className="glass-card rounded-lg p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold">{value.toLocaleString()}{suffix}</p>
      {change && (
        <p className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${change.pct >= 0 ? "text-emerald-400" : "text-destructive"}`}>
          {change.pct >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {Math.abs(change.pct).toFixed(1)}% vs previous period
        </p>
      )}
    </div>
  );
}

function PagesTable({ rows, title, sortKey }: { rows: PageStats[]; title: string; sortKey: "views" | "clicks" }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 20),
    [rows, sortKey],
  );
  if (sorted.length === 0) {
    return (
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-heading text-lg font-semibold mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground">No data yet — check back tomorrow.</p>
      </div>
    );
  }
  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="px-6 pt-5 pb-2">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-2 font-medium">Path</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium text-right">Views</th>
              <th className="px-4 py-2 font-medium text-right">Clicks</th>
              <th className="px-6 py-2 font-medium text-right">CTR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.path} className="border-b border-border/20 hover:bg-muted/20">
                <td className="px-6 py-2.5 font-mono text-[12px] truncate max-w-[280px]">
                  <Link to={`/admin/page${encodeURIComponent(row.path)}`} className="hover:text-secondary">{row.path}</Link>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.page_type}</td>
                <td className="px-4 py-2.5 text-right">{row.views.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{row.clicks.toLocaleString()}</td>
                <td className="px-6 py-2.5 text-right text-secondary">{row.ctr.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const [range, setRange] = useState<DateRange>("7d");
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<Awaited<ReturnType<typeof fetchPageViews>>>([]);
  const [clicks, setClicks] = useState<Awaited<ReturnType<typeof fetchClicks>>>([]);
  const [prevViews, setPrevViews] = useState<typeof views>([]);
  const [prevClicks, setPrevClicks] = useState<typeof clicks>([]);
  const [subs, setSubs] = useState<Awaited<ReturnType<typeof fetchSubscribers>>>([]);
  const [subCount, setSubCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [v, c, s, sc] = await Promise.all([
        fetchPageViews(range),
        fetchClicks(range),
        fetchSubscribers(50),
        fetchSubscriberCount(),
      ]);
      if (cancelled) return;
      setViews(v); setClicks(c); setSubs(s); setSubCount(sc);

      // Previous-period comparison (same window, shifted back)
      const periodMs = Date.now() - dateRangeStart(range).getTime();
      const prevStart = new Date(Date.now() - 2 * periodMs).toISOString();
      const prevEnd = dateRangeStart(range).toISOString();
      const [pv, pc] = await Promise.all([
        supabase.from("page_views").select("path, page_type, created_at").gte("created_at", prevStart).lt("created_at", prevEnd).limit(100_000),
        supabase.from("clicks").select("source_page, source_type, destination_slug, destination_url, created_at").gte("created_at", prevStart).lt("created_at", prevEnd).limit(100_000),
      ]);
      if (cancelled) return;
      setPrevViews((pv.data ?? []) as typeof views);
      setPrevClicks((pc.data ?? []) as typeof clicks);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const daily = useMemo(() => aggregateDaily(views, clicks, 30), [views, clicks]);
  const byPage = useMemo(() => aggregateByPage(views, clicks), [views, clicks]);
  const byDest = useMemo(() => aggregateByDestination(clicks), [clicks]);

  const totalViews = views.length;
  const totalClicks = clicks.length;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const prevCtr = prevViews.length > 0 ? (prevClicks.length / prevViews.length) * 100 : 0;
  const topConvertingPage = byPage[0]?.path ?? "—";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  const exportSubsCsv = () => {
    const csv = ["email,source_page,created_at", ...subs.map((s) => `${s.email},${s.source_page ?? ""},${s.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard | TwinkVault</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b border-border/40 bg-card/30 sticky top-0 z-10 backdrop-blur">
        <div className="container max-w-7xl flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="font-heading text-lg font-bold heading-gradient">TwinkVault Admin</Link>
            <span className="text-xs text-muted-foreground">/ dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as DateRange)}
              className="rounded-button bg-muted/30 border border-border px-3 py-1.5 text-xs"
            >
              {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs hover:bg-muted/50">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl py-8 space-y-8">
        {/* KPI cards */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Page views" value={totalViews} prev={prevViews.length} />
            <KpiCard label="Affiliate clicks" value={totalClicks} prev={prevClicks.length} />
            <KpiCard label="CTR" value={Number(ctr.toFixed(2))} prev={Number(prevCtr.toFixed(2))} suffix="%" />
            <KpiCard label="New subscribers" value={subs.length} />
            <div className="glass-card rounded-lg p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Top-converting page</p>
              <p className="mt-2 font-mono text-xs truncate">{topConvertingPage}</p>
            </div>
          </div>
        </section>

        {/* Traffic chart */}
        <section>
          <div className="glass-card rounded-lg p-5">
            <h3 className="font-heading text-lg font-semibold mb-4">Traffic (last 30 days)</h3>
            {loading ? (
              <div className="h-72 animate-pulse rounded-lg bg-muted/30" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
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
        </section>

        {/* Tables */}
        <section className="grid gap-6 lg:grid-cols-2">
          <PagesTable rows={byPage} title="Top pages by traffic" sortKey="views" />
          <PagesTable rows={byPage} title="Top pages by clicks (revenue drivers)" sortKey="clicks" />
        </section>

        {/* Destinations */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Top destination sites</h3>
            </div>
            {byDest.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No clicks yet — check back tomorrow.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Site</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-4 py-2 font-medium">Top source page</th>
                      <th className="px-6 py-2 font-medium text-right">% of total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDest.slice(0, 20).map((d) => (
                      <tr key={d.slug} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-semibold">
                          <Link to={`/admin/destination/${d.slug}`} className="hover:text-secondary">{d.slug}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-right">{d.clicks.toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground truncate max-w-[280px]">{d.topSource}</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{totalClicks > 0 ? ((d.clicks / totalClicks) * 100).toFixed(1) : "0.0"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Subscribers */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">Recent subscribers ({subCount} total)</h3>
              {subs.length > 0 && (
                <button onClick={exportSubsCsv} className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs hover:bg-muted/50">
                  <Download size={12} /> Export CSV
                </button>
              )}
            </div>
            {subs.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No subscribers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Source page</th>
                      <th className="px-6 py-2 font-medium">Signed up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.email + s.created_at} className="border-b border-border/20">
                        <td className="px-6 py-2.5 font-mono text-[12px]">{s.email}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{s.source_page ?? "—"}</td>
                        <td className="px-6 py-2.5 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
