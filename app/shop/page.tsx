import { Suspense } from "react";
import type { Metadata } from "next";
import Shop from "@/components/shop-page";
import { redirect } from "next/navigation";
import { loadDisplayMode } from "@/lib/site-mode";
export const metadata: Metadata = {
  title: "Shop handmade little things | Campus-Crochet",
  description:
    "Discover crochet keepsakes, bags, coasters and flowers, handmade with care. Prices in Indian rupees.",
};
export const dynamic = "force-dynamic";
export default async function ShopPage() {
  if (await loadDisplayMode() === "poll") redirect("/vote");
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <h1>Finding your little favourites…</h1>
        </main>
      }
    >
      <Shop />
    </Suspense>
  );
}
