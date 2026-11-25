"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { Product, categories, money } from "@/lib/catalog";
import { parseProductCategories, productCategoryNames } from "@/lib/product-categories";
import { JournalEntry } from "@/lib/journal";
import { defaultSettings, SiteSettings } from "@/lib/site-settings";
import { orderProgress } from "@/lib/order-progress";
import StudioPolls, { type AdminPoll } from "./studio-polls";
import StudioAnalytics from "./studio-analytics";
import StudioShopPreview from "./studio-shop-preview";
import StudioEmails from "./studio-emails";
import StudioOrderFulfillment from "./studio-order-fulfillment";
import StudioOrderMessages from "./studio-order-messages";
import { personalizationSummary } from "./gift-personalization";
import type { GiftPersonalization } from "@/lib/personalization";
import { colorGallery, withColorGallery, productCover } from "@/lib/personalization";
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
const siteImages: { key: "heroImage"; label: string; help: string }[] = [
  { key: "heroImage", label: "Main hero image", help: "The large picture at the top of the page." },
];
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
  receivedAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    addressLine1?: string;
    areaStreet?: string;
    city?: string;
    state?: string;
    landmark?: string;
    addressChoice?: string;
    deliveryAddress?: string;
    deliveryPin?: string;
    pickup?: string;
    note?: string;
  };
  items: { name: string; quantity: number; price: number; personalizations?: GiftPersonalization[] }[];
  paymentId?: string | null;
  created_at: string;
};
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
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  launchReadiness: { livePayments: boolean; email: boolean; webhook: boolean; reconciliation: boolean; ready: boolean };
  siteMode: "shop" | "poll";
  shopDraftDirty: boolean;
  shopDraftRevision: number;
  shopLastPublishedAt: string | null;
  activePollId: string | null;
  polls: AdminPoll[];
  orders: StudioOrder[];
  messages: Message[];
  journey: Chapter[];
  settings: SiteSettings & { revision: number };
  pollSettings: SiteSettings & { revision: number };
};
const blank: AdminProduct = {
  id: "",
  name: "",
  note: "",
  category: "",
  categories: [],
  price: 299,
  discountPrice: null,
  stock: null,
  packedWeightGrams: null,
  description: "",
  details: [["Includes", "One handmade crochet piece"]],
  colors: ["#e9b7cc"],
  colorOptions: [],
  gallery: [],
  madeToOrder: true,
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
    [newCategory, setNewCategory] = useState(""),
    [isNew, setIsNew] = useState(false),
    [chapter, setChapter] = useState<Chapter | null>(null),
    [settings, setSettings] = useState<SiteSettings & { revision: number }>({
      ...defaultSettings,
      revision: 0,
    });
  const defaultCategoryNames = categories.map((item) => item.name);
  const categoryChoices = [
    ...defaultCategoryNames,
    ...Array.from(new Set([
      ...(data?.products || []).flatMap(productCategoryNames),
      ...(editing ? productCategoryNames(editing) : []),
    ].filter((name) => !defaultCategoryNames.includes(name)))).sort((a, b) => a.localeCompare(b)),
  ];
  function chooseCategory(name: string, checked: boolean) {
    if (!editing) return;
    const selected = productCategoryNames(editing);
    try {
      const next = parseProductCategories(checked ? [...selected, name] : selected.filter((item) => item !== name), null);
      setEditing({ ...editing, category: next[0], categories: next });
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check your categories."); }
  }
  function addCategory() {
    if (!editing) return;
    const name = newCategory.trim().replace(/\s+/g, " ");
    const existing = categoryChoices.find((item) => item.toLocaleLowerCase("en-IN") === name.toLocaleLowerCase("en-IN"));
    const selected = productCategoryNames(editing);
    if (existing && selected.includes(existing)) { setError("This category is already selected."); return; }
    try {
      const next = parseProductCategories([...selected, existing || name], null);
      setEditing({ ...editing, category: next[0], categories: next });
      setNewCategory("");
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the new category name."); }
  }
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
      const configured = result.configured === true;
      const unlocked = result.unlocked === true;
      setAccess((previous) => previous?.configured === configured && previous?.unlocked === unlocked
        ? previous : { configured, unlocked });
    } catch (cause) {
      setAccessError(cause instanceof Error ? cause.message : "Could not check admin access.");
    }
  }, [token]);
  useEffect(() => {
    if (admin) void checkAccess();
    else { setAccess(null); setData(null); }
  }, [admin, checkAccess]);
  useEffect(() => {
    if (!admin) return;
    const recheck = () => void checkAccess();
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
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
      setNotice(url === "/api/admin/products" || body && typeof body === "object" && "type" in body &&
        (body.type === "settings" || body.type === "journey")
        ? "Saved privately in the shop draft." : "Saved with a little care.");
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
  async function uploadColorPhotos(files: File[], index: number) {
    if (!files.length) return;
    if (colorGallery(editing!.colorOptions![index]).length + files.length > 8) {
      setError("Add up to eight photos for each colour.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${await token()}` },
          body: form,
        });
        const body = await response.json();
        if (!response.ok) throw Error(body.error || "Upload failed.");
        urls.push(body.url);
      }
      setEditing((current) => current ? { ...current, colorOptions: current.colorOptions!.map((option, position) =>
        position === index ? withColorGallery(option, [...colorGallery(option), ...urls]) : option) } : current);
      setNotice(`${urls.length} colour photo${urls.length === 1 ? "" : "s"} uploaded to Supabase Storage.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
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
          { id: "shop-setup", Icon: ShoppingBag },
          { id: "products", Icon: Package },
          { id: "polls", Icon: Heart },
          { id: "analytics", Icon: Heart },
          { id: "delivery", Icon: Package },
          { id: "orders", Icon: ShoppingBag },
          { id: "emails", Icon: MessageCircle },
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
            {id === "shop-setup" ? "Shop setup" : id === "settings" ? "Site content" : id === "delivery" ? "Delivery setup" : id[0].toUpperCase() + id.slice(1)}
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
      {tab === "shop-setup" && data && <section className="studio-shop-setup">
        <div className="studio-section-heading"><div><h2>Prepare the selling website</h2>
          <p>Changes to products and site content are private drafts. Preview them here, then publish when you are ready to show the shop.</p></div></div>
        <div className="paper-form studio-editor">
          <h3>Visitors currently see: {data.siteMode === "poll" ? data.activePollId ? "the design poll" : "the poll holding page" : "the selling website"}</h3>
          <p>{data.shopDraftDirty ? "You have unpublished shop changes." : "Your saved shop draft matches the last publication."}
            {data.shopLastPublishedAt && ` Last published ${new Date(data.shopLastPublishedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`}</p>
          <p>{data.saleEndsAt ? `Opening discounts end ${new Date(data.saleEndsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.` : "Opening discounts start when you first publish the selling website and last one calendar month."}</p>
          <p>Before public sales: live Razorpay keys {data.launchReadiness.livePayments ? "✓" : "needed"} · order email {data.launchReadiness.email ? "✓" : "needed"} · payment webhook {data.launchReadiness.webhook ? "✓" : "needed"} · recovery job {data.launchReadiness.reconciliation ? "✓" : "needed"}.</p>
          <div className="poll-actions">
            <button type="button" className="outline-button" onClick={() => setTab("products")}>Edit products</button>
            <button type="button" className="outline-button" onClick={() => setTab("settings")}>Edit site content</button>
            <button type="button" className="outline-button" onClick={() => setTab("journey")}>Edit journey</button>
            {data.siteMode === "poll" && <button type="button" className="stitch-button" disabled={busy || !data.launchReadiness.ready} onClick={async () => {
              if (!window.confirm("Publish this shop draft, show the selling website to everyone, and allow real payments?")) return;
              if (await save("/api/admin/mode", { action: "shop", draftRevision: data.shopDraftRevision }))
                window.dispatchEvent(new CustomEvent("campus-mode-changed", { detail: "shop" }));
            }}>Publish draft and show shop</button>}
            {data.siteMode === "shop" && data.shopDraftDirty && <button type="button" className="stitch-button" disabled={busy || !data.launchReadiness.ready} onClick={async () => {
              if (!window.confirm("Publish these reviewed draft changes to the live shop now? Customers will see the updated prices and products.")) return;
              await save("/api/admin/mode", { action: "shop", draftRevision: data.shopDraftRevision });
            }}>Publish changes to live shop</button>}
            {data.siteMode === "shop" && !data.shopDraftDirty && <p>The live shop matches this draft.</p>}
          </div>
        </div>
        <StudioShopPreview products={data.products} settings={data.settings} journey={data.journey}
          email={user.email || ""} token={token}
          saleActive={!data.saleStartsAt || (!!data.saleEndsAt && new Date(data.saleEndsAt).getTime() > Date.now())} />
      </section>}
      {tab === "products" &&
        (editing ? (
          <form
            className="studio-editor paper-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!productCategoryNames(editing).length) { setError("Choose at least one category."); return; }
              if (
                await save("/api/admin/products", { ...editing, create: isNew })
              ) {
                setEditing(null);
                setNewCategory("");
              }
            }}
          >
            <div className="editor-top">
              <h2>{isNew ? "A new little treasure" : "The little details"}</h2>
              <button
                type="button"
                className="outline-button"
                onClick={() => { setEditing(null); setNewCategory(""); }}
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
              <fieldset className="field product-categories-editor">
                <legend>Collections (choose one or more)</legend>
                <div className="product-category-choices">
                  {categoryChoices.map((name) => <label key={name}>
                    <input type="checkbox" checked={productCategoryNames(editing).includes(name)}
                      onChange={(event) => chooseCategory(name, event.target.checked)} />
                    {name}
                  </label>)}
                </div>
                <div className="new-category-row">
                  <input aria-label="New category name" value={newCategory} maxLength={50}
                    onChange={(event) => setNewCategory(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCategory(); } }}
                    placeholder="New category name" />
                  <button type="button" className="outline-button" onClick={addCategory} disabled={!newCategory.trim()}>Add category</button>
                </div>
                <small>New categories appear on the website when a published product uses them.</small>
              </fieldset>
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
                <label htmlFor="price">Regular price (INR ₹)</label>
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
                <label htmlFor="discount-price">Opening discounted price (optional)</label>
                <input id="discount-price" type="number" min={1} max={Math.max(1, editing.price - 1)} step={1}
                  value={editing.discountPrice ?? ""}
                  onChange={(event) => setEditing({ ...editing, discountPrice: event.target.value ? Number(event.target.value) : null })} />
                <small>Must be lower than the regular price. It appears after you publish and ends one month after the first shop launch.</small>
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
            <fieldset className="studio-colour-options">
              <legend>Colours customers can choose (optional)</legend>
              <p className="quiet-note">Leave this empty for fixed designs. Add the pictured colour first: its first photo becomes the shop collection picture. Upload up to eight pictures for each colour. Customers see only that colour’s pictures when they select it.</p>
              {(editing.colorOptions || []).map((option, index) => <div className="studio-colour-option" key={index}>
                <div className="field"><label htmlFor={`colour-name-${index}`}>Colour name {index === 0 ? "· default" : ""}</label>
                  <input id={`colour-name-${index}`} value={option.name} maxLength={40} required
                    onChange={(event) => setEditing({ ...editing, colorOptions: editing.colorOptions!.map((entry, i) => i === index ? { ...entry, name: event.target.value } : entry) })} /></div>
                <div className="field"><label htmlFor={`colour-hex-${index}`}>Swatch</label>
                  <input id={`colour-hex-${index}`} type="color" value={option.hex}
                    onChange={(event) => setEditing({ ...editing, colorOptions: editing.colorOptions!.map((entry, i) => i === index ? { ...entry, hex: event.target.value } : entry) })} /></div>
                <div className="studio-colour-gallery" aria-label={`${option.name || `Colour ${index + 1}`} photos`}>
                  {colorGallery(option).map((url, photoIndex, pictures) => <div className="studio-colour-gallery-item" key={`${url}-${photoIndex}`}>
                    <img src={url} alt={`${option.name || "Colour"} photo ${photoIndex + 1}`} />
                    <span>{photoIndex === 0 ? index === 0 ? "Shop cover" : "Colour cover" : `Photo ${photoIndex + 1}`}</span>
                    <div>
                      <button type="button" className="text-link" disabled={busy || photoIndex === 0} aria-label={`Move ${option.name || "colour"} photo ${photoIndex + 1} left`}
                        onClick={() => { const next = [...pictures]; [next[photoIndex - 1], next[photoIndex]] = [next[photoIndex], next[photoIndex - 1]];
                          setEditing({ ...editing, colorOptions: editing.colorOptions!.map((entry, i) => i === index ? withColorGallery(entry, next) : entry) }); }}>←</button>
                      <button type="button" className="text-link" disabled={busy || photoIndex === pictures.length - 1} aria-label={`Move ${option.name || "colour"} photo ${photoIndex + 1} right`}
                        onClick={() => { const next = [...pictures]; [next[photoIndex + 1], next[photoIndex]] = [next[photoIndex], next[photoIndex + 1]];
                          setEditing({ ...editing, colorOptions: editing.colorOptions!.map((entry, i) => i === index ? withColorGallery(entry, next) : entry) }); }}>→</button>
                      <button type="button" className="text-link" disabled={busy} aria-label={`Remove ${option.name || "colour"} photo ${photoIndex + 1}`}
                        onClick={() => setEditing({ ...editing, colorOptions: editing.colorOptions!.map((entry, i) => i === index ? withColorGallery(entry, pictures.filter((_, position) => position !== photoIndex)) : entry) })}>Remove</button>
                    </div>
                  </div>)}
                </div>
                <label className="outline-button studio-colour-upload">Add photos for this colour
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy || colorGallery(option).length >= 8}
                    onChange={(event) => { const files = Array.from(event.target.files || []); if (files.length) void uploadColorPhotos(files, index); event.target.value = ""; }} /></label>
                {index === 0 && editing.gallery.length > 0 && <button type="button" className="text-link" disabled={busy}
                  onClick={() => setEditing({ ...editing, colorOptions: editing.colorOptions!.map((entry, i) => i === 0 ? withColorGallery(entry, editing.gallery.slice(0, 8)) : entry) })}>Copy main product photos to default colour</button>}
                <button type="button" className="text-link" disabled={busy || index === 0} onClick={() => { const next = [...editing.colorOptions!]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setEditing({ ...editing, colorOptions: next }); }}>Move up</button>
                <button type="button" className="text-link" disabled={busy || index === editing.colorOptions!.length - 1} onClick={() => { const next = [...editing.colorOptions!]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setEditing({ ...editing, colorOptions: next }); }}>Move down</button>
                <button type="button" className="text-link" disabled={busy} onClick={() => setEditing({ ...editing,
                  colorOptions: editing.colorOptions!.filter((_, i) => i !== index) })}>Remove colour</button>
              </div>)}
              <button type="button" className="outline-button" disabled={busy || (editing.colorOptions?.length || 0) >= 12}
                onClick={() => setEditing({ ...editing, colorOptions: [...(editing.colorOptions || []), { name: "", hex: "#c9add7", image: "", images: [] }] })}>Add a colour choice</button>
            </fieldset>
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
            <p className="quiet-note">Main product photos: used for designs without colour choices. For designs with colours, the first colour’s photos appear in the shop; these remain as a fallback for older pages.</p>
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
              Show when shop goes live
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
                  setNewCategory("");
                  setIsNew(true);
                }}
              >
                <Plus size={16} /> Add product
              </button>
            </div>
            <div className="studio-product-list">
              {data?.products.map((p) => (
                <article key={p.id}>
                  <img src={productCover(p)} alt={p.name} />
                  <div>
                    <h3>{p.name}</h3>
                    <span>
                      {productCategoryNames(p).join(", ")} · {p.active ? "In shop draft" : "Hidden from shop"}
                    </span>
                  </div>
                  <strong>{p.discountPrice ? <><del>{money(p.price)}</del> {money(p.discountPrice)}</> : money(p.price)}</strong>
                  <span>Made to order</span>
                  <button
                    className="outline-button"
                    onClick={() => {
                      setEditing(structuredClone(p));
                      setNewCategory("");
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
          <h2>Delivery pricing</h2>
          <div className="paper-form studio-editor">
            <p><strong>Shipping is free</strong> for Aditya Surampalem and home delivery. Customers still enter a complete address and matching PIN for home delivery.</p>
            <p>Customers choose a state and enter a matching Indian PIN. Checkout shows the final total before opening Razorpay. No rate or product weight setup is needed.</p>
            <p className="quiet-note">The shop pays shipping costs. Old PIN and weight rates remain in the database as history but are not charged.</p>
          </div>
        </section>
      )}
      {tab === "polls" && data && <StudioPolls mode={data.siteMode} activePollId={data.activePollId}
        polls={data.polls} pollSettings={data.pollSettings} token={token} onSaved={load} />}
      {tab === "analytics" && <StudioAnalytics token={token} />}
      {tab === "orders" && (
        <section>
          <h2>Little things, on their way</h2>
          <p className="quiet-note">Payment status is verified by the server and cannot be edited here.</p>
          <div className="order-filters">
            <label>Search order or customer<input type="search" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="ID, name or email" /></label>
            <label>Date<input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></label>
            <label>Payment<select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}><option value="all">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></label>
            <label>Tracking<select value={fulfillmentFilter} onChange={(e) => setFulfillmentFilter(e.target.value)}><option value="all">All</option><option value="1">Confirmed</option><option value="2">Making</option><option value="3">Ready to send</option><option value="4">Dispatched / Collected</option></select></label>
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
              (fulfillmentFilter === "all" || orderProgress(o.status, o.fulfillment, o.receivedAt).step === Number(fulfillmentFilter));
          }).map((o) => (
            <article className="studio-record" key={o.id}>
              <div className="editor-top">
                <h3>
                  {o.receipt} {o.mode === "test" && <small>· TEST</small>}
                </h3>
                <span className="status-pill">{orderProgress(o.status, o.fulfillment, o.receivedAt).label}</span>
                <strong>{money(o.amount / 100)}</strong>
              </div>
              <p>{new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {o.customer.name} · {o.customer.email}</p>
              <p>Payment: {o.status} · Fulfillment: {orderProgress(o.status, o.fulfillment, o.receivedAt).label}</p>
              <details className="order-details"><summary>View order details</summary>
                <p>Mobile: {o.customer.phone}</p>
                <p>Delivery: {o.customer.addressChoice || o.customer.pickup || "Not recorded"}{o.customer.deliveryAddress ? ` · ${o.customer.deliveryAddress}` : ""}{o.customer.deliveryPin ? ` · ${o.customer.deliveryPin}` : ""}</p>
                {o.customer.addressLine1 && <p>Flat / building: {o.customer.addressLine1}</p>}
                {o.customer.areaStreet && <p>Area / street: {o.customer.areaStreet}</p>}
                {o.customer.city && <p>Town / city: {o.customer.city}</p>}
                {o.customer.state && <p>State: {o.customer.state}</p>}
                {o.customer.landmark && <p>Landmark: {o.customer.landmark}</p>}
                {o.items.map((i, index) => <div className="studio-order-item" key={index}>
                  <strong>{i.name} × {i.quantity} · {money(i.price * i.quantity)}</strong>
                  {i.personalizations?.map((choice, choiceIndex) => personalizationSummary(choice).length > 0 && <div className="personalization-summary" key={choiceIndex}>
                    {i.quantity > 1 && <b>Piece {choiceIndex + 1}</b>}
                    {personalizationSummary(choice).map((line) => <span key={line}>{line}</span>)}
                  </div>)}
                </div>)}
                <p>Subtotal: {money(o.subtotalPaise / 100)} · Delivery charge: {money(o.deliveryPaise / 100)} · Paid total: {money(o.amount / 100)}</p>
                {o.paymentId && <p>Razorpay payment: {o.paymentId}</p>}
              </details>
              {o.status === "paid" && !["dispatched", "collected"].includes(o.fulfillment || "") && (
                <StudioOrderFulfillment id={o.id} version={o.version} fulfillment={o.fulfillment}
                  deliveryChoice={o.customer.addressChoice}
                  onSaved={async () => { await load(); setNotice("Order tracking saved."); }}
                  onLocked={() => setAccess({ configured: true, unlocked: false })} />
              )}
              {o.status === "paid" && o.fulfillment === "completed" &&
                <p className="quiet-note">When you ship this order, mark it Dispatched. Then prepare the shipping email here and send it from your support mailbox.</p>}
              {o.status === "paid" && ["dispatched", "collected"].includes(o.fulfillment || "") &&
                <StudioOrderMessages order={o} onUpdated={load}
                  onLocked={() => setAccess({ configured: true, unlocked: false })} />}
            </article>
          ))}
        </section>
      )}
      {tab === "emails" && <StudioEmails />}
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
              Show this chapter when shop goes live
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
                  <p>{j.published ? "In shop draft" : "Hidden from shop"}</p>
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
          <h2>Draft site content</h2><p>These changes stay private until you publish the shop from Shop setup.</p>
          {(Object.keys(defaultSettings) as (keyof SiteSettings)[]).filter((k) => !siteImages.some((image) => image.key === k)
            && k !== "storyBackgroundImage" && k !== "storyImage").map((k) => (
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
          <div className="site-image-grid">
            {siteImages.map(({ key, label, help }) => (
              <div className="site-image-field" key={key}>
                <img src={settings[key]} alt={`${label} preview`} />
                <h3>{label}</h3>
                <p>{help}</p>
                <label className="outline-button">
                  <Upload size={15} /> Choose picture
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void upload(file, (url) =>
                          setSettings((v) => ({ ...v, [key]: url })),
                        );
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <button className="stitch-button" disabled={busy}>
            <Save size={16} /> Save draft content
          </button>
        </form>
      )}
    </main>
  );
}
