"use client";
import { useState } from "react";
import { stopAnalyticsAndDrain } from "./analytics-session";

export default function AnalyticsOptOut() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="analytics-optout">
    <button className="outline-button" type="button" disabled={done || busy} onClick={async () => {
      setBusy(true); setError("");
      try {
        await stopAnalyticsAndDrain();
        const response = await fetch("/api/analytics", { method: "DELETE" });
        if (!response.ok) throw Error("Could not update this preference. Please try again.");
        window.dispatchEvent(new Event("campus-analytics-optout"));
        setDone(true);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
      finally { setBusy(false); }
    }}>{done ? "Visitor tracking is off" : busy ? "Saving…" : "Stop counting this browser"}</button>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
