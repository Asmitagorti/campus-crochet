import { maxQuantity, type Product } from "./catalog";

export function resolveCheckoutItems(raw: unknown, products: Product[]) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) throw Error("Your bag is empty or invalid.");
  const seen = new Set<string>();
  return raw.map((item: unknown) => {
    const line = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const product = products.find((row) => row.id === line.id);
    if (!product?.databaseId || seen.has(product.id) || !Number.isInteger(line.quantity) ||
      (line.quantity as number) < 1 || (line.quantity as number) > maxQuantity(product))
      throw Error("Please check the quantities in your bag.");
    seen.add(product.id);
    return { productId: product.databaseId, quantity: line.quantity as number, color: "Default", price: product.price };
  }).sort((a, b) => a.productId.localeCompare(b.productId));
}
