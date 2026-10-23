import type React from "react";
export function Yarn({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="34" cy="33" r="24" />
      <path
        d="M14 18c28 0 42 20 40 32M11 27c22-4 37 11 40 27M11 37c16-4 27 4 34 19M18 12c-3 19 7 34 25 44M28 9c-8 20-3 37 7 48M39 10c-17 12-23 29-19 43M49 16c-20 7-31 17-36 29M55 27C34 26 21 35 16 47M51 54c14 6 17-4 11-8M10 57L63 8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 160"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M47 154C40 111 61 74 50 11"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M48 129C16 126 7 103 14 90c25 0 35 16 34 39ZM48 106c30-4 46-23 40-39-23 1-37 16-40 39ZM51 78C21 75 16 55 22 42c20 4 31 17 29 36ZM52 54C73 49 85 29 77 16 57 23 49 39 52 54ZM50 31C33 21 32 8 39 2c14 6 17 17 11 29Z"
        fill="currentColor"
        opacity=".8"
      />
      <path
        d="M46 124L18 96m33 3 29-25M49 70 26 47m28-1 20-24"
        stroke="var(--paper)"
        strokeWidth="1"
        opacity=".55"
      />
    </svg>
  );
}
export function Title({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="section-title">
      <h2>
        <span>♡</span> {children} <span>♡</span>
      </h2>
      <p>{sub}</p>
    </div>
  );
}
