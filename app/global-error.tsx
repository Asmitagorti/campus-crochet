"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#fbf0da",
          color: "#603b25",
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "80px 25px",
        }}
      >
        <h1>A little tangled thread</h1>
        <p>
          We could not reach the studio just now. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#87502c",
            color: "#fff8e9",
            border: 0,
            padding: "12px 25px",
            borderRadius: 25,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
