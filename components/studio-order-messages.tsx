"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { canMarkReceived } from "@/lib/order-progress";
import { composeManualEmail, type OrderEmailTemplate } from "@/lib/order-email";

type ManualKind = "shipping" | "received";
type Props = {
  order: {
    id: string; receipt: string; version: number; amount: number;
    status: string; fulfillment?: string; receivedAt?: string | null;
    customer: { name: string; email: string; deliveryAddress?: string };
    items: { name: string; quantity: number; price: number }[];
  };
  onUpdated: () => Promise<void>;
  onLocked: () => void;
};

export default function StudioOrderMessages({ order, onUpdated, onLocked }: Props) {
  const { token } = useAuth();
  const [kind, setKind] = useState<ManualKind | null>(null);
  const [template, setTemplate] = useState<OrderEmailTemplate | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!kind) { setTemplate(null); return; }
    let active = true;
    setLoading(true); setError(""); setNotice(""); setTemplate(null);
    (async () => {
      try {
        const response = await fetch(`/api/admin/email-template?kind=${kind}`, {
          headers: { Authorization: `Bearer ${await token()}` }, cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Could not load this email draft.");
        if (active) setTemplate(result.template);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this email draft.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [kind, token]);

  async function markReceived() {
    if (busy || !canMarkReceived(order.status, order.fulfillment, order.receivedAt)) return;
    if (!window.confirm("Have you confirmed that this parcel reached the customer? This updates tracking to Delivered. You will send the email yourself.")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "received", id: order.id, version: order.version }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (typeof result.error === "string" && result.error.includes("Enter your admin password")) onLocked();
        throw Error(result.error || "Could not mark this order received.");
      }
      await onUpdated();
      setNotice("Marked received. You can now prepare the after-delivery email.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not mark this order received.");
    } finally { setBusy(false); }
  }

  const message = kind && template ? composeManualEmail(kind, {
    id: order.receipt, registeredEmail: order.customer.email, name: order.customer.name,
    address: order.customer.deliveryAddress || "", items: order.items, totalPaise: order.amount,
  }, template, { courierName: courierName.trim(), trackingId: trackingId.trim() }) : null;
  const shippingReady = kind !== "shipping" || (!!courierName.trim() && !!trackingId.trim());

  async function copySubject() {
    if (!message) return;
    try { await navigator.clipboard.writeText(message.subject); setNotice("Subject copied. Paste it into your support mailbox."); setError(""); }
    catch { setError("Copy failed. Select and copy the subject below."); }
  }

  async function copyMessage() {
    if (!message || !shippingReady) return;
    try {
      if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([message.html], { type: "text/html" }),
          "text/plain": new Blob([message.text], { type: "text/plain" }),
        })]);
      } else await navigator.clipboard.writeText(message.text);
      setNotice("Message copied. Paste it into your support mailbox and send it yourself."); setError("");
    } catch { setError("Copy failed. Select and copy the message below."); }
  }

  const showShipping = order.fulfillment === "dispatched" || !!order.receivedAt;
  const showReceived = order.fulfillment === "collected" || !!order.receivedAt;
  return <div className="studio-order-messages">
    {canMarkReceived(order.status, order.fulfillment, order.receivedAt) &&
      <button type="button" className="outline-button" disabled={busy} onClick={() => void markReceived()}>
        {busy ? "Saving…" : "Mark parcel received"}
      </button>}
    {order.receivedAt && <p className="quiet-note">Delivery confirmed {new Date(order.receivedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}.</p>}
    {(showShipping || showReceived) && <div className="studio-email-actions">
      {showShipping && <button type="button" className="outline-button" onClick={() => setKind(kind === "shipping" ? null : "shipping")}>Prepare shipping email</button>}
      {showReceived && <button type="button" className="outline-button" onClick={() => setKind(kind === "received" ? null : "received")}>Prepare after-delivery email</button>}
    </div>}
    {kind && <div className="studio-manual-email">
      <p className="quiet-note">To: {order.customer.email} · Send this yourself from support@campus-crochet.tech. Edit the saved wording in the Emails tab.</p>
      {kind === "shipping" && <div className="form-columns">
        <label className="field">Courier name<input value={courierName} maxLength={80} onChange={(event) => setCourierName(event.target.value)} placeholder="India Post" /></label>
        <label className="field">Tracking ID<input value={trackingId} maxLength={80} onChange={(event) => setTrackingId(event.target.value)} placeholder="Enter the courier tracking ID" /></label>
      </div>}
      {loading ? <p>Preparing your draft…</p> : message && <>
        <label className="field">Subject<input readOnly value={message.subject} /></label>
        <button type="button" className="outline-button" onClick={() => void copySubject()}>Copy subject</button>
        <label className="field">Message<textarea readOnly rows={14} value={message.text} /></label>
        <button type="button" className="stitch-button" disabled={!shippingReady} onClick={() => void copyMessage()}>Copy email message</button>
        {kind === "shipping" && !shippingReady && <p className="quiet-note">Enter the courier and tracking ID before copying.</p>}
      </>}
    </div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
  </div>;
}
