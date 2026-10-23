"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { Product, categories, money } from "@/lib/catalog";
import { JournalEntry } from "@/lib/journal";
import { defaultSettings, SiteSettings } from "@/lib/site-settings";
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
} from "lucide-react";
type AdminProduct = Product & { active: boolean; revision: number };
type StudioOrder = {
  mode?: string;
  id: string;
  amount: number;
  status: string;
  fulfillment?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    pickup: string;
    note: string;
  };
  items: { name: string; quantity: number }[];
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
    [data, setData] = useState<StudioData | null>(null),
    [tab, setTab] = useState("products"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<AdminProduct | null>(null),
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
  useEffect(() => {
    if (admin) void load();
  }, [admin, load]);
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
      setNotice("Photo uploaded to Cloudinary.");
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
          <button className="google-button" onClick={() => void login()}>
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
  return (
    <main className="page-wrap studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">Behind the stitches</span>
          <h1>Your little studio ♡</h1>
          <p>Products, people and the little details.</p>
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
          <Package />
          <strong>{data?.products.filter((p) => p.active).length || 0}</strong>
          <span>Live products</span>
        </div>
        <div>
          <ShoppingBag />
          <strong>
            {data?.orders.filter((o) => o.status === "paid").length || 0}
          </strong>
          <span>Paid orders</span>
        </div>
        <div>
          <MessageCircle />
          <strong>
            {data?.messages.filter((m) => m.status === "new").length || 0}
          </strong>
          <span>New messages</span>
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
          <span>Paid total (INR)</span>
        </div>
      </div>
      <nav className="studio-tabs" aria-label="Studio sections">
        {[
          { id: "products", Icon: Package },
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
            {id === "settings"
              ? "Site content"
              : id[0].toUpperCase() + id.slice(1)}
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
      {tab === "orders" && (
        <section>
          <h2>Little things, on their way</h2>
          <p className="quiet-note">
            Latest 100 orders. Payment status is verified by the server and
            cannot be edited here.
          </p>
          {!data?.orders.length && (
            <p className="loading-note">
              The first little order is still to come.
            </p>
          )}
          {data?.orders.map((o) => (
            <article className="studio-record" key={o.id}>
              <div className="editor-top">
                <h3>
                  {o.id} {o.mode === "test" && <small>· TEST</small>}
                </h3>
                <span className="status-pill">{o.fulfillment || o.status}</span>
                <strong>{money(o.amount / 100)}</strong>
              </div>
              <p>
                {o.customer.name} · {o.customer.email} ·{" "}
                <a href={`tel:${o.customer.phone}`}>{o.customer.phone}</a>
              </p>
              <p>Pickup: {o.customer.pickup}</p>
              {o.items.map((i, index) => (
                <p key={index}>
                  {i.name} × {i.quantity}
                </p>
              ))}
              {o.customer.note && <p>Note: {o.customer.note}</p>}
              {o.status === "paid" && (
                <label className="field">
                  Fulfilment
                  <select
                    value={o.fulfillment || ""}
                    onChange={(e) =>
                      void save("/api/admin/content", {
                        type: "order",
                        id: o.id,
                        fulfillment: e.target.value,
                      })
                    }
                  >
                    <option value="" disabled>
                      Choose next stage
                    </option>
                    <option value="preparing">Preparing</option>
                    <option value="ready_for_pickup">Ready for pickup</option>
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
                  {k === "image" ? "Cloudinary cover photo URL" : k}
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
