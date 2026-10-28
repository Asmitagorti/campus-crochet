"use client";
import { useEffect } from "react";
import { advanceActiveWindow, type ActiveWindow, isUuid } from "@/lib/analytics-domain";
import { analyticsStopped, trackAnalyticsRequest } from "./analytics-session";

const visitKey = "campus-analytics-visit";
function visitId() {
  const now = Date.now();
  try {
    const previous = JSON.parse(sessionStorage.getItem(visitKey) || "null");
    const id = isUuid(previous?.id) && Number.isFinite(previous?.lastAt) &&
      now - previous.lastAt < 30 * 60 * 1000 ? previous.id : crypto.randomUUID();
    sessionStorage.setItem(visitKey, JSON.stringify({ id, lastAt: now }));
    return id;
  } catch { return crypto.randomUUID(); }
}

export default function AnalyticsTracker() {
  useEffect(() => {
    let enabled = true;
    const focused = () => document.visibilityState === "visible" && document.hasFocus();
    let activeWindow: ActiveWindow = { at: performance.now(), active: focused(), milliseconds: 0 };
    const ping = (activeSeconds: number) => {
      if (!enabled || analyticsStopped()) return;
      const request = fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeSeconds, visitId: visitId() }), keepalive: true })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => { if (data?.recorded === false) enabled = false; });
      void trackAnalyticsRequest(request).catch(() => {});
    };
    const advance = () => { activeWindow = advanceActiveWindow(activeWindow, performance.now(), focused()); };
    const flush = () => {
      const seconds = Math.min(30, Math.floor(activeWindow.milliseconds / 1000));
      activeWindow = { ...activeWindow, milliseconds: 0 };
      if (seconds > 0) ping(seconds);
    };
    const changed = () => {
      const wasActive = activeWindow.active;
      advance();
      if (!activeWindow.active) flush();
      else if (!wasActive) ping(0);
    };
    if (activeWindow.active) ping(0);
    const timer = window.setInterval(() => { advance(); flush(); }, 30000);
    const onOptOut = () => { enabled = false; };
    document.addEventListener("visibilitychange", changed);
    window.addEventListener("blur", changed);
    window.addEventListener("focus", changed);
    window.addEventListener("campus-analytics-optout", onOptOut);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", changed);
      window.removeEventListener("blur", changed); window.removeEventListener("focus", changed);
      window.removeEventListener("campus-analytics-optout", onOptOut); };
  }, []);
  return null;
}
