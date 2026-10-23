"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  MapPin,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { useShop } from "./site-shell";
import { useAuth } from "./auth-provider";
import { money, maxQuantity } from "@/lib/catalog";
type PaymentResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type Attempt = {
  id: string;
  token: string;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  testMode: boolean;
  payment?: PaymentResult;
};
type Receipt = {
  id: string;
  amount: number;
  items: { id: string; name: string; quantity: number; price: number }[];
  status: string;
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  timeout: number;
  handler: (result: PaymentResult) => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (name: string, fn: () => void) => void;
    };
  }
}
export default function Checkout({ testMode }: { testMode: boolean }) {
  const { cart, setQuantity, ready, catalog, stocks } = useShop(),
    { user, login, token, error: authError } = useAuth(),
    params = useSearchParams(),
    buy = params.get("buy"),
    requested = Number(params.get("quantity") || 1);
  const direct = catalog.find((p) => p.id === buy);
  const items = direct
    ? [
        {
          ...direct,
          quantity: Math.min(
            maxQuantity(direct),
            Number.isInteger(requested) && requested > 0 ? requested : 1,
          ),
        },
      ]
    : catalog
        .filter((p) => cart[p.id] > 0)
        .map((p) => ({ ...p, quantity: cart[p.id] }));
  const total = items.reduce((s, p) => s + p.price * p.quantity, 0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [scriptReady, setScriptReady] = useState(false),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [receipt, setReceipt] = useState<Receipt | null>(null);
  const key = useRef(""),
    purchased = useRef(items.map((p) => ({ id: p.id, quantity: p.quantity })));
  useEffect(() => {
    key.current = crypto.randomUUID();
    try {
      const saved = sessionStorage.getItem("campus-payment");
      if (saved) setAttempt(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    purchased.current = items.map((p) => ({ id: p.id, quantity: p.quantity }));
  }, [items]);
  function remember(value: Attempt | null) {
    setAttempt(value);
    if (value) sessionStorage.setItem("campus-payment", JSON.stringify(value));
    else sessionStorage.removeItem("campus-payment");
  }
  async function readReceipt(value: Attempt) {
    const response = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: value.id, token: value.token }),
      }),
      data = await response.json();
    if (!response.ok) throw Error(data.error);
    if (data.status === "paid") {
      setReceipt(data);
      remember(null);
      if (!buy)
        for (const item of purchased.current)
          setQuantity(
            item.id,
            Math.max(0, (cart[item.id] || 0) - item.quantity),
          );
      return true;
    }
    return false;
  }
  async function verify(value: Attempt, result: PaymentResult) {
    setBusy(true);
    const recovery = { ...value, payment: result };
    remember(recovery);
    try {
      const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: value.id, token: value.token, ...result }),
        }),
        data = await response.json();
      if (!response.ok) throw Error(data.error);
      await readReceipt(value);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Payment verification is taking a little longer. Your reference is saved; please retry verification.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function cancel(value: Attempt) {
    setBusy(true);
    try {
      const response = await fetch("/api/payments/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: value.id, token: value.token }),
        }),
        data = await response.json();
      if (!response.ok) throw Error(data.error);
      if (data.status === "paid") await readReceipt(value);
      else if (data.status === "cancelled") {
        remember(null);
        key.current = crypto.randomUUID();
        setError("Payment was cancelled. Your bag is safe; you can try again.");
      } else
        setError(
          "Your payment is still processing. Please check its status before trying again.",
        );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We could not check this attempt. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function pay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!scriptReady || !window.Razorpay) {
      setError(
        "Secure checkout is still loading. Please try again in a moment.",
      );
      return;
    }
    if (attempt) {
      setError(
        "Please finish or cancel the saved payment attempt below first.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": key.current,
            Authorization: `Bearer ${await token()}`,
          },
          body: JSON.stringify({
            ...fields,
            consent: fields.consent === "on",
            expectedAmount: total * 100,
            items: items.map((p) => ({ id: p.id, quantity: p.quantity })),
          }),
        }),
        data = await response.json();
      if (!response.ok) throw Error(data.error);
      const value = data as Attempt;
      remember(value);
      if (data.paid) {
        await readReceipt(value);
        setBusy(false);
        return;
      }
      const checkout = new window.Razorpay({
        key: value.key,
        amount: value.amount,
        currency: "INR",
        order_id: value.orderId,
        name: "Campus-Crochet",
        description: `Your handmade little things · ${value.id}`,
        prefill: {
          name: String(fields.name),
          email: String(fields.email),
          contact: String(fields.phone),
        },
        theme: { color: "#87502c" },
        timeout: 900,
        handler: (result) => void verify(value, result),
        modal: { ondismiss: () => void cancel(value) },
      });
      checkout.on("payment.failed", () =>
        setError(
          "That payment did not go through. You can retry in Razorpay or close it and try again.",
        ),
      );
      checkout.open();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your payment could not start. Please try again.",
      );
      key.current = crypto.randomUUID();
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <main className="page-wrap receipt-page">
        <div className="receipt-check">
          <Check />
        </div>
        <span className="eyebrow">
          {testMode
            ? "A successful test checkout"
            : "Your little happiness is on its way"}
        </span>
        <h1>
          {testMode
            ? "Test payment confirmed"
            : "Thank you for choosing handmade"}{" "}
          ♡
        </h1>
        <p>
          {testMode
            ? "No real money was charged. This order is recorded in the test shop."
            : "Your payment is confirmed. We will coordinate campus pickup with you."}
        </p>
        <div className="receipt-paper">
          <span>Keep this little reference</span>
          <h2>{receipt.id}</h2>
          {receipt.items.map((i) => (
            <div className="receipt-item" key={i.id}>
              <span>
                {i.name} × {i.quantity}
              </span>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
          <div className="total-line">
            <strong>Paid total (INR)</strong>
            <strong>{money(receipt.amount / 100)}</strong>
          </div>
          <p>Campus pickup · We will arrange the handover with you.</p>
        </div>
        <div className="receipt-actions">
          <Link className="stitch-button" href="/account">
            Your orders <ArrowRight size={15} />
          </Link>
          <a
            className="outline-button"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://wa.me/917674971144?text=${encodeURIComponent(`Hello! My Campus-Crochet order is ${receipt.id}. Can we arrange campus pickup?`)}`}
          >
            Arrange pickup on WhatsApp
          </a>
        </div>
      </main>
    );
  return (
    <main className="page-wrap checkout-page">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setError(
            "Razorpay could not load. Check your connection and try again.",
          )
        }
      />
      <section className="page-heading">
        <span className="eyebrow">A little closer to yours</span>
        <h1>
          A bag full of happy things <span>♡</span>
        </h1>
        <p>One thoughtful choice. A whole lot of handmade love.</p>
      </section>
      {testMode && (
        <div className="test-mode-banner">
          <ShieldCheck size={18} />
          <div>
            <strong>Razorpay test mode</strong>
            <span>
              No real money is charged. Use Razorpay test payment details.
            </span>
          </div>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {attempt && (
        <section className="payment-recovery paper-form">
          <h2>A little payment to finish</h2>
          <p>
            Reference: {attempt.id}. Check this payment before starting another.
          </p>
          {attempt.payment ? (
            <button
              disabled={busy}
              className="stitch-button"
              onClick={() => void verify(attempt, attempt.payment!)}
            >
              Retry payment verification
            </button>
          ) : (
            <button
              className="stitch-button"
              disabled={busy}
              onClick={() => void cancel(attempt)}
            >
              Check status / cancel attempt
            </button>
          )}
          <a href="tel:+917674971144" className="text-link">
            Need a hand? Call the studio
          </a>
        </section>
      )}
      {!ready ? (
        <p className="loading-note">Getting your little bag ready…</p>
      ) : !items.length && !attempt ? (
        <div className="empty-state">
          <ShoppingBag />
          <h2>Your little bag is waiting.</h2>
          <p>Choose something lovely before checking out.</p>
          <Link className="stitch-button" href="/shop">
            Explore the collection <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        items.length > 0 && (
          <div className="checkout-layout">
            <section className="paper-form">
              <h2>A little about you</h2>
              {!user ? (
                <div className="checkout-signin">
                  <LockKeyhole />
                  <p>
                    Sign in with Google to securely place your order and keep it
                    in your own little corner.
                  </p>
                  <button
                    className="google-button"
                    onClick={() => void login()}
                  >
                    <span>G</span> Continue with Google
                  </button>
                  {authError && <p className="form-error">{authError}</p>}
                </div>
              ) : (
                <form onSubmit={pay}>
                  <p className="form-intro">Signed in as {user.email}</p>
                  <div className="field">
                    <label htmlFor="checkout-name">Your name *</label>
                    <input
                      id="checkout-name"
                      name="name"
                      required
                      minLength={2}
                      maxLength={80}
                      defaultValue={user.displayName || ""}
                      autoComplete="name"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="checkout-email">Email address *</label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      required
                      defaultValue={user.email || ""}
                      autoComplete="email"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="checkout-phone">
                      Mobile / WhatsApp number *
                    </label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      required
                      pattern="(?:\+?91[ -]?)?[6-9][0-9]{9}"
                      placeholder="Your 10-digit mobile number"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="pickup">Campus & pickup details *</label>
                    <input
                      id="pickup"
                      name="pickup"
                      required
                      minLength={3}
                      maxLength={200}
                      placeholder="Campus, department or preferred meeting point"
                    />
                    <small>
                      We will confirm a time and meeting point with you.
                    </small>
                  </div>
                  <div className="field">
                    <label htmlFor="order-note">A little note (optional)</label>
                    <textarea
                      id="order-note"
                      name="note"
                      rows={3}
                      maxLength={1500}
                      placeholder="A gift message, a question, or anything we should know"
                    />
                  </div>
                  <div className="honeypot" aria-hidden="true">
                    <input
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-label="Website"
                    />
                  </div>
                  <label className="consent">
                    <input name="consent" type="checkbox" required />
                    <span>
                      I have checked my order and agree to my details being used
                      to fulfil it. <Link href="/privacy">Privacy details</Link>
                    </span>
                  </label>
                  <button
                    className="stitch-button full-button"
                    disabled={
                      busy ||
                      !scriptReady ||
                      !!attempt ||
                      items.some(
                        (p) => (stocks[p.id] ?? p.stock ?? 0) < p.quantity,
                      )
                    }
                  >
                    {busy
                      ? "Opening secure checkout…"
                      : `Pay ${money(total)} with Razorpay`}{" "}
                    <LockKeyhole size={16} />
                  </button>
                  <p className="quiet-note">
                    {testMode
                      ? "Test checkout · No real charges"
                      : "Secure payment handled by Razorpay"}{" "}
                    · INR
                  </p>
                </form>
              )}
            </section>
            <aside className="checkout-summary">
              <h2>Your little collection</h2>
              {items.map((p) => (
                <div className="checkout-item" key={p.id}>
                  <Link href={`/products/${p.id}`}>
                    <img src={p.gallery[0]} alt={p.name} />
                  </Link>
                  <div>
                    <Link href={`/products/${p.id}`}>{p.name}</Link>
                    <p>Quantity {p.quantity}</p>
                    {(stocks[p.id] ?? p.stock ?? 0) < p.quantity && (
                      <span className="form-error">
                        Please update this quantity.
                      </span>
                    )}
                  </div>
                  <strong>{money(p.price * p.quantity)}</strong>
                </div>
              ))}
              <div className="total-line">
                <span>Subtotal</span>
                <strong>{money(total)}</strong>
              </div>
              <div className="total-line">
                <span>Campus pickup</span>
                <span>Included</span>
              </div>
              <div className="total-line grand-total">
                <strong>Total (INR)</strong>
                <strong>{money(total)}</strong>
              </div>
              <div className="pickup-note">
                <MapPin size={20} />
                <p>
                  Starting close to home.
                  <br />
                  Campus pickup, thoughtfully arranged.
                </p>
              </div>
              <Link className="text-link" href="/shop">
                A little more browsing <ArrowRight size={13} />
              </Link>
            </aside>
          </div>
        )
      )}
    </main>
  );
}
