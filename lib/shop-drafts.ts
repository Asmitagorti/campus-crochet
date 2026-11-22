import type { Product } from "./catalog";
import { deliveryChargePaise } from "./delivery-policy";
import { productCategoryNames } from "./product-categories";

export type ProductDraftRow = {
  draft_id: string;
  slug: string;
  revision: number;
  data: Record<string, unknown>;
};

export function draftProductFromRow(row: ProductDraftRow): Product {
  const data = row.data || {};
  const categories = productCategoryNames({
    category: typeof data.category === "string" ? data.category : "",
    categories: Array.isArray(data.categories) ? data.categories as string[] : [],
  });
  return {
    id: row.slug,
    databaseId: row.draft_id,
    name: String(data.name || ""),
    note: String(data.note || ""),
    category: categories[0] || "",
    categories,
    description: String(data.description || ""),
    price: Number(data.price || 0),
    stock: data.stock == null ? null : Number(data.stock),
    packedWeightGrams: data.packedWeightGrams == null ? null : Number(data.packedWeightGrams),
    active: data.active === true,
    madeToOrder: false,
    revision: row.revision,
    details: Array.isArray(data.details) ? data.details as [string, string][] : [],
    colors: Array.isArray(data.colors) ? data.colors as string[] : [],
    gallery: Array.isArray(data.gallery) ? data.gallery as string[] : [],
  };
}

export function previewCheckoutTotal(items: { price: number; quantity: number }[], addressChoice: "Others" | "Aditya Surampalem") {
  const subtotalPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const deliveryPaise = deliveryChargePaise(subtotalPaise, addressChoice === "Others");
  return { subtotalPaise, deliveryPaise, totalPaise: subtotalPaise + deliveryPaise };
}
