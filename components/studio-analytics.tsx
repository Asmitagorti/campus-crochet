"use client";
import { useEffect, useState } from "react";

type Point = { period: string; visitors: number; activeMinutes: number };
type Summary = { todayVisitors: number; weekVisitors: number; todayActiveMinutes: number;
  hourly: Point[]; daily: Point[]; weekly: Point[] };

export default function StudioAnalytics({ token }: { token: () => Promise<string> }) {
  const [data, setData] = useState<Summary | null>(null);
  const [range, setRange] = useState<"hourly" | "daily" | "weekly">("daily");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/admin/analytics", { cache: "no-store", headers: { Authorization: `Bearer ${await token()}` } });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Statistics are unavailable.");
        if (active) { setData(result); setError(""); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Statistics are unavailable."); }
    }
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [token]);
  const points = data?.[range] || [];
  const maximum = Math.max(1, ...points.map((point) => point.visitors));
  return <section className="studio-analytics">
    <div className="studio-section-heading"><div><h2>Visitor statistics</h2><p>Approximate unique browsers and time in an active tab. Times use India Standard Time.</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!data && !error && <p>Loading statistics…</p>}
    {data && <>
      <div className="analytics-summary">
        <div><strong>{data.todayVisitors}</strong><span>Visitors today</span></div>
        <div><strong>{data.weekVisitors}</strong><span>Visitors this week</span></div>
        <div><strong>{data.todayActiveMinutes}</strong><span>Active tab minutes today</span></div>
      </div>
      <div className="paper-form studio-editor">
        <div className="editor-top"><div><h3>Visits over time</h3><p>Each bar shows distinct browser IDs for that period.</p></div>
          <div className="poll-round-picker">{(["hourly", "daily", "weekly"] as const).map((item) => <button key={item}
            type="button" className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
        <div className="analytics-chart">
          {points.map((point) => <div className="analytics-bar" key={point.period} title={`${point.period}: ${point.visitors} visitors, ${point.activeMinutes} active minutes`}>
            <strong>{point.visitors}</strong><i style={{ height: `${Math.max(5, point.visitors / maximum * 100)}%` }} />
            <span>{range === "hourly" ? point.period.slice(11, 16) : point.period.slice(5, 10)}</span>
          </div>)}
          {!points.length && <p>No visits have been recorded yet.</p>}
        </div>
        <p className="quiet-note">Active minutes are estimated from visible-tab heartbeats. One browser may represent several people; clearing cookies can count a returning visitor again.</p>
      </div>
    </>}
  </section>;
}
