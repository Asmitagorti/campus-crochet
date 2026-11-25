import type { Product } from "./catalog";

export type ColorOption = { name: string; hex: string; image: string; images?: string[] };
export function colorGallery(option: ColorOption): string[] {
  return option.images?.length ? option.images : option.image ? [option.image] : [];
}
export function withColorGallery(option: ColorOption, images: string[]): ColorOption {
  return { ...option, image: images[0] || "", images };
}
export function productGallery(product: Product, selectedColor?: string): string[] {
  const options = product.colorOptions || [];
  const choice = options.find((option) => option.name === selectedColor) || options[0];
  return choice ? colorGallery(choice) : product.gallery;
}
export function productCover(product: Product): string {
  return productGallery(product)[0] || product.gallery[0] || "";
}
export type GiftPersonalization = {
  color: string;
  recipientName: string;
  occasion: string;
  message: string;
  hidePrice: boolean;
};

export const occasions = ["Birthday", "Friendship", "Anniversary", "Just because", "For myself"] as const;

export function defaultPersonalization(product: Product): GiftPersonalization {
  return { color: product.colorOptions?.[0]?.name || "As pictured", recipientName: "", occasion: "", message: "", hidePrice: false };
}

function cleanText(value: unknown, label: string, limit: number) {
  if (typeof value !== "string" || value.length > limit || /[\x00-\x1f\x7f]/.test(value))
    throw Error(`Please check the ${label}.`);
  return value.trim().replace(/ +/g, " ");
}

function cleanMessage(value: unknown) {
  if (typeof value !== "string" || value.length > 280 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))
    throw Error("Please check the gift message.");
  return value.replace(/\r\n?/g, "\n").trim();
}

export function parseColorOptions(value: unknown): ColorOption[] {
  if (!Array.isArray(value) || value.length > 12) throw Error("Add up to 12 colour choices.");
  const names = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== "object") throw Error("Please check the colour choices.");
    const row = item as Record<string, unknown>;
    const name = cleanText(row.name, "colour name", 40);
    if (!name || !/^#[0-9a-f]{6}$/i.test(String(row.hex)))
      throw Error("Every colour needs a name, colour swatch and photo.");
    const images = row.images === undefined ? [row.image] : row.images;
    if (!Array.isArray(images) || images.length < 1 ||
      images.some((image) => typeof image !== "string" || !image.trim()))
      throw Error("Every colour needs at least one photo.");
    if (images.length > 8) throw Error("Add up to eight photos per colour.");
    if (names.has(name.toLocaleLowerCase("en-IN"))) throw Error("Colour names must be different.");
    names.add(name.toLocaleLowerCase("en-IN"));
    return { name, hex: String(row.hex).toLowerCase(), image: images[0] as string, images: images as string[] };
  });
}

export function parseOrderPersonalizations(
  raw: unknown,
  items: { product: Product; quantity: number }[],
): Record<string, GiftPersonalization[]> {
  if (raw == null) return Object.fromEntries(items.map(({ product, quantity }) =>
    [product.id, Array.from({ length: quantity }, () => defaultPersonalization(product))]));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw Error("Please review your gift choices.");
  const input = raw as Record<string, unknown>;
  if (Object.keys(input).some((id) => !items.some((item) => item.product.id === id)))
    throw Error("Your gift choices do not match your bag.");
  const result: Record<string, GiftPersonalization[]> = {};
  for (const { product, quantity } of items) {
    const entries = input[product.id];
    if (!Array.isArray(entries) || entries.length !== quantity) throw Error(`Review the choices for ${product.name}.`);
    const choices = product.colorOptions || [];
    result[product.id] = entries.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw Error("Please check your gift choices.");
      const row = entry as Record<string, unknown>;
      const color = cleanText(row.color, "colour", 40);
      if (choices.length ? !choices.some((choice) => choice.name === color) : color !== "As pictured")
        throw Error(`The colours for ${product.name} have changed. Refresh checkout and choose again.`);
      const recipientName = cleanText(row.recipientName, "recipient's name", 60);
      const occasion = cleanText(row.occasion, "occasion", 40);
      const message = cleanMessage(row.message);
      if (occasion && !occasions.includes(occasion as typeof occasions[number])) throw Error("Please choose an occasion from the list.");
      if (row.hidePrice !== true && row.hidePrice !== false) throw Error("Please check the gift packaging choice.");
      return { color, recipientName, occasion, message, hidePrice: row.hidePrice };
    });
  }
  return result;
}

export function savedPersonalizations(snapshot: Record<string, unknown>, slug: string): GiftPersonalization[] {
  const saved = snapshot.personalizations;
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return [];
  const entries = (saved as Record<string, unknown>)[slug];
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry): entry is GiftPersonalization => !!entry && typeof entry === "object" &&
    typeof entry.color === "string" && typeof entry.recipientName === "string" &&
    typeof entry.occasion === "string" && typeof entry.message === "string" &&
    typeof entry.hidePrice === "boolean");
}
