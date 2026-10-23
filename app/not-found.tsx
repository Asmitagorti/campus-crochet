import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-wrap empty-state missing-page">
      <span className="eyebrow">A little loose thread</span>
      <h1>This little thing wandered off ♡</h1>
      <p>We could not find that page. Let's find something lovely instead.</p>
      <Link href="/shop" className="stitch-button">
        Back to the collection →
      </Link>
    </main>
  );
}
