import { Suspense } from "react";
import Checkout from "@/components/checkout-page";
export const metadata = {
  title: "A little closer to yours | Campus-Crochet",
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap empty-state">
          <h1>Getting your little bag ready…</h1>
        </main>
      }
    >
      <Checkout
        testMode={
          !process.env.RAZORPAY_KEY_ID ||
          process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_")
        }
      />
    </Suspense>
  );
}
