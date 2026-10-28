import Link from "next/link";

export const metadata = { title: "Crochet care guide | Campus Crochet" };

export default function CarePage() {
  return <main className="page-wrap policy-page">
    <span className="eyebrow">Keeping handmade pieces lovely</span>
    <h1>Crochet care guide ♡</h1>
    <section><h2>Wash gently</h2><p>Check the fibre-specific instructions supplied with your piece first. When washing is suitable, use cool or lukewarm water and a gentle detergent. Avoid harsh scrubbing, twisting or wringing.</p></section>
    <section><h2>Shape and dry</h2><p>Press out water gently with a towel, reshape the piece carefully and dry it flat when appropriate for its fibre and construction. Keep it away from excessive heat.</p></section>
    <section><h2>Unsure about a piece?</h2><p>Materials can vary by product. <a href="mailto:support@campus-crochet.tech">Email support</a> with the product name before washing if you need specific advice.</p></section>
    <Link href="/shop">Back to the collection</Link>
  </main>;
}
