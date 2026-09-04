"use client";

import { useState } from "react";
import type { AuthUser } from "../types";
import { YarnBall, CrochetFlower } from "./YarnDecor";

interface Props {
  user: AuthUser | null;
  onClose: () => void;
  onRequireLogin: () => void;
}

type State = {
  name: string;
  itemName: string;
  occasion: string;
  colors: string;
  description: string;
  budget: string;
};

export default function CustomOrderModal({
  user,
  onClose,
  onRequireLogin,
}: Props) {
  const [form, setForm] = useState<State>({
    name: user?.name ?? "",
    itemName: "",
    occasion: "",
    colors: "",
    description: "",
    budget: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.itemName.trim()) {
      setError("Please tell us what you'd like.");
      return;
    }

    if (!user) {
      onRequireLogin();
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          item_name: form.itemName.trim(),
          occasion: form.occasion.trim() || undefined,
          colors: form.colors.trim() || undefined,
          description: form.description.trim() || undefined,
          budget: form.budget ? Number(form.budget) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Custom order insert error:", data);
        setError(
          data.error ||
            "Failed to submit. Please try again in a moment."
        );
        return;
      }

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error ? e.message : "Failed to submit the request.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(46,29,21,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFDF8",
          borderRadius: 24,
          padding: "2.25rem",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 64px rgba(46,29,21,0.2)",
          position: "relative",
          animation: "popIn 0.25s ease",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7A6058",
            fontSize: "1.25rem",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            position: "absolute",
            right: 32,
            top: 8,
            opacity: 0.12,
          }}
        >
          <YarnBall size={80} color="#D8A7A7" />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <CrochetFlower size={24} color="#C97B63" />
          <span
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#2E1D15",
            }}
          >
            Campus Crochet
          </span>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧶</div>
            <h2
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#2E1D15",
                marginBottom: "0.5rem",
              }}
            >
              Request received!
            </h2>
            <p
              style={{
                color: "#7A6058",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              The maker will review your custom request and get back to you with a price and timeline (3–5 working days). You can track the status from your dashboard 🌸
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
                backgroundColor: "#F7F3EC",
                borderRadius: 16,
                padding: "1rem",
                border: "1px solid #EDD4D4",
                marginBottom: "1.25rem",
              }}
            >
              <Detail label="Item" value={form.itemName} />
              {form.occasion && <Detail label="Occasion" value={form.occasion} />}
              {form.colors && <Detail label="Colors" value={form.colors} />}
              {form.budget && <Detail label="Budget" value={`₹${form.budget}`} />}
            </div>
            <button onClick={onClose} style={primaryBtn}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#2E1D15",
                marginBottom: "0.3rem",
              }}
            >
              Request a Custom Piece
            </h2>
            <p
              style={{
                color: "#7A6058",
                fontSize: "0.82rem",
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              Have something specific in mind? Fill in the details and the maker will reach out to discuss price and timeline.
            </p>

            {!user && (
              <div
                style={{
                  backgroundColor: "#FDF5EC",
                  borderRadius: 12,
                  padding: "0.75rem 1rem",
                  border: "1px solid #EDD4D4",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#7A6058", fontSize: "0.8rem" }}>
                  Sign in to submit and manage your request
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onRequireLogin();
                  }}
                  style={{
                    color: "#C97B63",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign in →
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <Field label="Your Name *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Your name"
                  style={inputSt}
                  onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
                  onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
                />
              </Field>

              <Field label="What would you like? *">
                <input
                  type="text"
                  value={form.itemName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, itemName: e.target.value }))
                  }
                  placeholder="e.g. Scrunchie with daisies, mini tote bag…"
                  style={inputSt}
                  onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
                  onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe the design, size, style — anything you have in mind"
                  rows={3}
                  style={{ ...inputSt, resize: "vertical" }}
                  onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
                  onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
                />
              </Field>

              <Field label="Occasion (optional)">
                <input
                  type="text"
                  value={form.occasion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, occasion: e.target.value }))
                  }
                  placeholder="e.g. Birthday gift, personal use…"
                  style={inputSt}
                  onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
                  onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
                />
              </Field>

              <Field label="Color preferences (optional)">
                <input
                  type="text"
                  value={form.colors}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, colors: e.target.value }))
                  }
                  placeholder="e.g. Pastel pink and cream, sage green…"
                  style={inputSt}
                  onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
                  onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
                />
              </Field>

              <Field label="Budget in ₹ (optional)">
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budget: e.target.value }))
                  }
                  placeholder="e.g. 300"
                  style={inputSt}
                  onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
                  onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
                />
              </Field>

              {error && (
                <div
                  style={{
                    backgroundColor: "#FDF0EC",
                    borderRadius: 10,
                    padding: "0.5rem 0.8rem",
                    border: "1px solid #EDD4D4",
                    fontSize: "0.78rem",
                    color: "#A86248",
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...primaryBtn,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Sending…" : "Send Request →"}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                color: "#B88080",
                fontSize: "0.72rem",
                marginTop: "1rem",
                fontFamily: "Caveat, cursive",
              }}
            >
              Only for Aditya students, Surampalem 🌸
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#2E1D15",
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "left" }}>
      <p style={{ fontSize: "0.68rem", color: "#7A6058", marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontWeight: 600, color: "#2E1D15", fontSize: "0.82rem" }}>
        {value}
      </p>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.9rem",
  borderRadius: 12,
  border: "1.5px solid #EDD4D4",
  backgroundColor: "#F7F3EC",
  color: "#2E1D15",
  fontSize: "0.88rem",
  outline: "none",
  fontFamily: "DM Sans, system-ui, sans-serif",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#C97B63",
  color: "#FFFDF8",
  fontWeight: 600,
  padding: "0.8rem",
  borderRadius: 50,
  border: "none",
  cursor: "pointer",
  fontSize: "0.92rem",
  boxShadow: "0 4px 14px rgba(201,123,99,0.28)",
  transition: "background-color 0.2s",
};