"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "./auth-provider";
import {
  composeOrderEmail, defaultOrderEmailTemplate, manualShippingEmail, manualShippingEmailText,
  type OrderEmailTemplate,
} from "@/lib/order-email";

const previewOrder = {
  id: "PREVIEW",
  registeredEmail: "customer@example.com",
  name: "Asha",
  address: "Sample delivery address",
  items: [{ name: "Crochet flower", quantity: 1, price: 399 }],
  totalPaise: 39900,
};

export default function StudioEmails() {
  const { token } = useAuth();
  const [template, setTemplate] = useState<OrderEmailTemplate>(defaultOrderEmailTemplate);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/admin/email-template", {
          headers: { Authorization: `Bearer ${await token()}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Could not load the email template.");
        if (active) { setTemplate(result.template); setRevision(result.revision); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load the email template.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [token]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/email-template", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ template, revision }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not save the email template.");
      setRevision(result.revision);
      setNotice("Saved. Future unsent order confirmations will use this message.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the email template.");
    } finally { setSaving(false); }
  }

  async function copyShippingTemplate() {
    try {
      await navigator.clipboard.writeText(`${manualShippingEmail.subject}\n\n${manualShippingEmailText}`);
      setNotice("Shipping message copied. Replace the names, courier and tracking ID before sending it yourself.");
      setError("");
    } catch { setError("Copy failed. Select the text below and copy it manually."); }
  }

  const preview = composeOrderEmail(previewOrder, template);
  return (
    <section className="studio-email-section">
      <div className="studio-section-heading">
        <div>
          <h2>Order emails</h2>
          <p>One automatic confirmation after payment. Your shipping update stays manual.</p>
        </div>
      </div>
      {loading ? <p>Opening your email template…</p> : <>
        <form className="paper-form studio-editor" onSubmit={(event) => void save(event)}>
          <h3>Automatic order confirmation</h3>
          <p className="quiet-note">Saving here takes effect for future unsent confirmations. It does not wait for a shop publish.</p>
          <div className="field">
            <label htmlFor="order-email-subject">Subject</label>
            <input id="order-email-subject" required maxLength={160} value={template.subject}
              onChange={(event) => setTemplate({ ...template, subject: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="order-email-body">Message</label>
            <textarea id="order-email-body" required rows={22} maxLength={10000} value={template.body}
              onChange={(event) => setTemplate({ ...template, body: event.target.value })} />
          </div>
          <p className="quiet-note">Keep <code>{"{user_name}"}</code> and <code>{"{item_name}"}</code> in the message. Purchased item names are always bold in the delivered email. Use <code>**words**</code> to bold other words.</p>
          <div className="studio-email-actions">
            <button className="stitch-button" disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save email"}</button>
            <button type="button" className="outline-button" onClick={() => setTemplate(defaultOrderEmailTemplate)}>Restore suggested wording</button>
          </div>
        </form>
        <section className="paper-form studio-editor studio-email-preview" aria-label="Email preview">
          <h3>Preview as the customer</h3>
          <p><strong>Subject:</strong> {preview.subject}</p>
          <iframe title="Sample order confirmation email" sandbox="" srcDoc={preview.html} />
        </section>
        <section className="paper-form studio-editor">
          <h3>Your manual shipping email</h3>
          <p className="quiet-note">Copy this into your support mailbox after shipping. Replace the four placeholders before sending. The site will not send this message.</p>
          <div className="field"><label htmlFor="manual-email-subject">Subject</label>
            <input id="manual-email-subject" readOnly value={manualShippingEmail.subject} /></div>
          <div className="field"><label htmlFor="manual-email-body">Message</label>
            <textarea id="manual-email-body" readOnly rows={21} value={manualShippingEmailText} /></div>
          <button type="button" className="outline-button" onClick={() => void copyShippingTemplate()}>Copy subject and message</button>
        </section>
      </>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
    </section>
  );
}
