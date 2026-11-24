"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { adminFulfillmentChoices, adminFulfillmentSelection } from "@/lib/order-fulfillment-choices";
import { orderProgress } from "@/lib/order-progress";

type Props = {
  id: string;
  version: number;
  fulfillment: string | null | undefined;
  deliveryChoice: string | null | undefined;
  onSaved: () => Promise<void>;
  onLocked: () => void;
};

export default function StudioOrderFulfillment({ id, version, fulfillment, deliveryChoice, onSaved, onLocked }: Props) {
  const { token } = useAuth();
  const savedChoice = adminFulfillmentSelection(fulfillment);
  const [choice, setChoice] = useState(savedChoice);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setChoice(savedChoice); setError(""); }, [savedChoice, version]);

  async function save() {
    if (saving || !canSave) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "order", id, version, fulfillment: choice }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (typeof result.error === "string" && result.error.includes("Enter your admin password")) onLocked();
        throw Error(result.error || "Tracking could not be saved.");
      }
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tracking could not be saved. Please try again.");
    } finally { setSaving(false); }
  }

  const choices = adminFulfillmentChoices(deliveryChoice);
  const savedIndex = choices.findIndex((option) => option.value === savedChoice);
  const canSave = choice !== savedChoice || (choice === "completed" && fulfillment === "ready");
  return <div className="studio-order-fulfillment">
    <label className="field">
      Tracking stage
      <select value={choice} onChange={(event) => { setChoice(event.target.value); setError(""); }} disabled={saving}>
        {choices.map((option, index) => <option key={option.value} value={option.value}
          disabled={index < savedIndex || (index === 3 && fulfillment !== "completed")}>
          {option.label}
        </option>)}
      </select>
    </label>
    <p className="quiet-note">Saved stage: <strong>{orderProgress("paid", fulfillment).label}</strong>. Choose a stage, then save it.</p>
    <button type="button" className="outline-button" disabled={saving || !canSave} onClick={() => void save()}>
      {saving ? "Saving tracking…" : "Save tracking"}
    </button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
