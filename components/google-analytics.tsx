"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  googleAnalyticsChoiceEvent,
  googleAnalyticsChoiceKey,
  isTrackablePage,
  parseGoogleAnalyticsChoice,
  safePageLocation,
  shouldLoadGoogleAnalytics,
  type GoogleAnalyticsChoice,
} from "@/lib/google-analytics";

type GoogleTag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: GoogleTag }
}

let tagStarted = false;

function startGoogleAnalytics(measurementId: string) {
  if (tagStarted) {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    return;
  }
  tagStarted = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    page_location: safePageLocation(window.location.origin, window.location.pathname),
    page_referrer: "",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<GoogleAnalyticsChoice | "loading">("loading");

  useEffect(() => {
    const refresh = () => {
      try { setChoice(parseGoogleAnalyticsChoice(localStorage.getItem(googleAnalyticsChoiceKey))); }
      catch { setChoice("unset"); }
    };
    refresh();
    window.addEventListener(googleAnalyticsChoiceEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(googleAnalyticsChoiceEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (choice !== "loading" && shouldLoadGoogleAnalytics(choice) && pathname && isTrackablePage(pathname)) startGoogleAnalytics(measurementId);
    else if (tagStarted) window.gtag?.("consent", "update", { analytics_storage: "denied" });
  }, [choice, measurementId, pathname]);

  useEffect(() => {
    if (choice === "loading" || !shouldLoadGoogleAnalytics(choice) || !pathname || !isTrackablePage(pathname)) return;
    // Path only: never send OAuth fragments or query parameters to Google.
    window.gtag?.("set", { page_location: safePageLocation(window.location.origin, pathname), page_referrer: "" });
    window.gtag?.("event", "page_view", {
      page_location: safePageLocation(window.location.origin, pathname),
      page_path: pathname,
      page_title: document.title,
    });
  }, [choice, pathname]);

  return null;
}
