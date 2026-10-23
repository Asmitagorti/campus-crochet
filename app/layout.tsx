import type { Metadata } from "next";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "./globals.css";
export const metadata: Metadata = { title: "Campus-Crochet | Tiny stitches, big smiles", description: "Thoughtful crochet keepsakes, handmade by a student with a decade of love for the craft. Explore little pieces of happiness." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body>{children}</body></html>; }

