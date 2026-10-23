import { Suspense } from "react";
import type { Metadata } from "next";
import Contact from "@/components/contact-page";
export const metadata: Metadata = {
  title: "A little hello | Campus-Crochet",
  description:
    "Ask about a crochet piece, your order or a custom idea. Call or WhatsApp +91 76749 71144.",
};
export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <h1>A little hello…</h1>
        </main>
      }
    >
      <Contact />
    </Suspense>
  );
}
