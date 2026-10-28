import { Suspense } from "react";
import type { Metadata } from "next";
import Contact from "@/components/contact-page";
export const metadata: Metadata = {
  title: "A little hello | Campus-Crochet",
  description:
    "Ask about a crochet piece, an order, payment or a custom idea at support@campus-crochet.tech.",
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
