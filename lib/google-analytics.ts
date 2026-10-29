export type GoogleAnalyticsChoice = "accepted" | "declined" | "unset";

// A GA4 measurement ID is public in the browser. An environment value can replace
// this stream if the site moves to another Analytics property later.
export const googleAnalyticsMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-D06TJFNJWL";

export const googleAnalyticsChoiceKey = "campus-google-analytics-choice";
export const googleAnalyticsChoiceEvent = "campus-google-analytics-choice-changed";

export function parseGoogleAnalyticsChoice(value: string | null): GoogleAnalyticsChoice {
  return value === "accepted" || value === "declined" ? value : "unset";
}

export function shouldLoadGoogleAnalytics(choice: GoogleAnalyticsChoice): boolean {
  return choice !== "declined";
}

export function safePageLocation(origin: string, path: string): string {
  const url = new URL(path, origin);
  return `${origin}${url.pathname}`;
}

export function isTrackablePage(pathname: string): boolean {
  return !["/account", "/admin", "/checkout", "/orders"].some(
    (privatePath) => pathname === privatePath || pathname.startsWith(`${privatePath}/`),
  );
}
