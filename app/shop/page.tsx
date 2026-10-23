import { Suspense } from "react";
import type { Metadata } from "next";
import Shop from "@/components/shop-page";
export const metadata: Metadata = {
  title: "Shop handmade little things | Campus-Crochet",
  description:
    "Discover crochet keepsakes, bags, coasters and flowers, handmade with care. Prices in Indian rupees.",
};
export default function ShopPage() {
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
