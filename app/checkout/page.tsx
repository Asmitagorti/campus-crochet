import { Suspense } from "react";
import { headers } from "next/headers";
import Checkout from "@/components/checkout-page";
export const metadata = {
  title: "A little closer to yours | Campus-Crochet",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage() {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <Suspense
      fallback={
        <main className="page-wrap empty-state">
          <h1>Getting your little bag ready…</h1>
        </main>
      }
    >
      <Checkout
        nonce={nonce}
        testMode={
          !process.env.RAZORPAY_KEY_ID ||
          process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_")
        }
      />
    </Suspense>
  );
}
