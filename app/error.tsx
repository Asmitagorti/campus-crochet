"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1 style={{ fontFamily: "Caveat, cursive", fontSize: 44 }}>
        A little tangled thread ♡
      </h1>
      <p style={{ margin: "20px auto", maxWidth: 450 }}>
        We could not load this little corner just now. Please try again in a
        moment.
      </p>
      <button className="stitch-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
