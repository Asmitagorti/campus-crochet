"use client";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { money } from "@/lib/catalog";
import type { SiteSettings } from "@/lib/site-settings";
import { productCategoryNames, visibleCategoryGroups } from "@/lib/product-categories";
import { draftPreviewProduct, previewCheckoutTotal } from "@/lib/shop-drafts";
import { indianStates } from "@/lib/indian-states";
import type { JournalEntry } from "@/lib/journal";
import ProductPrice from "./product-price";
import GiftPersonalizationForm, { defaultGiftChoices } from "./gift-personalization";
import { productCover, productGallery, type GiftPersonalization } from "@/lib/personalization";
import { defaultCartColor } from "@/lib/cart-colors";

type View = "home" | "shop" | "product" | "bag" | "about" | "journey" | "contact";
type Quote = { subtotalPaise: number; deliveryPaise: number; totalPaise: number; rehearsal: true };

export default function StudioShopPreview({ products, settings, journey, email, token, saleActive }: {
  products: Product[];
  settings: SiteSettings;
  journey: (JournalEntry & { published: boolean })[];
  email: string;
  token: () => Promise<string>;
  saleActive: boolean;
}) {
  const visible = products.filter((product) => product.active).map((product) => draftPreviewProduct(product, saleActive));
  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState(visible[0]?.id || "");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [category, setCategory] = useState("All");
  const [bag, setBag] = useState<Record<string, number>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [personalizations, setPersonalizations] = useState<Record<string, GiftPersonalization[]>>({});
  const [addressChoice, setAddressChoice] = useState<"Others" | "Aditya Surampalem">("Aditya Surampalem");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const product = visible.find((item) => item.id === selected);
  const items = visible.filter((item) => bag[item.id] > 0).map((item) => ({ ...item, quantity: bag[item.id] }));
  const estimate = previewCheckoutTotal(items, addressChoice);
  const categories = visibleCategoryGroups(visible, []);
  function openProduct(id: string) { setSelected(id); setPhotoIndex(0); setView("product"); }
  function add(id: string) {
    const item = visible.find((entry) => entry.id === id);
    if (!item) return;
    const index = bag[id] || 0;
    if (index >= 10) return;
    const color = selectedColors[id] || defaultCartColor(item);
    setBag((current) => ({ ...current, [id]: Math.min(10, (current[id] || 0) + 1) }));
    setPersonalizations((current) => ({ ...current, [id]: [
      ...(current[id] || []), { ...defaultGiftChoices(item, 1)[0], color },
    ] }));
    setQuote(null);
  }
  async function rehearse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setQuote(null);
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/admin/shop-preview", {
        method: "POST", headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, cart: bag, consent: true, addressChoice,
          personalizations: Object.fromEntries(items.map((item) => [item.id,
            Array.from({ length: item.quantity }, (_, index) => personalizations[item.id]?.[index] || defaultGiftChoices(item, item.quantity)[index])])) }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not check this preview checkout.");
      setQuote(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Preview checkout failed."); }
    finally { setBusy(false); }
  }
  return <div className="shop-preview">
    <div className="shop-preview-banner"><strong>Private shop preview</strong><span>{visible.some((item) => item.regularPrice != null) ? "Opening month offer · " : ""}Free shipping · Draft changes only · No orders or payments</span></div>
    <nav className="shop-preview-nav" aria-label="Preview pages">
      {(["home", "shop", "bag", "about", "journey", "contact"] as const).map((page) =>
        <button type="button" key={page} className={view === page ? "selected" : ""} onClick={() => setView(page)}>
          {page === "bag" ? `Bag (${items.reduce((count, item) => count + item.quantity, 0)})` : page[0].toUpperCase() + page.slice(1)}
        </button>)}
    </nav>
    {view === "home" && <>
      <div className="shop-preview-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,249,235,.9), rgba(255,249,235,.55)), url("${settings.heroImage}")` }}>
        <span className="eyebrow">{settings.announcement}</span>
        <h2>{settings.heroTitle}</h2><p>{settings.heroDescription}</p>
        <button type="button" className="stitch-button" onClick={() => setView("shop")}>Shop the collection</button>
      </div>
      <h3>Featured collection</h3>
      <div className="shop-preview-grid">{visible.slice(0, 6).map((item) => <article key={item.id}>
        <button type="button" className="shop-preview-photo" onClick={() => openProduct(item.id)}><img src={productCover(item)} alt={item.name} /></button>
        <h4>{item.name}</h4><p><ProductPrice product={item} /></p><button type="button" className="outline-button" onClick={() => openProduct(item.id)}>View item</button>
      </article>)}</div>
    </>}
    {view === "shop" && <>
      <h2>Find your little happy thing</h2>
      <div className="shop-preview-categories"><button type="button" className={category === "All" ? "selected" : ""} onClick={() => setCategory("All")}>All ({visible.length})</button>
        {categories.map((item) => <button type="button" key={item.name} className={category === item.name ? "selected" : ""} onClick={() => setCategory(item.name)}>{item.name} ({item.count})</button>)}</div>
      <div className="shop-preview-grid">{visible.filter((item) => category === "All" || productCategoryNames(item).includes(category)).map((item) => <article key={item.id}>
        <button type="button" className="shop-preview-photo" onClick={() => openProduct(item.id)}><img src={productCover(item)} alt={item.name} /></button>
        <h3>{item.name}</h3><p>{item.note}</p><strong><ProductPrice product={item} /></strong><p>Made to order</p>
        <div className="shop-preview-card-actions"><button type="button" className="outline-button" onClick={() => openProduct(item.id)}>View item</button>
          <button type="button" className="small-button" onClick={() => { if (item.colorOptions?.length) openProduct(item.id); else { add(item.id); setView("bag"); } }}>
            {item.colorOptions?.length ? "Choose colour" : "Add to test bag"}</button></div>
      </article>)}</div>
      {!visible.length && <p>No items are set to show in the shop yet. Add one in Products.</p>}
    </>}
    {view === "product" && product && <div className="shop-preview-detail">
      <div><img src={productGallery(product, selectedColors[product.id])[photoIndex] || productCover(product)} alt={product.name} />
        <div className="shop-preview-thumbs">{productGallery(product, selectedColors[product.id]).map((url, index) => <button type="button" key={`${url}-${index}`} aria-label={`View photo ${index + 1}`} onClick={() => setPhotoIndex(index)}><img src={url} alt="" /></button>)}</div></div>
      <div><button type="button" className="text-link" onClick={() => setView("shop")}>← Back to shop</button>
        <h2>{product.name}</h2><p>{product.description}</p><p>{productCategoryNames(product).join(" · ")}</p>
        <div className="detail-price"><ProductPrice product={product} /></div><p>Made to order · Complimentary handwritten card available at checkout.</p>
        {!!product.colorOptions?.length && <div className="product-colour-choices"><strong>Choose your colour</strong>
          <div>{product.colorOptions.map((choice) => <button type="button" key={choice.name}
            className={(selectedColors[product.id] || defaultCartColor(product)) === choice.name ? "selected" : ""}
            aria-pressed={(selectedColors[product.id] || defaultCartColor(product)) === choice.name}
            onClick={() => { setSelectedColors((current) => ({ ...current, [product.id]: choice.name })); setPhotoIndex(0); }}>
            <img src={choice.image} alt="" /><span>{choice.name}</span></button>)}</div></div>}
        <button type="button" className="stitch-button" onClick={() => { add(product.id); setView("bag"); }}>Add to test bag</button></div>
    </div>}
    {view === "bag" && <>
      <h2>Test bag and checkout</h2><p>This rehearsal checks the address and total. It does not save details or start payment.</p>
      {!items.length ? <p>Your test bag is empty. Choose an item in the Shop preview.</p> : <div className="shop-preview-checkout">
        <form className="paper-form" onSubmit={(event) => void rehearse(event)}>
          <h3>Personalize your pieces</h3><p>These options are part of the private rehearsal. No payment will start.</p>
          {items.flatMap((item) => Array.from({ length: item.quantity }, (_, index) => <GiftPersonalizationForm key={`${item.id}-${index}`}
            product={item} number={index + 1} quantity={item.quantity} value={personalizations[item.id]?.[index] || defaultGiftChoices(item, item.quantity)[index]}
            onChange={(next) => setPersonalizations((previous) => { const entries = Array.from({ length: item.quantity }, (_, i) => previous[item.id]?.[i] || defaultGiftChoices(item, item.quantity)[i]);
              entries[index] = next; return { ...previous, [item.id]: entries }; })} />))}
          <h3 className="checkout-contact-heading">Contact and delivery details</h3><p>Email: {email}</p>
          <div className="field"><label htmlFor="preview-name">Full name *</label><input id="preview-name" name="name" required minLength={2} maxLength={80} /></div>
          <div className="field"><label htmlFor="preview-phone">Indian mobile number (+91) *</label><input id="preview-phone" name="phone" type="tel" required pattern="(?:[+]91[ -]?)?[6-9](?:[ -]?[0-9]){9}" maxLength={24} placeholder="9876543210 or +91 9876543210" /></div>
          <div className="field"><label htmlFor="preview-choice">Delivery option *</label><select id="preview-choice" value={addressChoice} onChange={(event) => { setAddressChoice(event.target.value as typeof addressChoice); setQuote(null); }}>
            <option value="Aditya Surampalem">Aditya Surampalem · Free</option><option value="Others">Home delivery · Free</option></select></div>
          {addressChoice === "Others" && <>
            <div className="field"><label htmlFor="preview-house">Flat or house number, building *</label><input id="preview-house" name="addressLine1" required minLength={3} maxLength={120} /></div>
            <div className="field"><label htmlFor="preview-street">Area, street *</label><input id="preview-street" name="areaStreet" required minLength={3} maxLength={120} /></div>
            <div className="field"><label htmlFor="preview-city">Town or city *</label><input id="preview-city" name="city" required minLength={2} maxLength={80} /></div>
            <div className="field"><label htmlFor="preview-state">State or union territory *</label><select id="preview-state" name="state" required defaultValue=""><option value="">Select state</option>
              {indianStates.map((state) => <option key={state} value={state}>{state}</option>)}</select></div>
            <div className="field"><label htmlFor="preview-pin">Delivery PIN code *</label><input id="preview-pin" name="deliveryPin" required pattern="[1-9][0-9]{5}" maxLength={6} inputMode="numeric" /></div>
            <div className="field"><label htmlFor="preview-landmark">Landmark (optional)</label><input id="preview-landmark" name="landmark" maxLength={120} /></div>
          </>}
          <p className="quiet-note">Orders cannot be cancelled after payment. We do not offer voluntary returns or exchanges.</p>
          <button type="submit" className="stitch-button" disabled={busy}>{busy ? "Checking…" : "Check test checkout"}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
          {quote && <p className="form-success" role="status">Details accepted. Test total: {money(quote.totalPaise / 100)}. No order or payment was created.</p>}
        </form>
        <aside className="checkout-summary"><h3>Your test collection</h3>
          {items.map((item) => <div className="checkout-item" key={item.id}><img src={productCover(item)} alt={item.name} /><div><strong>{item.name}</strong><p>Quantity {item.quantity}</p>
            <button type="button" className="text-link" onClick={() => { setBag((current) => { const next = { ...current }; delete next[item.id]; return next; });
              setPersonalizations((current) => { const next = { ...current }; delete next[item.id]; return next; }); setQuote(null); }}>Remove</button></div><strong><ProductPrice product={item} quantity={item.quantity} showSavings={false} /></strong></div>)}
          <div className="total-line"><span>Subtotal</span><strong>{money(estimate.subtotalPaise / 100)}</strong></div>
          <div className="total-line"><span>Delivery</span><strong>{estimate.deliveryPaise ? money(estimate.deliveryPaise / 100) : "Free"}</strong></div>
          <div className="total-line grand-total"><strong>Total</strong><strong>{money(estimate.totalPaise / 100)}</strong></div>
        </aside>
      </div>}
    </>}
    {view === "about" && <div className="shop-preview-copy"><h2>About the maker</h2><p>{settings.aboutIntro}</p></div>}
    {view === "journey" && <div className="shop-preview-copy"><h2>The journey, in stitches</h2>
      {journey.filter((entry) => entry.published).map((entry) => <article key={entry.slug} className="studio-record">
        <img src={entry.image} alt={entry.title} width={180} /><h3>{entry.title}</h3><p>{entry.excerpt}</p>
        {entry.sections.map((section, index) => <div key={index}><h4>{section.heading}</h4>{section.paragraphs.map((paragraph, position) => <p key={position}>{paragraph}</p>)}</div>)}
      </article>)}
      {!journey.some((entry) => entry.published) && <p>No chapters will appear when the shop opens.</p>}</div>}
    {view === "contact" && <div className="shop-preview-copy"><h2>Contact the studio</h2><p>{settings.contactIntro}</p><p>support@campus-crochet.tech</p><p>Contact form submissions are disabled in this private preview.</p></div>}
  </div>;
}
