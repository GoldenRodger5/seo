import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowUp, ArrowDown, Download, LogOut, Activity, RefreshCw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar, AreaChart, Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPageViews,
  fetchClicks,
  fetchImpressions,
  fetchVisitorFirstSeen,
  fetchSubscribers,
  fetchAllSubscribers,
  fetchSubscriberCount,
  aggregateDaily,
  aggregateHourly,
  aggregateByPage,
  aggregateDestinationCTR,
  aggregateEntryPages,
  aggregateReferrers,
  aggregateBySource,
  aggregateByPageType,
  aggregateByCountry,
  calcSessionQuality,
  calcVisitorStats,
  subscriberGrowth,
  metricsBetween,
  todayStartMs,
  dateRangeStart,
  pctChange,
  type DateRange,
  type PageStats,
} from "@/lib/adminQueries";

const REFRESH_INTERVAL_MS = 60_000;

// ISO 3166 alpha-2 → flag emoji (used in country table).
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
}

const RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const SOURCE_COLORS: Record<string, string> = {
  organic: "hsl(142, 71%, 45%)",
  social: "hsl(263, 70%, 60%)",
  referral: "hsl(199, 89%, 48%)",
  internal: "hsl(48, 96%, 53%)",
  direct: "hsl(0, 0%, 60%)",
};

function KpiCard({ label, value, prev, suffix, hint }: { label: string; value: number | string; prev?: number; suffix?: string; hint?: string }) {
  const change = (prev !== undefined && typeof value === "number") ? pctChange(value, prev) : null;
  return (
    <div className="glass-card rounded-lg p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </p>
      {change && (
        <p className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${change.pct >= 0 ? "text-emerald-400" : "text-destructive"}`}>
          {change.pct >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {Math.abs(change.pct).toFixed(1)}% vs previous period
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [views, setViews] = useState<Awaited<ReturnType<typeof fetchPageViews>>>([]);
  const [clicks, setClicks] = useState<Awaited<ReturnType<typeof fetchClicks>>>([]);
  const [impressions, setImpressions] = useState<Awaited<ReturnType<typeof fetchImpressions>>>([]);
  const [prevViews, setPrevViews] = useState<typeof views>([]);
  const [prevClicks, setPrevClicks] = useState<typeof clicks>([]);
  const [subs, setSubs] = useState<Awaited<ReturnType<typeof fetchSubscribers>>>([]);
  const [allSubs, setAllSubs] = useState<Awaited<ReturnType<typeof fetchAllSubscribers>>>([]);
  const [subCount, setSubCount] = useState(0);
  const [firstSeen, setFirstSeen] = useState<Map<string, string>>(new Map());
  const cancelRef = useRef(false);

  const loadData = useCallback(async (isInitial: boolean) => {
    if (isInitial) setLoading(true); else setRefreshing(true);
    try {
      const [v, c, im, fs, s, asubs, sc] = await Promise.all([
        fetchPageViews(range),
        fetchClicks(range),
        fetchImpressions(range),
        fetchVisitorFirstSeen(),
        fetchSubscribers(50),
        fetchAllSubscribers(),
        fetchSubscriberCount(),
      ]);
      if (cancelRef.current) return;
      setViews(v); setClicks(c); setImpressions(im); setFirstSeen(fs);
      setSubs(s); setAllSubs(asubs); setSubCount(sc);

      const periodMs = Date.now() - dateRangeStart(range).getTime();
      const prevStart = new Date(Date.now() - 2 * periodMs).toISOString();
      const prevEnd = dateRangeStart(range).toISOString();
      const [pv, pc] = await Promise.all([
        supabase.from("page_views").select("path, page_type, referrer, session_id, visitor_id, country, created_at").gte("created_at", prevStart).lt("created_at", prevEnd).limit(100_000),
        supabase.from("clicks").select("source_page, source_type, destination_slug, destination_url, referrer, session_id, visitor_id, country, created_at").gte("created_at", prevStart).lt("created_at", prevEnd).limit(100_000),
      ]);
      if (cancelRef.current) return;
      setPrevViews((pv.data ?? []) as typeof views);
      setPrevClicks((pc.data ?? []) as typeof clicks);
      setLastRefresh(new Date());
    } finally {
      if (!cancelRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [range]);

  useEffect(() => {
    cancelRef.current = false;
    loadData(true);
    const intervalId = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
    return () => { cancelRef.current = true; clearInterval(intervalId); };
  }, [loadData]);

  const daily = useMemo(() => aggregateDaily(views, clicks, 30), [views, clicks]);
  const hourly = useMemo(() => aggregateHourly(views, clicks, 24), [views, clicks]);
  const byPage = useMemo(() => aggregateByPage(views, clicks), [views, clicks]);
  const destCTR = useMemo(() => aggregateDestinationCTR(clicks, impressions), [clicks, impressions]);
  const entryPages = useMemo(() => aggregateEntryPages(views), [views]);
  const referrers = useMemo(() => aggregateReferrers(views, clicks), [views, clicks]);
  const sources = useMemo(() => aggregateBySource(views, clicks), [views, clicks]);
  const byType = useMemo(() => aggregateByPageType(views, clicks), [views, clicks]);
  const byCountry = useMemo(() => aggregateByCountry(views, clicks), [views, clicks]);
  const sessionQuality = useMemo(() => calcSessionQuality(views), [views]);
  const visitorStats = useMemo(
    () => calcVisitorStats(views, firstSeen, dateRangeStart(range).getTime()),
    [views, firstSeen, range],
  );
  const subGrowth = useMemo(() => subscriberGrowth(allSubs, 30), [allSubs]);
  const blogPages = useMemo(() => byPage.filter((p) => p.page_type === "blog" || p.page_type === "blog-index"), [byPage]);

  // Today + last hour snapshots (computed against full window)
  const todayMetrics = useMemo(() => metricsBetween(views, clicks, todayStartMs()), [views, clicks]);
  const lastHourMetrics = useMemo(() => metricsBetween(views, clicks, Date.now() - 3_600_000), [views, clicks]);

  const totalViews = views.length;
  const totalClicks = clicks.length;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const prevCtr = prevViews.length > 0 ? (prevClicks.length / prevViews.length) * 100 : 0;
  const topConvertingPage = byPage.find((p) => p.clicks > 0)?.path ?? "—";

  const totalSubs = allSubs.length;
  const subsCumulative = subGrowth.length > 0 ? subGrowth[subGrowth.length - 1].cumulative : 0;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  const exportSubsCsv = () => {
    const csv = ["email,source_page,created_at", ...allSubs.map((s) => `${s.email},${s.source_page ?? ""},${s.created_at}`)].join("\n");
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
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
              auto · last {Math.max(1, Math.floor((Date.now() - lastRefresh.getTime()) / 1000))}s
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
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

        {/* TODAY — real-time pulse */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Activity size={12} className="text-emerald-400 animate-pulse" />
            Today (since midnight local)
            {lastHourMetrics.uniqueSessions > 0 && (
              <span className="ml-2 text-emerald-400 font-semibold normal-case tracking-normal">
                · {lastHourMetrics.uniqueSessions} active in last hour
              </span>
            )}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Sessions today" value={todayMetrics.uniqueSessions} hint={`${lastHourMetrics.uniqueSessions} in last hour`} />
            <KpiCard label="Views today" value={todayMetrics.views} hint={`${lastHourMetrics.views} in last hour`} />
            <KpiCard label="Clicks today" value={todayMetrics.clicks} hint={`${lastHourMetrics.clicks} in last hour`} />
            <KpiCard label="CTR today" value={Number(todayMetrics.ctr.toFixed(2))} suffix="%" hint="clicks / views" />
          </div>
        </section>

        {/* OVERVIEW — selected date-range KPIs */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Overview · {RANGES.find((r) => r.value === range)?.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Page views" value={totalViews} prev={prevViews.length} />
            <KpiCard label="Affiliate clicks" value={totalClicks} prev={prevClicks.length} />
            <KpiCard label="CTR" value={Number(ctr.toFixed(2))} prev={Number(prevCtr.toFixed(2))} suffix="%" />
            <KpiCard label="New subscribers" value={subs.length} hint={`${subCount.toLocaleString()} all-time`} />
            <div className="glass-card rounded-lg p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Top-converting page</p>
              <p className="mt-2 font-mono text-xs truncate">{topConvertingPage}</p>
            </div>
          </div>
        </section>

        {/* SESSION QUALITY + VISITOR MIX */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Session quality &amp; visitor mix</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Unique sessions"
              value={sessionQuality.totalSessions}
              hint={`${(totalViews / Math.max(sessionQuality.totalSessions, 1)).toFixed(1)} views per session`}
            />
            <KpiCard
              label="Avg pages / session"
              value={Number(sessionQuality.avgPagesPerSession.toFixed(2))}
              hint={sessionQuality.avgPagesPerSession >= 2 ? "Healthy depth" : "Visitors exiting quickly"}
            />
            <KpiCard
              label="Bounce rate"
              value={Number(sessionQuality.bounceRate.toFixed(1))}
              suffix="%"
              hint={`${sessionQuality.bouncedSessions} single-page sessions`}
            />
            <KpiCard
              label="New vs returning"
              value={`${visitorStats.newVisitors} / ${visitorStats.returningVisitors}`}
              hint={visitorStats.totalVisitors > 0 ? `${visitorStats.returningPct.toFixed(0)}% returning` : "no visitors yet"}
            />
          </div>
        </section>

        {/* TRAFFIC chart (daily, 30d) */}
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

        {/* HOURLY chart (last 24h) */}
        <section>
          <div className="glass-card rounded-lg p-5">
            <h3 className="font-heading text-lg font-semibold mb-4">Hourly activity (last 24 hours)</h3>
            {loading ? (
              <div className="h-48 animate-pulse rounded-lg bg-muted/30" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                  <Bar dataKey="clicks" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* SUBSCRIBER growth chart */}
        <section>
          <div className="glass-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold">Subscriber growth (last 30 days)</h3>
              <span className="text-xs text-muted-foreground">{totalSubs.toLocaleString()} total · {subsCumulative.toLocaleString()} cumulative</span>
            </div>
            {loading ? (
              <div className="h-48 animate-pulse rounded-lg bg-muted/30" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={subGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} strokeWidth={2} />
                  <Line type="monotone" dataKey="newSubs" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* TOP PAGES — traffic + revenue drivers */}
        <section className="grid gap-6 lg:grid-cols-2">
          <PagesTable rows={byPage} title="Top pages by traffic" sortKey="views" />
          <PagesTable rows={byPage} title="Top pages by clicks (revenue drivers)" sortKey="clicks" />
        </section>

        {/* ENTRY PAGES + DESTINATIONS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Top entry pages</h3>
              <p className="text-xs text-muted-foreground mt-0.5">First page visitors land on (real front doors)</p>
            </div>
            {entryPages.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Path</th>
                      <th className="px-6 py-2 font-medium text-right">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryPages.slice(0, 15).map((e) => (
                      <tr key={e.path} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-mono text-[12px] truncate max-w-[260px]">
                          <Link to={`/admin/page${encodeURIComponent(e.path)}`} className="hover:text-secondary">{e.path}</Link>
                        </td>
                        <td className="px-6 py-2.5 text-right font-semibold">{e.sessions.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Destination CTR (revenue lever)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Clicks ÷ impressions — which sites convert when shown</p>
            </div>
            {destCTR.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No impressions or clicks yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Site</th>
                      <th className="px-4 py-2 font-medium text-right">Impressions</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-6 py-2 font-medium text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destCTR.slice(0, 15).map((d) => (
                      <tr key={d.slug} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-semibold">
                          <Link to={`/admin/destination/${d.slug}`} className="hover:text-secondary">{d.slug}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{d.impressions.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{d.clicks.toLocaleString()}</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{d.impressions > 0 ? d.ctr.toFixed(2) + "%" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* PAGE-TYPE FUNNEL */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Conversion by page type</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Which kinds of content actually drive clicks</p>
            </div>
            {byType.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Page type</th>
                      <th className="px-4 py-2 font-medium text-right">Views</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-6 py-2 font-medium text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byType.map((row) => (
                      <tr key={row.page_type} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-semibold">{row.page_type}</td>
                        <td className="px-4 py-2.5 text-right">{row.views.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{row.clicks.toLocaleString()}</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{row.ctr.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* TRAFFIC SOURCES + REFERRERS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Traffic sources</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How visitors found the site</p>
            </div>
            {sources.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Source</th>
                      <th className="px-4 py-2 font-medium text-right">Views</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-6 py-2 font-medium text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((row) => (
                      <tr key={row.category} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-semibold flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[row.category] ?? "hsl(var(--muted))" }} />
                          {row.category}
                        </td>
                        <td className="px-4 py-2.5 text-right">{row.views.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">{row.clicks.toLocaleString()}</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{row.ctr.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Top referrers</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Raw URLs that sent traffic</p>
            </div>
            {referrers.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Referrer</th>
                      <th className="px-4 py-2 font-medium text-right">Views</th>
                      <th className="px-6 py-2 font-medium text-right">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrers.slice(0, 15).map((row) => (
                      <tr key={row.referrer} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-mono text-[11px] truncate max-w-[260px] flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[row.category] ?? "hsl(var(--muted))" }} />
                          {row.referrer}
                        </td>
                        <td className="px-4 py-2.5 text-right">{row.views.toLocaleString()}</td>
                        <td className="px-6 py-2.5 text-right font-semibold">{row.clicks.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* GEOGRAPHIC DISTRIBUTION */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Geographic distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Visitor country (via Vercel edge geolocation)</p>
            </div>
            {byCountry.length === 0 || (byCountry.length === 1 && byCountry[0].country === "??") ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                {byCountry.length === 0 ? "No data yet." : "Country not yet captured — new visits after this deploy will include country."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Country</th>
                      <th className="px-4 py-2 font-medium text-right">Views</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-6 py-2 font-medium text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCountry.slice(0, 15).map((c) => (
                      <tr key={c.country} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-semibold">
                          <span className="mr-2 text-base">{c.country === "??" ? "🌐" : countryFlag(c.country)}</span>
                          {c.country === "??" ? "Unknown" : c.country}
                        </td>
                        <td className="px-4 py-2.5 text-right">{c.views.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{c.clicks.toLocaleString()}</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{c.views > 0 ? c.ctr.toFixed(1) + "%" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* TOP BLOG POSTS */}
        {blogPages.length > 0 && (
          <section>
            <div className="glass-card rounded-lg overflow-hidden">
              <div className="px-6 pt-5 pb-2">
                <h3 className="font-heading text-lg font-semibold">Top blog posts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Editorial content performance</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-2 font-medium">Path</th>
                      <th className="px-4 py-2 font-medium text-right">Views</th>
                      <th className="px-4 py-2 font-medium text-right">Clicks</th>
                      <th className="px-6 py-2 font-medium text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogPages.slice(0, 20).map((row) => (
                      <tr key={row.path} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="px-6 py-2.5 font-mono text-[12px] truncate max-w-[320px]">
                          <Link to={`/admin/page${encodeURIComponent(row.path)}`} className="hover:text-secondary">{row.path}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-right">{row.views.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{row.clicks.toLocaleString()}</td>
                        <td className="px-6 py-2.5 text-right text-secondary">{row.ctr.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* RECENT SUBSCRIBERS */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">Recent subscribers ({subCount.toLocaleString()} total)</h3>
              {allSubs.length > 0 && (
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
