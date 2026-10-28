import Link from "next/link";

export const metadata = { title: "Orders and store policies | Campus Crochet" };

export default function PoliciesPage() {
  return <main className="page-wrap policy-page">
    <span className="eyebrow">Before and after your order</span>
    <h1>Store information ♡</h1>
    <section id="orders"><h2>Orders & fulfillment</h2><p>Your account shows each verified paid order and its current fulfillment stage. Aditya Surampalem delivery is included. For other locations, enter a complete address and PIN at checkout. We accept online payment only for supported PIN codes with a verified delivery quote. The combined delivery charge shown before payment includes India Post Parcel Retail postage and ₹15; the displayed total is final for that order. No delivery date is guaranteed here.</p><p>Please check your account regularly for progress, keep your registered email accessible and enable its notifications so you do not miss the confirmation and completion messages.</p></section>
    <section id="payments"><h2>Payment</h2><p>Online payments are processed by Razorpay in INR. Checkout shows the amount before you pay. If your payment appears to have gone through but your order is not visible, contact support with the payment reference before trying again.</p></section>
    <section id="cancellations"><h2>Cancellation</h2><p>To request a cancellation, email support with your order ID as soon as possible. We will review the payment and fulfillment stage and explain the available next step before making a change. Please ask about cancellation terms before placing an order if they affect your decision.</p></section>
    <section id="returns"><h2>Returns & exchanges</h2><p>If a piece arrives damaged or differs from your order, email support with your order ID and photos. We will review the case and discuss the available resolution. Terms for change of mind returns or exchanges have not been set, so contact us before ordering if you need that option.</p></section>
    <section id="support"><h2>Support</h2><p>For order questions, payment issues and other website queries, write to <a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a> or visit our <Link href="/contact">contact page</Link>.</p></section>
  </main>;
}
