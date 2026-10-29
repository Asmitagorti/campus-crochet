"use client";
import { useEffect, useState } from "react";
import { stopAnalyticsAndDrain } from "./analytics-session";
import { googleAnalyticsChoiceEvent, googleAnalyticsChoiceKey, googleAnalyticsMeasurementId, parseGoogleAnalyticsChoice, type GoogleAnalyticsChoice } from "@/lib/google-analytics";

export default function AnalyticsOptOut() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [googleChoice, setGoogleChoice] = useState<GoogleAnalyticsChoice>("unset");
  const googleAvailable = Boolean(googleAnalyticsMeasurementId);
  useEffect(() => {
    try { setGoogleChoice(parseGoogleAnalyticsChoice(localStorage.getItem(googleAnalyticsChoiceKey))); }
    catch { setGoogleChoice("unset"); }
  }, []);
  const changeGoogleChoice = (choice: "accepted" | "declined") => {
    try { localStorage.setItem(googleAnalyticsChoiceKey, choice); } catch { /* Applies for this visit. */ }
    setGoogleChoice(choice);
    window.dispatchEvent(new Event(googleAnalyticsChoiceEvent));
  };
  return <div className="analytics-optout">
    {googleAvailable && <p>Google Analytics is {googleChoice === "declined" ? "off" : "on"} in this browser. <button className="text-link" type="button" onClick={() => {
      const next = googleChoice === "declined" ? "accepted" : "declined";
      changeGoogleChoice(next);
      if (next === "declined") window.location.reload();
    }}>{googleChoice === "declined" ? "Turn it on" : "Turn it off"}</button></p>}
    <button className="outline-button" type="button" disabled={done || busy} onClick={async () => {
      setBusy(true); setError("");
      try {
        const googleWasAllowed = googleChoice !== "declined";
        changeGoogleChoice("declined");
        await stopAnalyticsAndDrain();
        const response = await fetch("/api/analytics", { method: "DELETE" });
        if (!response.ok) throw Error("Could not update this preference. Please try again.");
        window.dispatchEvent(new Event("campus-analytics-optout"));
        setDone(true);
        if (googleWasAllowed) window.location.reload();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
      finally { setBusy(false); }
    }}>{done ? "Visitor tracking is off" : busy ? "Saving…" : "Stop first-party visitor counting and Google Analytics"}</button>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
