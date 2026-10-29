"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { Product, categories, money } from "@/lib/catalog";
import { JournalEntry } from "@/lib/journal";
import { defaultSettings, SiteSettings } from "@/lib/site-settings";
import { orderProgress } from "@/lib/order-progress";
import StudioPolls, { type AdminPoll } from "./studio-polls";
import StudioAnalytics from "./studio-analytics";
import {
  Plus,
  Upload,
  Save,
  RefreshCw,
  LockKeyhole,
  ArrowRight,
  Package,
  ShoppingBag,
  MessageCircle,
  BookOpen,
  Settings,
  Check,
  Heart,
} from "lucide-react";
type AdminProduct = Product & { active: boolean; revision: number };
type StudioOrder = {
  mode?: string;
  id: string;
  receipt: string;
  version: number;
  amount: number;
  subtotalPaise: number;
  deliveryPaise: number;
  postagePaise: number;
  status: string;
  fulfillment?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    addressChoice?: string;
    deliveryAddress?: string;
    deliveryPin?: string;
    pickup?: string;
    note?: string;
  };
  items: { name: string; quantity: number; price: number }[];
  created_at: string;
};
type DeliveryRate = { destination_pin: string; max_weight_grams: number; postage_paise: number; active: boolean; verified_at: string };
type Message = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
};
type Chapter = JournalEntry & { published: boolean; revision: number };
type StudioData = {
  products: AdminProduct[];
  siteMode: "shop" | "poll";
  activePollId: string | null;
  polls: AdminPoll[];
  deliveryRates: DeliveryRate[];
  orders: StudioOrder[];
  messages: Message[];
  journey: Chapter[];
  settings: SiteSettings & { revision: number };
};
const blank: AdminProduct = {
  id: "",
  name: "",
  note: "",
  category: "Accessories",
  price: 299,
  stock: 25,
  packedWeightGrams: null,
  description: "",
  details: [["Includes", "One handmade crochet piece"]],
  colors: ["#e9b7cc"],
  gallery: [],
  madeToOrder: false,
  active: false,
  revision: 0,
};
export default function Studio() {
  const { user, ready, admin, login, token, error: authError } = useAuth(),
    [access, setAccess] = useState<{ configured: boolean; unlocked: boolean } | null>(null),
    [accessError, setAccessError] = useState(""),
    [accessBusy, setAccessBusy] = useState(false),
    [portalPassword, setPortalPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [data, setData] = useState<StudioData | null>(null),
    [tab, setTab] = useState("orders"),
    [orderSearch, setOrderSearch] = useState(""),
    [orderDate, setOrderDate] = useState(""),
    [paymentFilter, setPaymentFilter] = useState("all"),
    [fulfillmentFilter, setFulfillmentFilter] = useState("all"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<AdminProduct | null>(null),
    [rate, setRate] = useState<{ pin: string; grams: string; rupees: string; active: boolean; existing: boolean }>({ pin: "", grams: "", rupees: "", active: true, existing: false }),
    [rateVerified, setRateVerified] = useState(false),
    [rateEditorOpen, setRateEditorOpen] = useState(false),
    [isNew, setIsNew] = useState(false),
    [chapter, setChapter] = useState<Chapter | null>(null),
    [settings, setSettings] = useState<SiteSettings & { revision: number }>({
      ...defaultSettings,
      revision: 0,
    });
  const load = useCallback(async () => {
    try {
      setError("");
      const r = await fetch("/api/admin", {
          headers: { Authorization: `Bearer ${await token()}` },
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
      setSettings(d.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the studio.");
    }
  }, [token]);
  const checkAccess = useCallback(async () => {
    setAccessError("");
    try {
      const response = await fetch("/api/admin/access", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not check admin access.");
      setAccess({ configured: result.configured === true, unlocked: result.unlocked === true });
    } catch (cause) {
      setAccessError(cause instanceof Error ? cause.message : "Could not check admin access.");
    }
  }, [token]);
  useEffect(() => {
    if (admin) void checkAccess();
    else { setAccess(null); setData(null); }
  }, [admin, checkAccess]);
  useEffect(() => {
    if (admin && access?.unlocked) void load();
  }, [admin, access?.unlocked, load]);
  async function submitAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!access) return;
    if (!access.configured && portalPassword !== confirmPassword) {
      setAccessError("The passwords do not match.");
      return;
    }
    setAccessBusy(true);
    setAccessError("");
    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: access.configured ? "unlock" : "setup", password: portalPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Admin access was not unlocked.");
      setPortalPassword("");
      setConfirmPassword("");
      setAccess({ configured: true, unlocked: true });
    } catch (cause) {
      setAccessError(cause instanceof Error ? cause.message : "Admin access was not unlocked.");
    } finally {
      setAccessBusy(false);
    }
  }
  async function save(url: string, body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await token()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error || "Could not save.");
      setNotice("Saved with a little care.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File, onDone: (url: string) => void) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${await token()}` },
          body: form,
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      onDone(d.url);
      setNotice("Photo uploaded to Supabase Storage.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <main className="page-wrap empty-state">
        <h1>Opening the studio…</h1>
      </main>
    );
  if (!user || !admin)
    return (
      <main className="page-wrap empty-state missing-page">
        <LockKeyhole />
        <h1>A little private studio</h1>
        <p>This space is reserved for the studio administrator.</p>
        {!user ? (
          <button className="google-button" onClick={() => void login("/admin")}>
            Continue with Google
          </button>
        ) : (
          <Link className="stitch-button" href="/account">
            Back to your account <ArrowRight size={15} />
          </Link>
        )}
        {authError && <p className="form-error">{authError}</p>}
      </main>
    );
  if (!access || !access.unlocked)
    return (
      <main className="page-wrap empty-state missing-page admin-access-page">
        <LockKeyhole />
        <h1>{access?.configured ? "Unlock the studio" : "Set your studio password"}</h1>
        {access ? (
          <form className="admin-access-form" onSubmit={(event) => void submitAccess(event)}>
            <p>{access.configured ? "Enter your separate admin password to open the dashboard." :
              "Choose a private password with at least 16 characters. You will use it after Google sign-in."}</p>
            <div className="field">
              <label htmlFor="admin-password">Admin password</label>
              <input id="admin-password" type="password" autoComplete={access.configured ? "current-password" : "new-password"}
                minLength={access.configured ? undefined : 16} maxLength={128} required
                value={portalPassword} onChange={(event) => setPortalPassword(event.target.value)} />
            </div>
            {!access.configured && <div className="field">
              <label htmlFor="admin-password-confirm">Confirm admin password</label>
              <input id="admin-password-confirm" type="password" autoComplete="new-password" minLength={16} maxLength={128} required
                value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>}
            <button className="stitch-button" type="submit" disabled={accessBusy}>
              {accessBusy ? "Checking…" : access.configured ? "Open admin dashboard" : "Set password and continue"}
            </button>
          </form>
        ) : !accessError ? <p>Checking studio access…</p> : null}
        {accessError && <p className="form-error">{accessError}</p>}
        {!access && accessError && <button className="outline-button" onClick={() => void checkAccess()}>Try again</button>}
      </main>
    );
  return (
    <main className="page-wrap studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">Behind the stitches</span>
          <h1>Admin dashboard ♡</h1>
          <p>Orders, products and the little details.</p>
        </div>
        <button
          className="outline-button"
          onClick={() => void load()}
          disabled={busy}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      <div className="studio-stats">
        <div>
          <ShoppingBag />
          <strong>{data?.orders.filter((o) => o.status === "paid" && ["pending", "payment_received"].includes(o.fulfillment || "")).length || 0}</strong>
          <span>Pending fulfillment</span>
        </div>
        <div>
          <Package />
          <strong>
            {data?.orders.filter((o) => o.status === "paid" && orderProgress(o.status, o.fulfillment).step === 2).length || 0}
          </strong>
          <span>In progress</span>
        </div>
        <div>
          <Check />
          <strong>
            {data?.orders.filter((o) => o.status === "paid" && orderProgress(o.status, o.fulfillment).step === 3).length || 0}
          </strong>
          <span>Completed</span>
        </div>
        <div>
          <Check />
          <strong>
            {money(
              (data?.orders
                .filter((o) => o.status === "paid")
                .reduce((s, o) => s + o.amount, 0) || 0) / 100,
            )}
          </strong>
          <span>Verified revenue (INR)</span>
        </div>
      </div>
      <nav className="studio-tabs" aria-label="Studio sections">
        {[
          { id: "products", Icon: Package },
          { id: "polls", Icon: Heart },
          { id: "analytics", Icon: Heart },
          { id: "delivery", Icon: Package },
          { id: "orders", Icon: ShoppingBag },
          { id: "messages", Icon: MessageCircle },
          { id: "journey", Icon: BookOpen },
          { id: "settings", Icon: Settings },
        ].map(({ id, Icon }) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => {
              setTab(id);
              setEditing(null);
              setChapter(null);
            }}
          >
            <Icon size={16} />
            {id === "settings" ? "Site content" : id === "delivery" ? "Delivery setup" : id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </nav>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="studio-notice" role="status">
          <Check size={15} />
          {notice}
        </p>
      )}
      {tab === "products" &&
        (editing ? (
          <form
            className="studio-editor paper-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save("/api/admin/products", { ...editing, create: isNew })
              )
                setEditing(null);
            }}
          >
            <div className="editor-top">
              <h2>{isNew ? "A new little treasure" : "The little details"}</h2>
              <button
                type="button"
                className="outline-button"
                onClick={() => setEditing(null)}
              >
                Back to products
              </button>
            </div>
            <div className="form-columns">
              <div className="field">
                <label htmlFor="product-name">Product name</label>
                <input
                  id="product-name"
                  required
                  minLength={3}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="slug">URL slug</label>
                <input
                  id="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  disabled={!isNew}
                  value={editing.id}
                  onChange={(e) =>
                    setEditing({ ...editing, id: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="category">Collection</label>
                <select
                  id="category"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tagline">Short note</label>
                <input
                  id="tagline"
                  value={editing.note}
                  onChange={(e) =>
                    setEditing({ ...editing, note: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="price">Price (INR ₹)</label>
                <input
                  id="price"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="stock">
                  Available stock (excludes payment reservations)
                </label>
                <input
                  id="stock"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={editing.stock ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, stock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="packed-weight">Packed shipping weight (grams)</label>
                <input id="packed-weight" type="number" min={1} max={50000} step={1}
                  value={editing.packedWeightGrams ?? ""} placeholder="Weigh the packed parcel"
                  onChange={(e) => setEditing({ ...editing, packedWeightGrams: e.target.value ? Number(e.target.value) : null })} />
                <small>Needed for delivery outside Aditya Surampalem. Include packaging.</small>
              </div>
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                required
                minLength={20}
                rows={5}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="colors">
                Palette (comma-separated hex colours)
              </label>
              <input
                id="colors"
                value={editing.colors.join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    colors: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>
            <fieldset className="spec-editor">
              <legend>Specifications</legend>
              {editing.details.map(([k, v], i) => (
                <div key={i}>
                  <input
                    aria-label={`Specification ${i + 1} label`}
                    value={k}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        details: editing.details.map((d, j) =>
                          j === i ? [e.target.value, v] : d,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Specification ${i + 1} value`}
                    value={v}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        details: editing.details.map((d, j) =>
                          j === i ? [k, e.target.value] : d,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove specification ${i + 1}`}
                    onClick={() =>
                      setEditing({
                        ...editing,
                        details: editing.details.filter((_, j) => j !== i),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="text-link"
                type="button"
                onClick={() =>
                  setEditing({
                    ...editing,
                    details: [...editing.details, ["", ""]],
                  })
                }
              >
                Add a specification +
              </button>
            </fieldset>
            <div className="upload-gallery">
              {editing.gallery.map((url, i) => (
                <div key={url}>
                  <img src={url} alt={`Product photo ${i + 1}`} />
                  <button
                    type="button"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() =>
                      setEditing({
                        ...editing,
                        gallery: editing.gallery.filter((_, j) => j !== i),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="upload-tile">
                <Upload />
                <span>Upload photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void upload(file, (url) =>
                        setEditing((v) =>
                          v ? { ...v, gallery: [...v.gallery, url] } : v,
                        ),
                      );
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.checked })
                }
              />{" "}
              Publish in the shop
            </label>
            <button className="stitch-button" disabled={busy}>
              <Save size={16} />
              {busy ? "Saving…" : "Save product"}
            </button>
          </form>
        ) : (
          <>
            <div className="studio-section-heading">
              <h2>Your little collection</h2>
              <button
                className="stitch-button"
                onClick={() => {
                  setEditing(structuredClone(blank));
                  setIsNew(true);
                }}
              >
                <Plus size={16} /> Add product
              </button>
            </div>
            <div className="studio-product-list">
              {data?.products.map((p) => (
                <article key={p.id}>
                  <img src={p.gallery[0]} alt={p.name} />
                  <div>
                    <h3>{p.name}</h3>
                    <span>
                      {p.category} · {p.active ? "Published" : "Hidden"}
                    </span>
                  </div>
                  <strong>{money(p.price)}</strong>
                  <span>{p.stock} available</span>
                  <button
                    className="outline-button"
                    onClick={() => {
                      setEditing(structuredClone(p));
                      setIsNew(false);
                    }}
                  >
                    Edit
                  </button>
                </article>
              ))}
            </div>
          </>
        ))}
      {tab === "delivery" && (
        <section>
          <h2>Delivery outside Aditya</h2>
          <div className="paper-form studio-editor">
            <p>You do not need this while the design poll is open. For future orders outside Aditya, the customer enters an address and PIN. The site uses that PIN and the items’ packed weight to find a saved price here. It does not ask India Post for a live price.</p>
            <ol>
              <li>Enter each product’s <strong>packed weight</strong> in Products, including packaging.</li>
              <li>Check the full India Post Parcel Retail price from Kakinada <strong>533001</strong> to the destination PIN at that weight in <a href="https://www.indiapost.gov.in/calculate-postage" target="_blank" rel="noreferrer">India Post’s calculator</a>.</li>
              <li>Save that quote below. Checkout adds exactly <strong>₹15</strong>. For example, an ₹80 quote becomes a ₹95 delivery charge.</li>
            </ol>
            <p className="quiet-note">Only PINs and parcel weights with an enabled saved rate can pay online.</p>
          </div>
          <details className="paper-form studio-editor" open={rateEditorOpen} onToggle={(event) => setRateEditorOpen(event.currentTarget.open)}>
            <summary>{rate.existing ? "Edit saved rate" : "Add a verified delivery rate"}</summary>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!/^\d+(\.\d{1,2})?$/.test(rate.rupees)) { setError("Enter the exact quoted rupees and paise."); return; }
            void save("/api/admin/delivery-rates", {
              destinationPin: rate.pin, maxWeightGrams: Number(rate.grams),
              postagePaise: Math.round(Number(rate.rupees) * 100), active: rate.active, verified: rateVerified,
            }).then((ok) => { if (ok) { setRate({ pin: "", grams: "", rupees: "", active: true, existing: false }); setRateVerified(false); setRateEditorOpen(false); } });
          }}>
            <div className="form-columns">
              <div className="field"><label htmlFor="rate-pin">Customer’s destination PIN</label><input id="rate-pin" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required disabled={rate.existing} value={rate.pin} onChange={(event) => setRate({ ...rate, pin: event.target.value })} /><small>The six-digit PIN the customer will type at checkout.</small></div>
              <div className="field"><label htmlFor="rate-grams">Covers packed orders up to (grams)</label><input id="rate-grams" type="number" min={1} max={50000} step={1} required disabled={rate.existing} value={rate.grams} onChange={(event) => setRate({ ...rate, grams: event.target.value })} /><small>For example, 500 covers parcels weighing 500 g or less.</small></div>
              <div className="field"><label htmlFor="rate-price">Full India Post quote (₹, including tax)</label><input id="rate-price" type="number" min={0.01} max={10000} step={0.01} required value={rate.rupees} onChange={(event) => setRate({ ...rate, rupees: event.target.value })} /><small>Copy the final amount shown by India Post. We add ₹15 for the customer.</small></div>
            </div>
            <label className="consent"><input type="checkbox" checked={rate.active} onChange={(event) => setRate({ ...rate, active: event.target.checked })} /> Enable this PIN and weight slab</label>
            <label className="consent"><input type="checkbox" checked={rateVerified} onChange={(event) => setRateVerified(event.target.checked)} required={rate.active} /> I checked the full payable quote from 533001 in India Post’s calculator.</label>
            <button className="stitch-button" disabled={busy}>{busy ? "Saving…" : "Save delivery rate"}</button>
          </form>
          </details>
          {data?.deliveryRates.map((entry) => <article className="studio-record editor-top" key={`${entry.destination_pin}/${entry.max_weight_grams}`}>
            <div><h3>{entry.destination_pin} · up to {entry.max_weight_grams} g</h3><p>India Post {money(entry.postage_paise / 100)} · Customer delivery {money((entry.postage_paise + 1500) / 100)} · {entry.active ? "Enabled" : "Disabled"}</p></div>
            <button className="outline-button" type="button" onClick={() => { setRate({ pin: entry.destination_pin, grams: String(entry.max_weight_grams), rupees: (entry.postage_paise / 100).toFixed(2), active: entry.active, existing: true }); setRateVerified(false); setRateEditorOpen(true); }}>Edit</button>
          </article>)}
          {!data?.deliveryRates.length && <p>No delivery rates are enabled yet. Add a verified destination to offer “Others” checkout.</p>}
        </section>
      )}
      {tab === "polls" && data && <StudioPolls mode={data.siteMode} activePollId={data.activePollId}
        polls={data.polls} token={token} onSaved={load} />}
      {tab === "analytics" && <StudioAnalytics token={token} />}
      {tab === "orders" && (
        <section>
          <h2>Little things, on their way</h2>
          <p className="quiet-note">Payment status is verified by the server and cannot be edited here.</p>
          <div className="order-filters">
            <label>Search order or customer<input type="search" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="ID, name or email" /></label>
            <label>Date<input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></label>
            <label>Payment<select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}><option value="all">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></label>
            <label>Fulfillment<select value={fulfillmentFilter} onChange={(e) => setFulfillmentFilter(e.target.value)}><option value="all">All</option><option value="payment_received">Payment received</option><option value="yarn_selected">Yarn selected</option><option value="crocheting">Crocheting</option><option value="quality_check">Quality check</option><option value="ready">Ready</option><option value="completed">Completed</option><option value="collected">Collected</option></select></label>
          </div>
          {!data?.orders.length && (
            <p className="loading-note">
              The first little order is still to come.
            </p>
          )}
          {data?.orders.filter((o) => {
            const query = orderSearch.trim().toLowerCase();
            return (!query || [o.id, o.receipt, o.customer.name, o.customer.email].some((v) => v.toLowerCase().includes(query))) &&
              (!orderDate || o.created_at.slice(0, 10) === orderDate) &&
              (paymentFilter === "all" || o.status === paymentFilter) &&
              (fulfillmentFilter === "all" || o.fulfillment === fulfillmentFilter);
          }).map((o) => (
            <article className="studio-record" key={o.id}>
              <div className="editor-top">
                <h3>
                  {o.receipt} {o.mode === "test" && <small>· TEST</small>}
                </h3>
                <span className="status-pill">{orderProgress(o.status, o.fulfillment).label}</span>
                <strong>{money(o.amount / 100)}</strong>
              </div>
              <p>{new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {o.customer.name} · {o.customer.email}</p>
              <p>Payment: {o.status} · Fulfillment: {orderProgress(o.status, o.fulfillment).label}</p>
              <details className="order-details"><summary>View order details</summary>
                <p>Mobile: {o.customer.phone}</p>
                <p>Delivery: {o.customer.addressChoice || o.customer.pickup || "Not recorded"}{o.customer.deliveryAddress ? ` · ${o.customer.deliveryAddress}` : ""}{o.customer.deliveryPin ? ` · ${o.customer.deliveryPin}` : ""}</p>
                {o.items.map((i, index) => <p key={index}>{i.name} × {i.quantity} · {money(i.price * i.quantity)}</p>)}
                <p>Subtotal: {money(o.subtotalPaise / 100)} · Delivery charge: {money(o.deliveryPaise / 100)} · Paid total: {money(o.amount / 100)}</p>
              </details>
              {o.status === "paid" && (
                <label className="field">
                  Fulfilment
                  <select
                    value={o.fulfillment || ""}
                    onChange={(e) =>
                      void save("/api/admin/content", {
                        type: "order",
                        id: o.id,
                        version: o.version,
                        fulfillment: e.target.value,
                      })
                    }
                  >
                    <option value="payment_received">Payment received</option>
                    <option value="yarn_selected">Yarn selected</option>
                    <option value="crocheting">Crocheting</option>
                    <option value="quality_check">Quality check</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="collected">Collected</option>
                  </select>
                </label>
              )}
            </article>
          ))}
        </section>
      )}
      {tab === "messages" && (
        <section>
          <h2>A few little hellos</h2>
          {!data?.messages.length && (
            <p className="loading-note">No messages yet.</p>
          )}
          {data?.messages.map((m) => (
            <article className="studio-record" key={m.id}>
              <div className="editor-top">
                <h3>
                  {m.name} · {m.topic}
                </h3>
                <span className="status-pill">{m.status}</span>
              </div>
              <a href={`mailto:${m.email}`}>{m.email}</a>
              <p className="message-text">{m.message}</p>
              {m.status === "new" && (
                <button
                  className="outline-button"
                  onClick={() =>
                    void save("/api/admin/content", {
                      type: "message",
                      id: m.id,
                    })
                  }
                >
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </section>
      )}
      {tab === "journey" &&
        (chapter ? (
          <form
            className="paper-form studio-editor"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save("/api/admin/content", {
                  ...chapter,
                  type: "journey",
                })
              )
                setChapter(null);
            }}
          >
            <div className="editor-top">
              <h2>A little chapter</h2>
              <button
                type="button"
                className="outline-button"
                onClick={() => setChapter(null)}
              >
                Back
              </button>
            </div>
            {(
              [
                "slug",
                "title",
                "category",
                "excerpt",
                "readTime",
                "image",
              ] as const
            ).map((k) => (
              <div className="field" key={k}>
                <label htmlFor={`chapter-${k}`}>
                  {k === "image" ? "Cover photo URL" : k}
                </label>
                <input
                  id={`chapter-${k}`}
                  required
                  value={chapter[k]}
                  onChange={(e) =>
                    setChapter({ ...chapter, [k]: e.target.value })
                  }
                />
              </div>
            ))}
            <label className="outline-button">
              <Upload size={15} /> Upload cover
              <input
                hidden
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    void upload(file, (url) =>
                      setChapter((v) => (v ? { ...v, image: url } : v)),
                    );
                }}
              />
            </label>
            {chapter.sections.map((s, i) => (
              <fieldset className="chapter-section" key={i}>
                <legend>Section {i + 1}</legend>
                <input
                  aria-label={`Section ${i + 1} heading`}
                  value={s.heading}
                  onChange={(e) =>
                    setChapter({
                      ...chapter,
                      sections: chapter.sections.map((p, j) =>
                        j === i ? { ...p, heading: e.target.value } : p,
                      ),
                    })
                  }
                />
                <textarea
                  aria-label={`Section ${i + 1} paragraphs`}
                  rows={6}
                  value={s.paragraphs.join("\n\n")}
                  onChange={(e) =>
                    setChapter({
                      ...chapter,
                      sections: chapter.sections.map((p, j) =>
                        j === i
                          ? { ...p, paragraphs: e.target.value.split("\n\n") }
                          : p,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setChapter({
                      ...chapter,
                      sections: chapter.sections.filter((_, j) => j !== i),
                    })
                  }
                >
                  Remove section
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              className="outline-button"
              onClick={() =>
                setChapter({
                  ...chapter,
                  sections: [
                    ...chapter.sections,
                    { heading: "", paragraphs: [""] },
                  ],
                })
              }
            >
              Add section +
            </button>
            <label className="consent">
              <input
                type="checkbox"
                checked={chapter.published}
                onChange={(e) =>
                  setChapter({ ...chapter, published: e.target.checked })
                }
              />{" "}
              Publish chapter
            </label>
            <button className="stitch-button" disabled={busy}>
              <Save size={16} /> Save chapter
            </button>
          </form>
        ) : (
          <>
            <div className="studio-section-heading">
              <h2>Notes from the studio</h2>
              <button
                className="stitch-button"
                onClick={() =>
                  setChapter({
                    slug: "",
                    title: "",
                    category: "Behind the stitches",
                    excerpt: "",
                    image: "",
                    readTime: "3 minute read",
                    sections: [{ heading: "", paragraphs: [""] }],
                    published: false,
                    revision: 0,
                  })
                }
              >
                <Plus size={16} /> New chapter
              </button>
            </div>
            {data?.journey.map((j) => (
              <article className="studio-record editor-top" key={j.slug}>
                <div>
                  <h3>{j.title}</h3>
                  <p>{j.published ? "Published" : "Draft"}</p>
                </div>
                <button
                  className="outline-button"
                  onClick={() => setChapter(structuredClone(j))}
                >
                  Edit chapter
                </button>
              </article>
            ))}
          </>
        ))}
      {tab === "settings" && (
        <form
          className="paper-form studio-editor"
          onSubmit={(e) => {
            e.preventDefault();
            void save("/api/admin/content", { ...settings, type: "settings" });
          }}
        >
          <h2>The little details of your site</h2>
          {(Object.keys(defaultSettings) as (keyof SiteSettings)[]).map((k) => (
            <div className="field" key={k}>
              <label htmlFor={`settings-${k}`}>
                {k.replace(/([A-Z])/g, " $1")}
              </label>
              {[
                "heroDescription",
                "aboutIntro",
                "contactIntro",
                "heroTitle",
              ].includes(k) ? (
                <textarea
                  id={`settings-${k}`}
                  rows={3}
                  required
                  value={settings[k]}
                  onChange={(e) =>
                    setSettings({ ...settings, [k]: e.target.value })
                  }
                />
              ) : (
                <input
                  id={`settings-${k}`}
                  required
                  value={settings[k]}
                  onChange={(e) =>
                    setSettings({ ...settings, [k]: e.target.value })
                  }
                />
              )}
            </div>
          ))}
          <label className="outline-button">
            <Upload size={15} /> Upload hero image
            <input
              type="file"
              hidden
              accept="image/*"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void upload(file, (url) =>
                    setSettings((v) => ({ ...v, heroImage: url })),
                  );
              }}
            />
          </label>
          <button className="stitch-button" disabled={busy}>
            <Save size={16} /> Save site content
          </button>
        </form>
      )}
    </main>
  );
}
