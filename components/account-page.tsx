"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { LogOut, ArrowRight, ShoppingBag, LockKeyhole } from "lucide-react";
import { money } from "@/lib/catalog";
import { orderProgress } from "@/lib/order-progress";
type AccountOrder = {
  id: string;
  amount: number;
  subtotalPaise: number;
  deliveryPaise: number;
  status: string;
  paymentStatus: string;
  fulfillment: string | null;
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
  customer?: { addressChoice: string | null; deliveryAddress: string | null; deliveryPin: string | null };
};
export default function Account() {
  const { user, ready, admin, error, login, logout, token } = useAuth(),
    [orders, setOrders] = useState<AccountOrder[]>([]),
    [ordersOwner, setOrdersOwner] = useState<string | null>(null),
    [loadError, setLoadError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersOwner(null);
      setLoadError("");
      setLoading(false);
      return;
    }
    let active = true;
    setOrders([]);
    setOrdersOwner(null);
    setLoading(true);
    const load = () => token()
      .then((t) =>
        fetch("/api/account/orders", {
          headers: { Authorization: `Bearer ${t}` },
        }),
      )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) { setOrders(d.orders); setOrdersOwner(user.uid); setLoadError(""); }
      })
      .catch(() => {
        if (active)
          setLoadError("Your orders could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    void load();
    const timer = setInterval(() => void load(), 30000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
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
            Choose your Google account to see your orders and favourites.
          </p>
          <button className="google-button" onClick={() => void login()}>
            <span>G</span> Continue with Google
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
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
              {admin && <Link href="/admin">Open admin dashboard →</Link>}
              <button className="account-signout" onClick={() => void logout()}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
          <p className="account-guidance">Check this page regularly for order progress. Keep your registered email accessible and enable notifications for the order confirmation and completion messages.</p>
          {error && <p className="form-error">{error}</p>}
          {loading || ordersOwner !== user.uid ? (
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
              {orders.map((o) => {
                const progress = orderProgress(o.paymentStatus, o.fulfillment);
                return <article className="order-history-card" key={o.id}>
                  <div>
                    <strong>{o.id}</strong>
                    <span className="status-pill">
                      {progress.label}
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
                      {i.name} × {i.quantity} · {money(i.price * i.quantity)}
                    </p>
                  ))}
                  {o.customer?.addressChoice && <p>Deliver to: {o.customer.addressChoice}{o.customer.deliveryAddress ? ` · ${o.customer.deliveryAddress}` : ""}{o.customer.deliveryPin ? ` · ${o.customer.deliveryPin}` : ""}</p>}
                  <p>Subtotal: {money(o.subtotalPaise / 100)} · Delivery: {o.deliveryPaise ? money(o.deliveryPaise / 100) : "Included"}</p>
                  <strong>Total: {money(o.amount / 100)}</strong>
                  {o.paymentStatus === "paid" && <ol className="order-progress" aria-label={`Order ${o.id} progress`}>
                    {["Confirmed", "Preparing", "Completed"].map((stage, index) => <li key={stage} className={progress.step >= index + 1 ? "done" : ""} aria-current={progress.step === index + 1 ? "step" : undefined}>{stage}</li>)}
                  </ol>}
                  <a href={`mailto:support@campus-crochet.tech?subject=${encodeURIComponent(`Order ${o.id}`)}`}>
                    Ask about this order →
                  </a>
                </article>;
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
