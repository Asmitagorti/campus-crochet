"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { LogOut, ArrowRight, ShoppingBag, LockKeyhole } from "lucide-react";
import { money } from "@/lib/catalog";
type AccountOrder = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  items: { name: string; quantity: number }[];
};
export default function Account() {
  const { user, ready, admin, error, login, logout, token } = useAuth(),
    [orders, setOrders] = useState<AccountOrder[]>([]),
    [loadError, setLoadError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    token()
      .then((t) =>
        fetch("/api/account/orders", {
          headers: { Authorization: `Bearer ${t}` },
        }),
      )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) setOrders(d.orders);
      })
      .catch(() => {
        if (active)
          setLoadError("Your orders could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, token]);
  return (
    <main className="page-wrap account-page">
      <section className="page-heading">
        <span className="eyebrow">Your own little corner</span>
        <h1>
          {user
            ? `Hello, ${user.displayName?.split(" ")[0] || "lovely"}`
            : "A little hello, just for you"}{" "}
          ♡
        </h1>
        <p>
          {user
            ? "Your orders, your favourites, and the things you love."
            : "Sign in with Google to keep your orders close."}
        </p>
      </section>
      {!ready ? (
        <p className="loading-note">Getting your little corner ready…</p>
      ) : !user ? (
        <div className="account-signin paper-form">
          <LockKeyhole />
          <h2>Make yourself at home.</h2>
          <p>
            Use your Google account to checkout and see your orders. No new
            password to remember.
          </p>
          <button className="google-button" onClick={() => void login()}>
            <span>G</span> Continue with Google
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="quiet-note">
            Your sign-in is securely handled by Google and Firebase.
          </p>
          <Link className="text-link" href="/shop">
            A little browsing first <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <div className="account-toolbar">
            <p>{user.email}</p>
            <div>
              <Link href="/shop?saved=1">Your favourites ♡</Link>
              {admin && <Link href="/studio">Open studio →</Link>}
              <button onClick={() => void logout()}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          {loading ? (
            <p className="loading-note">Finding your little orders…</p>
          ) : loadError ? (
            <p role="alert" className="form-error">
              {loadError}
            </p>
          ) : !orders.length ? (
            <div className="empty-state">
              <ShoppingBag />
              <h2>Your story starts with a little thing.</h2>
              <p>Your orders will appear here after checkout.</p>
              <Link className="stitch-button" href="/shop">
                Find your first favourite <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="account-orders">
              {orders.map((o) => (
                <article className="order-history-card" key={o.id}>
                  <div>
                    <strong>{o.id}</strong>
                    <span className="status-pill">
                      {o.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p>
                    {new Date(o.created_at).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {o.items.map((i) => (
                    <p key={i.name}>
                      {i.name} × {i.quantity}
                    </p>
                  ))}
                  <strong>{money(o.amount / 100)}</strong>
                  <a
                    href={`https://wa.me/917674971144?text=${encodeURIComponent(`Hello, a question about my Campus-Crochet order ${o.id}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ask about this order →
                  </a>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
