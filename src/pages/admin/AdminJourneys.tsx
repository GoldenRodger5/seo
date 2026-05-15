import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import {
  fetchPageViews,
  fetchClicks,
  reconstructJourneys,
  aggregateJourneyPaths,
  aggregatePreClickPaths,
  type DateRange,
} from "@/lib/adminQueries";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const AdminJourneys = () => {
  const [range, setRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<Awaited<ReturnType<typeof fetchPageViews>>>([]);
  const [clicks, setClicks] = useState<Awaited<ReturnType<typeof fetchClicks>>>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [v, c] = await Promise.all([fetchPageViews(range), fetchClicks(range)]);
      if (cancelled) return;
      setViews(v); setClicks(c);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const journeys = useMemo(() => reconstructJourneys(views, clicks), [views, clicks]);
  const topPaths = useMemo(() => aggregateJourneyPaths(journeys, 3, true).slice(0, 20), [journeys]);
  const convertingPaths = useMemo(() => topPaths.filter((p) => p.converted > 0), [topPaths]);
  const bouncePaths = useMemo(
    () => journeys.filter((j) => j.pages === 1 && !j.converted),
    [journeys],
  );
  const preClick = useMemo(() => aggregatePreClickPaths(journeys, 10), [journeys]);

  const convertingSessions = journeys.filter((j) => j.converted);
  const nonConvertingSessions = journeys.filter((j) => !j.converted);
  const avgPagesConverting =
    convertingSessions.length > 0
      ? convertingSessions.reduce((s, j) => s + j.pages, 0) / convertingSessions.length
      : 0;
  const avgPagesNonConverting =
    nonConvertingSessions.length > 0
      ? nonConvertingSessions.reduce((s, j) => s + j.pages, 0) / nonConvertingSessions.length
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Session Journeys | TwinkVault Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b border-border/40 bg-card/30">
        <div className="container max-w-7xl flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <span className="font-heading text-lg font-bold heading-gradient">Session Journeys</span>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="rounded-button bg-muted/30 border border-border px-3 py-1.5 text-xs"
          >
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </header>

      <main className="container max-w-7xl py-8 space-y-8">

        {/* Headline metrics */}
        <section className="grid gap-4 sm:grid-cols-4">
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
            <p className="mt-2 font-heading text-2xl font-bold">{journeys.length.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Converting</p>
            <p className="mt-2 font-heading text-2xl font-bold">{convertingSessions.length.toLocaleString()}</p>
            <p className="mt-1 text-[11px] text-secondary">
              {journeys.length > 0 ? ((convertingSessions.length / journeys.length) * 100).toFixed(1) : "0.0"}% of sessions
            </p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg pages — convert</p>
            <p className="mt-2 font-heading text-2xl font-bold">{avgPagesConverting.toFixed(1)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">vs {avgPagesNonConverting.toFixed(1)} non-converting</p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Bounces</p>
            <p className="mt-2 font-heading text-2xl font-bold">{bouncePaths.length.toLocaleString()}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">single-page, no click</p>
          </div>
        </section>

        {/* Top journey paths */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Most common journey paths (top 20)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">First 3 view steps, plus destination if session converted</p>
            </div>
            {loading ? (
              <div className="px-6 pb-6 h-32 animate-pulse bg-muted/30 rounded" />
            ) : topPaths.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No sessions in this range.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Path</th>
                    <th className="px-4 py-2 font-medium text-right">Sessions</th>
                    <th className="px-4 py-2 font-medium text-right">Converted</th>
                    <th className="px-6 py-2 font-medium text-right">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {topPaths.map((p) => (
                    <tr key={p.path} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-6 py-2.5 font-mono text-[11px] break-all">{p.path}</td>
                      <td className="px-4 py-2.5 text-right">{p.count.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{p.converted.toLocaleString()}</td>
                      <td className="px-6 py-2.5 text-right text-secondary">
                        {p.count > 0 ? ((p.converted / p.count) * 100).toFixed(1) + "%" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Converting paths */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Conversion paths only</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Same data, filtered to sessions that ended in a click</p>
            </div>
            {convertingPaths.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No converting sessions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Path</th>
                    <th className="px-4 py-2 font-medium text-right">Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {convertingPaths.map((p) => (
                    <tr key={p.path} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-6 py-2.5 font-mono text-[11px] break-all">{p.path}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{p.converted.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Pre-click paths per destination */}
        <section>
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h3 className="font-heading text-lg font-semibold">Pages before each click destination</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Where readers came from immediately before converting</p>
            </div>
            {preClick.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Destination</th>
                    <th className="px-6 py-2 font-medium">Top preceding paths</th>
                  </tr>
                </thead>
                <tbody>
                  {preClick.map((row) => (
                    <tr key={row.destination} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-6 py-2.5 font-semibold align-top">
                        <Link to={`/admin/destination/${row.destination}`} className="hover:text-secondary">
                          {row.destination}
                        </Link>
                        <p className="text-[11px] text-muted-foreground font-normal">{row.totalClicks} clicks</p>
                      </td>
                      <td className="px-6 py-2.5">
                        <ul className="space-y-0.5">
                          {row.precedingPaths.map((pp) => (
                            <li key={pp.path} className="flex items-center justify-between gap-3">
                              <span className="font-mono text-[11px] truncate">{pp.path}</span>
                              <span className="text-[11px] font-semibold text-secondary shrink-0">{pp.count}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
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

export default AdminJourneys;
