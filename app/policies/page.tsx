import Link from "next/link";

export const metadata = { title: "Orders and store policies | Campus Crochet" };

export default function PoliciesPage() {
  return <main className="page-wrap policy-page">
    <span className="eyebrow">Before and after your order</span>
    <h1>Store information ♡</h1>
    <section id="orders"><h2>Orders & fulfillment</h2><p>Your account shows each verified paid order and its current fulfillment stage. Aditya Surampalem delivery is free. For home delivery in India, the charge is ₹69 when the cart subtotal is ₹499 or less, and free when it is above ₹499. Enter a complete address, state and matching PIN at checkout. The displayed total is final for that order. No delivery date is guaranteed here.</p><p>Please check your account regularly for progress, keep your registered email accessible and enable its notifications so you do not miss the confirmation and completion messages.</p></section>
    <section id="payments"><h2>Payment</h2><p>Online payments are processed by Razorpay in INR. Checkout shows the amount before you pay. If your payment appears to have gone through but your order is not visible, contact support with the payment reference before trying again.</p></section>
    <section id="cancellations"><h2>Cancellations</h2><p>Orders cannot be cancelled after payment.</p></section>
    <section id="returns"><h2>Returns & exchanges</h2><p>We do not offer voluntary returns or exchanges.</p></section>
    <section id="order-problems"><h2>Problems with an order</h2><p>If an item is damaged, incorrect, or different from its description, contact support with your order ID and photos. We will resolve the issue as required by applicable consumer law.</p></section>
    <section id="support"><h2>Support</h2><p>For order questions, payment issues and other website queries, write to <a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a> or visit our <Link href="/contact">contact page</Link>.</p></section>
  </main>;
}
