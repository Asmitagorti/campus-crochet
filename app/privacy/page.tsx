import Link from "next/link";
import AnalyticsOptOut from "@/components/analytics-opt-out";

export const metadata = { title: "Privacy policy | Campus Crochet" };

export default function PrivacyPage() {
  return <main className="page-wrap policy-page">
    <span className="eyebrow">Your details</span>
    <h1>Privacy policy ♡</h1>
    <section><h2>Information we collect</h2><p>When you sign in and order, we receive your registered email, account identifier, name, mobile number, selected delivery location, any complete delivery address you enter, cart and favorites, order items, amounts, payment references and fulfillment status. If you contact us, we also receive the details in your message. We do not ask for card numbers or UPI credentials on this site.</p></section>
    <section><h2>Why we need it</h2><p>We use this information to identify your account, show your own cart and orders, process and track purchases, arrange fulfillment, send order confirmation and completion emails, and respond to support requests. The site does not use order information to send marketing messages.</p></section>
    <section><h2>Services involved</h2><p>Supabase handles account sign-in and stores site records, customer records and product images. Razorpay processes payments and provides payment status; payment credentials are entered in its checkout. Resend sends the two order lifecycle emails. Messages sent to <a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a> are handled in Zoho Mail. Each provider receives the information needed for its role.</p></section>
    <section><h2>On your device and in our records</h2><p>Your browser keeps the sign-in session and theme preference. The saved cart and favorites are linked to your account. A pending payment reference may remain in your browser session for recovery. Signing out clears personal information from the current view. Order and support records may be retained where needed to fulfill orders, resolve issues and meet applicable record-keeping obligations.</p></section>
    <section><h2>Visitor statistics</h2><p>We use a first-party random browser identifier to estimate visitors and visits by hour, day and week, and how long the site stays open in a visible, focused tab. The statistics contain no Google account ID, email address, IP address, or page path. Multiple people sharing a browser may count as one visitor; clearing cookies may count you again. Activity records are kept for up to 180 days. You can stop counting this browser and remove its existing activity record here. A one-way block marker remains so delayed requests cannot count the same browser again.</p><AnalyticsOptOut /></section>
    <section><h2>Questions and privacy concerns</h2><p>Email <a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a> to ask about your information or raise a privacy concern. Include enough detail to identify the relevant account or order. You can also visit our <Link href="/contact">contact page</Link>.</p></section>
  </main>;
}
