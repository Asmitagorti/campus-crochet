"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  ArrowRight,
  Heart,
  Check,
} from "lucide-react";
import { useShop } from "./site-shell";
import { Sprig } from "./design";
const topics = [
  "A product question",
  "My order",
  "A custom request",
  "Something else",
];
export default function Contact() {
  const { settings } = useShop();
  const params = useSearchParams(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState(""),
    [emailed, setEmailed] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = e.currentTarget,
      data = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(data),
          consent: data.get("consent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Your message could not be sent.");
      setReference(result.id);
      setEmailed(result.emailed === true);
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <section className="page-heading">
        <Sprig className="heading-sprig" />
        <span className="eyebrow">A little conversation goes a long way</span>
        <h1>
          We would love a little hello <span>♡</span>
        </h1>
        <p>A question, a little idea, or something you want to make special.</p>
      </section>
      <div className="page-wrap contact-layout">
        <section className="contact-intro">
          <span className="eyebrow">The person behind the stitches</span>
          <h2>
            Let's talk about
            <br />
            your little happy thing.
          </h2>
          <p>{settings.contactIntro}</p>
          <a className="contact-method" href="mailto:support@campus-crochet.tech">
            <Mail />
            <div>
              <strong>Customer support</strong>
              <span>support@campus-crochet.tech</span>
            </div>
            <ArrowRight size={17} />
          </a>
          <div className="small-paper-note">
            <Heart />
            <h3>Here to help ♡</h3>
            <p>For order questions, payment issues and other website queries, email support and include your order reference if you have one.</p>
          </div>
        </section>
        <section className="paper-form">
          {reference ? (
            <div className="form-success" role="status">
              <Check />
              <h2>Your hello is here ♡</h2>
              <p>{emailed ? "Your message has been emailed to support and saved for the studio." : "Your message was saved for the studio, but the email alert could not be sent. Please email support directly if you need a prompt reply."}</p>
              <span className="reference">{reference}</span>
              <p>Keep this reference for any follow-up.</p>
              <a className="stitch-button" href={`mailto:support@campus-crochet.tech?subject=${encodeURIComponent(`Support request ${reference}`)}`}>Email support <ArrowRight size={15} /></a>
              <button className="text-link" onClick={() => setReference("")}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2>Send a message</h2>
              <p className="form-intro">
                This form emails your message to <a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a> and saves a copy in the studio dashboard.
              </p>
              <div className="field">
                <label htmlFor="name">
                  Your name <span>*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="What should we call you?"
                />
              </div>
              <div className="field">
                <label htmlFor="email">
                  Email address <span>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="A place for our reply"
                />
              </div>
              <div className="field">
                <label htmlFor="topic">A little about</label>
                <select
                  id="topic"
                  name="topic"
                  defaultValue={
                    params.get("topic") === "custom"
                      ? "A custom request"
                      : "A product question"
                  }
                >
                  {topics.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="message">
                  Your message <span>*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={5}
                  defaultValue={
                    params.get("product")
                      ? `Hello! I have a question about ${params.get("product")}. `
                      : ""
                  }
                  placeholder="Tell us the little details…"
                />
              </div>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <label className="consent">
                <input type="checkbox" required name="consent" />{" "}
                <span>
                  I agree to my details being used to answer this message.{" "}
                  <Link href="/privacy">Privacy details</Link>
                </span>
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="stitch-button" disabled={busy}>
                {busy ? "Sending your little note…" : "Send a little hello"}{" "}
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </section>
      </div>
      <section className="page-wrap faq-section">
        <div className="section-title">
          <h2>A Few Little Answers ♡</h2>
          <p>In case you were wondering.</p>
        </div>
        {[
          {
            q: "Can I choose a different colour?",
            a: "Tell us the piece and shade you have in mind. We can customise some colours depending on yarn availability, and will confirm before you order.",
          },
          {
            q: "How will I get my order?",
            a: "Choose Aditya Surampalem for delivery included in the product price. For other addresses, enter your PIN at checkout to see whether delivery is available and the full charge before payment.",
          },
          {
            q: "Can I ask for exact measurements?",
            a: "Absolutely. Send us the product name and we will confirm measurements and details before you purchase, especially for bags and beanies.",
          },
          {
            q: "How should I look after crochet?",
            a: "Hand wash gently in cool water and let air dry flat. Do not wring, scrub or expose to direct heat. Keep paper gift cards dry.",
          },
          {
            q: "Something is wrong with my order. What do I do?",
            a: "Email support@campus-crochet.tech with your order reference and photographs of the issue. We will review the details with you and discuss the next step.",
          },
        ].map((x) => (
          <details key={x.q}>
            <summary>
              {x.q}
              <span>+</span>
            </summary>
            <p>{x.a}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
