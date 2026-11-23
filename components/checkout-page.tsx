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
import ProductPrice from "./product-price";
import { indianStates } from "@/lib/indian-states";
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
  accountId?: string;
};
type Receipt = {
  id: string;
  receipt: string;
  amount: number;
  subtotalPaise: number;
  deliveryPaise: number;
  deliveryChoice: string;
  deliveryAddress: string;
  deliveryPin: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  status: string;
};
type DeliveryQuote = { subtotalPaise: number; deliveryPaise: number; totalPaise: number };
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
export default function Checkout({
  testMode,
  nonce,
}: {
  testMode: boolean;
  nonce?: string;
}) {
  const { cart, refreshPreferences, ready, catalog } = useShop(),
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
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [addressChoice, setAddressChoice] = useState<"Aditya Surampalem" | "Others">("Aditya Surampalem"),
    [addressLine1, setAddressLine1] = useState(""),
    [areaStreet, setAreaStreet] = useState(""),
    [city, setCity] = useState(""),
    [state, setState] = useState(""),
    [landmark, setLandmark] = useState(""),
    [deliveryPin, setDeliveryPin] = useState(""),
    [deliveryQuote, setDeliveryQuote] = useState<{ key: string; value: DeliveryQuote } | null>(null),
    [quoteError, setQuoteError] = useState(""),
    [quoting, setQuoting] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [scriptReady, setScriptReady] = useState(false),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [receiptOwner, setReceiptOwner] = useState<string | null>(null);
  const activeAttempt = user && attempt?.accountId === user.uid ? attempt : null;
  const activeReceipt = user && receiptOwner === user.uid ? receipt : null;
  const itemSignature = JSON.stringify(items.map((item) => [item.id, item.quantity, item.price]));
  const quoteKey = JSON.stringify([deliveryPin, state, city.trim(), itemSignature]);
  const liveQuote = addressChoice === "Others" && deliveryQuote?.key === quoteKey ? deliveryQuote.value : null;
  useEffect(() => {
    setName(user?.displayName || "");
    setPhone("");
    setAddressChoice("Aditya Surampalem");
    setAddressLine1(""); setAreaStreet(""); setCity(""); setState(""); setLandmark(""); setDeliveryPin("");
    if (!user) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/checkout/details", {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${await token()}` },
        });
        if (!response.ok) return;
        const { details } = await response.json();
        if (controller.signal.aborted || !details) return;
        setName(details.name || user.displayName || "");
        setPhone(details.phone || "");
        setAddressChoice(details.addressChoice === "Others" ? "Others" : "Aditya Surampalem");
        setAddressLine1(details.addressLine1 || ""); setAreaStreet(details.areaStreet || "");
        setCity(details.city || ""); setState(details.state || "");
        setLandmark(details.landmark || ""); setDeliveryPin(details.deliveryPin || "");
      } catch { /* Saved details are optional; checkout still works. */ }
    })();
    return () => controller.abort();
  }, [user?.uid, user?.displayName, token]);
  useEffect(() => {
    setDeliveryQuote(null);
    setQuoteError("");
    setQuoting(false);
    if (addressChoice !== "Others" || !user || !state || city.trim().length < 2 || !/^[1-9]\d{5}$/.test(deliveryPin) || !items.length) return;
    const controller = new AbortController();
    setQuoting(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/delivery/quote", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
          body: JSON.stringify({ deliveryPin, state, city: city.trim(), items: JSON.parse(itemSignature).map(([id, quantity]: [string, number, number]) => ({ id, quantity })) }),
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Delivery quote is unavailable.");
        if (result.subtotalPaise !== Math.round(total * 100)) throw Error("A product price changed. Refresh checkout before paying.");
        if (!controller.signal.aborted) setDeliveryQuote({ key: quoteKey, value: result as DeliveryQuote });
      } catch (cause) {
        if (!controller.signal.aborted) setQuoteError(cause instanceof Error ? cause.message : "Delivery quote is unavailable.");
      } finally { if (!controller.signal.aborted) setQuoting(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [addressChoice, deliveryPin, state, city, itemSignature, quoteKey, total, user?.uid, token]);
  const key = useRef("");
  const liveUserUid = useRef<string | null>(null);
  liveUserUid.current = user?.uid || null;
  useEffect(() => {
    setAttempt(null);
    setReceipt(null);
    setReceiptOwner(null);
    if (!user) return;
    key.current = crypto.randomUUID();
    try {
      const saved = sessionStorage.getItem("campus-payment");
      if (saved) {
        const previous = JSON.parse(saved) as Attempt;
        if (previous.accountId === user.uid) setAttempt(previous);
        else sessionStorage.removeItem("campus-payment");
      }
    } catch {}
  }, [user?.uid]);
  function remember(value: Attempt | null) {
    if (liveUserUid.current !== (user?.uid || null)) return;
    const ownedValue = value ? { ...value, accountId: user?.uid } : null;
    setAttempt(ownedValue);
    if (ownedValue) sessionStorage.setItem("campus-payment", JSON.stringify(ownedValue));
    else sessionStorage.removeItem("campus-payment");
  }
  async function readReceipt(value: Attempt) {
    const response = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ id: value.id, token: value.token }),
      }),
      data = await response.json();
    if (!response.ok) throw Error(data.error);
    if (data.status === "paid") {
      if (liveUserUid.current !== user?.uid) return false;
      setReceipt(data);
      setReceiptOwner(user?.uid || null);
      remember(null);
      if (!buy) await refreshPreferences();
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
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
    if (addressChoice === "Others" && !liveQuote) {
      setError("Enter a town, state and matching PIN, then wait for the total before paying.");
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      setError(
        "Secure checkout is still loading. Please try again in a moment.",
      );
      return;
    }
    if (activeAttempt) {
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
            saveDetails: fields.saveDetails === "on",
            expectedAmount: addressChoice === "Others" ? liveQuote!.totalPaise : Math.round(total * 100),
            directBuy: !!buy,
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
          email: user?.email || "",
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
  if (activeReceipt)
    return (
      <main className="page-wrap receipt-page">
        <div className="receipt-check">
          <Check />
        </div>
        <span className="eyebrow">
          {testMode
            ? "A successful test checkout"
            : "Your made-to-order piece is confirmed"}
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
            : "Your payment is confirmed. We will make your piece and dispatch it in 5–7 working days. Follow its progress in your account."}
        </p>
        <div className="receipt-paper">
          <span>Keep this little reference</span>
          <h2>{activeReceipt.receipt}</h2>
          {activeReceipt.items.map((i) => (
            <div className="receipt-item" key={i.id}>
              <span>
                {i.name} × {i.quantity}
              </span>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
          <div className="total-line"><span>Subtotal</span><strong>{money(activeReceipt.subtotalPaise / 100)}</strong></div>
          <div className="total-line"><span>Delivery</span><strong>{activeReceipt.deliveryPaise ? money(activeReceipt.deliveryPaise / 100) : "Free"}</strong></div>
          <div className="total-line">
            <strong>Paid total (INR)</strong>
            <strong>{money(activeReceipt.amount / 100)}</strong>
          </div>
          <p>Delivery location: {activeReceipt.deliveryChoice}{activeReceipt.deliveryAddress ? ` · ${activeReceipt.deliveryAddress}` : ""}{activeReceipt.deliveryPin ? ` · ${activeReceipt.deliveryPin}` : ""}. Check your account for progress.</p>
        </div>
        <div className="receipt-actions">
          <Link className="stitch-button" href="/account">
            Your orders <ArrowRight size={15} />
          </Link>
          <a className="outline-button" href={`mailto:support@campus-crochet.tech?subject=${encodeURIComponent(`Order ${activeReceipt.receipt}`)}`}>Ask support about this order</a>
        </div>
      </main>
    );
  return (
    <main className="page-wrap checkout-page">
      <Script
        nonce={nonce}
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setError(
            "Razorpay could not load. Check your connection and try again.",
          )
        }
      />
      <section className="page-heading">
        <span className="eyebrow">Final step</span>
        <h1>Secure checkout</h1>
        <p>Review your details and total before continuing to Razorpay.</p>
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
      {activeAttempt && (
        <section className="payment-recovery paper-form">
          <h2>A little payment to finish</h2>
          <p>
            Reference: {activeAttempt.id}. Check this payment before starting another.
          </p>
          {activeAttempt.payment ? (
            <button
              disabled={busy}
              className="stitch-button"
              onClick={() => void verify(activeAttempt, activeAttempt.payment!)}
            >
              Retry payment verification
            </button>
          ) : (
            <button
              className="stitch-button"
              disabled={busy}
              onClick={() => void cancel(activeAttempt)}
            >
              Check status / cancel attempt
            </button>
          )}
          <a href="mailto:support@campus-crochet.tech" className="text-link">Need a hand? Email support</a>
        </section>
      )}
      {!ready ? (
        <p className="loading-note">Getting your little bag ready…</p>
      ) : !items.length && !activeAttempt ? (
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
              <h2>Contact and delivery details</h2>
              {!user ? (
                <div className="checkout-signin">
                  <LockKeyhole />
                  <p>
                    Continue with Google to enter your details, save your address and track the order.
                  </p>
                  <button
                    className="google-button"
                    onClick={() => void login("/checkout")}
                  >
                    <span>G</span> Continue with Google
                  </button>
                  {authError && <p className="form-error">{authError}</p>}
                </div>
              ) : (
                <form onSubmit={pay}>
                  <p className="form-intro">Signed in as {user.email}. Your order confirmation will go to this address.</p>
                  <p className="quiet-note">Made to order · Free shipping · Dispatch in 5–7 working days after payment confirmation.</p>
                  <div className="field">
                    <label htmlFor="checkout-name">Full name *</label>
                    <input
                      id="checkout-name"
                      name="name"
                      required
                      minLength={2}
                      maxLength={80}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="checkout-email">Registered email address</label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={user.email || ""}
                      readOnly
                      autoComplete="email"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="checkout-phone">
                      Indian mobile number (+91) *
                    </label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      required
                      pattern="(?:[+]91[ -]?)?[6-9](?:[ -]?[0-9]){9}"
                      minLength={10}
                      maxLength={24}
                      placeholder="9876543210 or +91 9876543210"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                    <small>Use a 10-digit Indian mobile number starting with 6–9. You may include +91.</small>
                  </div>
                  <div className="field">
                    <label htmlFor="address-choice">Delivery option *</label>
                    <select id="address-choice" name="addressChoice" value={addressChoice} onChange={(e) => setAddressChoice(e.target.value as "Aditya Surampalem" | "Others")}>
                      <option value="Aditya Surampalem">Aditya Surampalem · Free</option>
                      <option value="Others">Home delivery · Free</option>
                    </select>
                  </div>
                  {addressChoice === "Others" && <>
                    <div className="field"><label htmlFor="address-line1">Flat or house number, building *</label>
                      <input id="address-line1" name="addressLine1" required minLength={3} maxLength={120} autoComplete="address-line1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Flat 2, Lotus Building" /></div>
                    <div className="field"><label htmlFor="area-street">Area, street *</label>
                      <input id="area-street" name="areaStreet" required minLength={3} maxLength={120} autoComplete="address-line2" value={areaStreet} onChange={(e) => setAreaStreet(e.target.value)} placeholder="South Street, Anna Nagar" /></div>
                    <div className="form-columns">
                      <div className="field"><label htmlFor="delivery-city">Town or city *</label>
                        <input id="delivery-city" name="city" required minLength={2} maxLength={80} autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} /></div>
                      <div className="field"><label htmlFor="delivery-state">State or union territory *</label>
                        <select id="delivery-state" name="state" required autoComplete="address-level1" value={state} onChange={(e) => setState(e.target.value)}>
                          <option value="">Select state</option>
                          {indianStates.map((item) => <option key={item} value={item}>{item.replace(/^THE /, "").toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase())}</option>)}
                        </select></div>
                    </div>
                    <div className="form-columns">
                      <div className="field"><label htmlFor="delivery-pin">Delivery PIN code *</label>
                        <input id="delivery-pin" name="deliveryPin" inputMode="numeric" autoComplete="postal-code" required pattern="[1-9][0-9]{5}" maxLength={6} value={deliveryPin} onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Six-digit PIN" />
                        {quoting && <small>Checking your PIN and total…</small>}
                        {quoteError && <small className="form-error" role="alert">{quoteError}</small>}
                      </div>
                      <div className="field"><label htmlFor="delivery-landmark">Landmark (optional)</label>
                        <input id="delivery-landmark" name="landmark" maxLength={120} value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near the park" /></div>
                    </div>
                  </>}
                  <div className="honeypot" aria-hidden="true">
                    <input
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-label="Website"
                    />
                  </div>
                  <p className="quiet-note">Orders cannot be cancelled after payment. We do not offer voluntary returns or exchanges. <Link href="/policies#cancellations">Read the store policy</Link>.</p>
                  <label className="consent">
                    <input name="consent" type="checkbox" required />
                    <span>
                      I have checked my order and agree to my details being used
                      to fulfil it. <Link href="/privacy">Privacy details</Link>
                    </span>
                  </label>
                  <label className="consent"><input name="saveDetails" type="checkbox" defaultChecked />
                    <span>Save my contact and delivery details for next time.</span></label>
                  <button
                    className="stitch-button full-button"
                    disabled={
                      busy ||
                      (addressChoice === "Others" && !liveQuote) ||
                      !scriptReady ||
                      !!activeAttempt ||
                      items.some((p) => p.quantity > maxQuantity(p))
                    }
                  >
                    {busy
                      ? "Opening secure checkout…"
                      : addressChoice === "Others" && !liveQuote ? "Enter a matching PIN to see total" : `Continue to Razorpay · ${money((addressChoice === "Others" ? liveQuote!.totalPaise : Math.round(total * 100)) / 100)}`}{" "}
                    <LockKeyhole size={16} />
                  </button>
                  <p className="quiet-note">
                    {testMode
                      ? "Test checkout · No real charges"
                      : "Your payment is completed securely by Razorpay. We do not receive your card or UPI details."}
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
                    {p.quantity > maxQuantity(p) && (
                      <span className="form-error">
                        Please update this quantity.
                      </span>
                    )}
                  </div>
                  <strong><ProductPrice product={p} quantity={p.quantity} showSavings={false} /></strong>
                </div>
              ))}
              <div className="total-line">
                <span>Subtotal</span>
                <strong>{money(total)}</strong>
              </div>
              <div className="total-line">
                <span>Delivery</span>
                <span>{addressChoice === "Others" && !liveQuote ? "Free · confirm PIN" : "Free"}</span>
              </div>
              <div className="total-line grand-total">
                <strong>Total (INR)</strong>
                <strong>{addressChoice === "Others" ? liveQuote ? money(liveQuote.totalPaise / 100) : "Pending delivery quote" : money(total)}</strong>
              </div>
              <div className="pickup-note">
                <MapPin size={20} />
                <p>
                  {addressChoice === "Others" ? "Shipping is free. Enter a town, state and matching Indian PIN before payment." : "Aditya Surampalem delivery is free."}
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
