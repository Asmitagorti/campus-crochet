"use client";
import { useEffect } from "react";

export default function AnalyticsTracker() {
  useEffect(() => {
    let enabled = true;
    const ping = (activeSeconds: number) => {
      if (!enabled || document.visibilityState !== "visible" || !document.hasFocus()) return;
      void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeSeconds }), keepalive: true })
        .then((response) => { if (response.ok) return response.json(); return null; })
        .then((data) => { if (data?.recorded === false) enabled = false; }).catch(() => {});
    };
    ping(0);
    const timer = window.setInterval(() => ping(30), 30000);
    const onVisible = () => { if (document.visibilityState === "visible") ping(0); };
    const onOptOut = () => { enabled = false; };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("campus-analytics-optout", onOptOut);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("campus-analytics-optout", onOptOut); };
  }, []);
  return null;
}
