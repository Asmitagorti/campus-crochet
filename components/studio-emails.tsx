"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "./auth-provider";
import {
  composeManualEmail, composeOrderEmail, defaultEmailTemplates,
  type EmailKind, type OrderEmailTemplate,
} from "@/lib/order-email";

const previewOrder = {
  id: "PREVIEW", registeredEmail: "customer@example.com", name: "Asha",
  address: "Sample delivery address",
  items: [{ name: "Crochet flower", quantity: 1, price: 399 }], totalPaise: 39900,
};

const editors: { kind: EmailKind; title: string; help: string }[] = [
  { kind: "confirmation", title: "1. Order confirmation", help: "Sent automatically after a verified payment. Saving affects future unsent confirmations." },
  { kind: "shipping", title: "2. Shipping update", help: "Prepare this when you ship an order. Copy it from the order card and send it yourself from your support mailbox." },
  { kind: "received", title: "3. After delivery", help: "Use this after you confirm the parcel arrived. Ask for a review and an Instagram tag, then send it yourself." },
];

function EmailEditor({ kind, title, help }: (typeof editors)[number]) {
  const { token } = useAuth();
  const [template, setTemplate] = useState<OrderEmailTemplate>(defaultEmailTemplates[kind]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/admin/email-template?kind=${kind}`, {
          headers: { Authorization: `Bearer ${await token()}` }, cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Could not load this email.");
        if (active) { setTemplate(result.template); setRevision(result.revision); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this email.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [kind, token]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/email-template", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ kind, template, revision }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not save this email.");
      setRevision(result.revision);
      setNotice(kind === "confirmation" ? "Saved for future automatic confirmations." : "Draft saved. You can use it from an order card.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this email.");
    } finally { setSaving(false); }
  }

  const preview = kind === "confirmation" ? composeOrderEmail(previewOrder, template)
    : composeManualEmail(kind, previewOrder, template, { courierName: "India Post", trackingId: "AB123456789IN" });
  return <section className="studio-email-editor">
    <form className="paper-form studio-editor" onSubmit={(event) => void save(event)}>
      <h3>{title}</h3>
      <p className="quiet-note">{help}</p>
      {loading ? <p>Opening this email…</p> : <>
        <div className="field"><label htmlFor={`email-${kind}-subject`}>Subject</label>
          <input id={`email-${kind}-subject`} required maxLength={160} value={template.subject}
            onChange={(event) => { setTemplate({ ...template, subject: event.target.value }); setNotice(""); }} /></div>
        <div className="field"><label htmlFor={`email-${kind}-body`}>Message</label>
          <textarea id={`email-${kind}-body`} required rows={kind === "confirmation" ? 22 : 18} maxLength={10000} value={template.body}
            onChange={(event) => { setTemplate({ ...template, body: event.target.value }); setNotice(""); }} /></div>
        <p className="quiet-note">Keep <code>{"{user_name}"}</code> and <code>{"{item_name}"}</code>. Item names appear in bold. {kind === "shipping" && <>Also keep <code>{"{courier_name}"}</code> and <code>{"{tracking_id}"}</code>.</>} Use <code>**words**</code> for other bold text.</p>
        {kind === "received" && <p className="quiet-note">Add your exact Instagram @username to this message when you have it.</p>}
        <div className="studio-email-actions">
          <button className="stitch-button" disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save email"}</button>
          <button type="button" className="outline-button" onClick={() => { setTemplate(defaultEmailTemplates[kind]); setNotice(""); }}>Restore suggested wording</button>
        </div>
      </>}
    </form>
    {!loading && <details className="paper-form studio-editor studio-email-preview" aria-label={`${title} preview`}>
      <summary>Preview as the customer</summary>
      <p><strong>Subject:</strong> {preview.subject}</p>
      <iframe title={`${title} preview`} sandbox="" srcDoc={preview.html} />
    </details>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
  </section>;
}

export default function StudioEmails() {
  return <section className="studio-email-section">
    <div className="studio-section-heading"><div><h2>Order emails</h2>
      <p>One automatic confirmation, then two messages you send yourself from support@campus-crochet.tech.</p></div></div>
    {editors.map((editor) => <EmailEditor key={editor.kind} {...editor} />)}
  </section>;
}
