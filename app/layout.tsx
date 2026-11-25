import { loadProducts, loadSettings } from "@/lib/store-data";
import AuthProvider from "@/components/auth-provider";
import SiteShell from "@/components/site-shell";
import AnalyticsTracker from "@/components/analytics-tracker";
import GoogleAnalytics from "@/components/google-analytics";
import { googleAnalyticsMeasurementId } from "@/lib/google-analytics";
import { loadDisplayRuntime } from "@/lib/site-mode";
import type { Metadata } from "next";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "./globals.css";
import "./pages.css";
export const metadata: Metadata = {
  title: "Campus-Crochet | Tiny stitches, big smiles",
  description:
    "Thoughtful crochet keepsakes, handmade by a student with a decade of love for the craft. Explore little pieces of happiness.",
};
export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { mode: initialMode, saleEndsAt: initialSaleEndsAt } = await loadDisplayRuntime();
  const [initialProducts, initialSettings] = await Promise.all([
    loadProducts(),
    loadSettings(initialMode === "poll" ? "poll_settings" : "settings"),
  ]);
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AnalyticsTracker />
          <GoogleAnalytics measurementId={googleAnalyticsMeasurementId} />
          <SiteShell
            initialProducts={initialProducts}
            initialSettings={initialSettings}
            initialMode={initialMode}
            initialSaleEndsAt={initialSaleEndsAt}
            initialNow={Date.now()}
          >
            {children}
          </SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
