import type { Product } from "./catalog";

export function defaultCartColor(product: Product) {
  return product.colorOptions?.[0]?.name || "As pictured";
}

export function cartColorsFor(product: Product, quantity: number, raw: unknown) {
  const fallback = defaultCartColor(product);
  const allowed = new Set(product.colorOptions?.map((option) => option.name) || [fallback]);
  const saved = Array.isArray(raw) ? raw.slice(-quantity) : [];
  return Array.from({ length: quantity }, (_, index) =>
    typeof saved[index] === "string" && allowed.has(saved[index]) ? saved[index] : fallback);
}

export function parseCartColors(product: Product, quantity: number, raw: unknown) {
  if (raw == null) return cartColorsFor(product, quantity, null);
  if (!Array.isArray(raw) || raw.length !== quantity ||
    raw.some((color) => typeof color !== "string" ||
      !(product.colorOptions?.some((option) => option.name === color) ||
        (!product.colorOptions?.length && color === "As pictured"))))
    throw Error(`The colours for ${product.name} have changed. Refresh your bag and choose again.`);
  return raw as string[];
}
