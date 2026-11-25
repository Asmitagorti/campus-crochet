"use client";

import type { Product } from "@/lib/catalog";
import { defaultPersonalization, occasions, type GiftPersonalization } from "@/lib/personalization";

export default function GiftPersonalizationForm({ product, number, quantity, value, onChange }: {
  product: Product;
  number: number;
  quantity: number;
  value: GiftPersonalization;
  onChange: (value: GiftPersonalization) => void;
}) {
  const choices = product.colorOptions || [];
  const selected = choices.find((choice) => choice.name === value.color) || choices[0];
  const preview = selected?.image || product.gallery[0];
  const id = `${product.id}-${number}`;
  return <section className="gift-personalization" aria-label={`Personalize ${product.name}, piece ${number}`}>
    <div className="gift-personalization-heading">
      <img src={preview} alt={selected ? `${product.name} in ${selected.name}` : product.name} />
      <div><span className="eyebrow">Your personal touch</span><h3>{product.name}{quantity > 1 ? ` · piece ${number}` : ""}</h3>
        <p>Add the little gift details for this piece.</p></div>
    </div>
    <p className="gift-fixed-colour"><span>Colour chosen in the shop</span>
      {selected && <span className="gift-selected-swatch" style={{ background: selected.hex }} aria-hidden="true" />}
      <strong>{value.color}</strong></p>
    <div className="field"><label htmlFor={`recipient-${id}`}>Who is this for? <span>(optional)</span></label>
      <input id={`recipient-${id}`} value={value.recipientName} maxLength={60} placeholder="Their name"
        onChange={(event) => onChange({ ...value, recipientName: event.target.value })} /></div>
    <fieldset className="gift-occasion"><legend>What’s the occasion? <span>(optional)</span></legend>
      <div className="gift-occasion-grid">{["", ...occasions].map((occasion) => <label key={occasion || "none"}>
        <input type="radio" name={`occasion-${id}`} checked={value.occasion === occasion}
          onChange={() => onChange({ ...value, occasion })} />{occasion || "No occasion"}
      </label>)}</div>
    </fieldset>
    <div className="field"><label htmlFor={`gift-message-${id}`}>Your handwritten gift message <span>(optional · included)</span></label>
      <textarea id={`gift-message-${id}`} rows={3} maxLength={280} value={value.message}
        placeholder="A little something to make them smile…"
        onChange={(event) => onChange({ ...value, message: event.target.value })} />
      <small>{value.message.length}/280 characters</small></div>
    <label className="consent gift-hide-price"><input type="checkbox" checked={value.hidePrice}
      onChange={(event) => onChange({ ...value, hidePrice: event.target.checked })} />
      <span>It’s a gift. Keep prices out of the package.</span></label>
    {(value.recipientName || value.occasion || value.message) && <div className="gift-card-preview" aria-label="Gift card preview">
      <span>♡ &nbsp; Handmade with love &nbsp; ♡</span>
      {value.recipientName && <strong>For {value.recipientName}</strong>}
      {value.occasion && <em>{value.occasion}</em>}
      {value.message && <p>{value.message}</p>}
      <small>Campus Crochet</small>
    </div>}
    {(value.recipientName || value.occasion || value.message) && <p className="gift-preview-note">A preview of your words; your real card will be handwritten.</p>}
  </section>;
}

export function personalizationSummary(value: GiftPersonalization) {
  return [value.color !== "As pictured" ? `Colour: ${value.color}` : "",
    value.recipientName ? `For: ${value.recipientName}` : "",
    value.occasion ? `Occasion: ${value.occasion}` : "",
    value.message ? `Gift message: ${value.message}` : "",
    value.hidePrice ? "Gift package: no printed price" : ""].filter(Boolean);
}

export function defaultGiftChoices(product: Product, quantity: number) {
  return Array.from({ length: quantity }, () => defaultPersonalization(product));
}

